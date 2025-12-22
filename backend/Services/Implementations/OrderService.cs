using backend.Data;
using backend.DTOs.Common;
using backend.DTOs.OrderManagement;
using backend.Enums;
using backend.Models;
using backend.Services.Helpers;
using backend.Services.Interfaces;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace backend.Services.Implementations;

public class OrderService : IOrderService
{
    private readonly AppDbContext _db;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IOrderNotificationService _notificationService;
    private readonly IUserDiscountService _userDiscountService;
    private static bool _questPdfLicenseConfigured;

    public OrderService(
        AppDbContext db,
        IOrderNotificationService notificationService,
        IServiceScopeFactory scopeFactory,
        IUserDiscountService userDiscountService)
    {
        _db = db;
        _notificationService = notificationService;
        _scopeFactory = scopeFactory;
        _userDiscountService = userDiscountService;
    }

    public async Task<OrderDto> CreateOrderFromCartAsync(Guid userId, CreateOrderDto request)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null)
        {
            throw new UnauthorizedAccessException("User not found");
        }

        var cart = await _db.Carts
            .Include(c => c.Items)
                .ThenInclude(ci => ci.Product)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart == null || !cart.Items.Any())
        {
            throw new InvalidOperationException("Cart is empty");
        }

        // Generate order number
        var orderNumber = await GenerateOrderNumberAsync();

        // Resolve shipping department with fallback to the first department that actually has inventory snapshots
        var candidateDepartmentIds = new List<Guid>();
        if (request.ShippingDepartmentId.HasValue)
        {
            candidateDepartmentIds.Add(request.ShippingDepartmentId.Value);
        }
        if (user.DepartmentShopId.HasValue && !candidateDepartmentIds.Contains(user.DepartmentShopId.Value))
        {
            candidateDepartmentIds.Add(user.DepartmentShopId.Value);
        }
        if (user.DefaultBranchId.HasValue && !candidateDepartmentIds.Contains(user.DefaultBranchId.Value))
        {
            candidateDepartmentIds.Add(user.DefaultBranchId.Value);
        }

        if (candidateDepartmentIds.Count == 0)
        {
            throw new InvalidOperationException("Не вказано підрозділ відвантаження для замовлення.");
        }

        var productIds = cart.Items.Select(ci => ci.ProductId).Distinct().ToList();
        var shippingDepartmentId = candidateDepartmentIds[0];

        if (productIds.Count > 0)
        {
            var departmentsWithStock = await _db.InventorySnapshots
                .Where(snapshot => candidateDepartmentIds.Contains(snapshot.DepartmentId) && productIds.Contains(snapshot.ProductId))
                .Select(snapshot => snapshot.DepartmentId)
                .Distinct()
                .ToListAsync();

            var matched = departmentsWithStock
                .OrderBy(id => candidateDepartmentIds.IndexOf(id))
                .FirstOrDefault();

            if (matched != Guid.Empty)
            {
                shippingDepartmentId = matched;
            }
        }

        // Calculate totals
        var totalQuantity = cart.Items.Sum(ci => ci.Quantity);
        var totalWeight = cart.Items.Sum(ci => ci.WeightSnapshot * ci.Quantity);
        var totalVolume = cart.Items.Sum(ci => ci.VolumeSnapshot * ci.Quantity);
        var totalPrice = cart.Items.Sum(ci => ci.PriceSnapshot * ci.Quantity);
        var totalDiscountedPrice = cart.Items.Sum(ci => ci.PriceWithDiscountSnapshot * ci.Quantity);

        await ReserveInventoryAsync(shippingDepartmentId, cart.Items);

        // Create order
        var order = new Order
        {
            OrderNumber = orderNumber,
            CreatedByUserId = userId,
            ShippingDepartmentId = shippingDepartmentId,
            Status = OrderStatus.Submitted,
            OrderType = request.OrderType,
            PaymentMethod = request.PaymentMethod,
            Comment = request.Comment,
            TotalQuantity = totalQuantity,
            TotalWeight = totalWeight,
            TotalVolume = totalVolume,
            TotalPrice = totalPrice,
            TotalDiscountedPrice = totalDiscountedPrice,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Create order items from cart items
        foreach (var cartItem in cart.Items)
        {
            var orderItem = new OrderItem
            {
                OrderId = order.Id,
                ProductId = cartItem.ProductId,
                ProductCodeSnapshot = cartItem.Product?.Sku ?? string.Empty,
                ProductNameSnapshot = cartItem.Product?.Name ?? string.Empty,
                PriceSnapshot = cartItem.PriceSnapshot,
                DiscountPercentSnapshot = cartItem.DiscountPercentSnapshot,
                PriceWithDiscountSnapshot = cartItem.PriceWithDiscountSnapshot,
                Quantity = cartItem.Quantity,
                WeightSnapshot = cartItem.WeightSnapshot,
                VolumeSnapshot = cartItem.VolumeSnapshot,
                LineTotal = cartItem.PriceWithDiscountSnapshot * cartItem.Quantity
            };
            order.Items.Add(orderItem);
        }

        _db.Orders.Add(order);

        // Clear the cart
        cart.Items.Clear();
        cart.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        // Send notifications asynchronously using a fresh scoped service
        _ = Task.Run(async () => await SendNotificationsInNewScopeAsync(order.Id));

        return await MapToOrderDtoAsync(order);
    }

    private async Task SendNotificationsInNewScopeAsync(Guid orderId)
    {
        using var scope = _scopeFactory.CreateScope();
        var notificationService = scope.ServiceProvider.GetRequiredService<IOrderNotificationService>();
        await notificationService.SendOrderNotificationsAsync(orderId);
    }

    public async Task<OrderHistoryResponseDto> GetOrderHistoryAsync(Guid userId, OrderHistoryFilterDto filter)
    {
        var (orders, totalCount) = await QueryOrderHistoryAsync(userId, filter, applyPagination: true);

        var orderDtos = new List<OrderDto>();
        foreach (var order in orders)
        {
            orderDtos.Add(await MapToOrderDtoAsync(order));
        }

        return new OrderHistoryResponseDto
        {
            Orders = orderDtos,
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize
        };
    }

    public async Task<OrderDto> GetOrderByIdAsync(Guid userId, Guid orderId)
    {
        var order = await _db.Orders
            .Include(o => o.CreatedByUser)
            .Include(o => o.ShippingDepartment)
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null)
        {
            throw new KeyNotFoundException($"Order with ID {orderId} not found");
        }

        // Verify access
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
        {
            throw new UnauthorizedAccessException("User not found");
        }

        var roles = user.Roles ?? Array.Empty<int>();
        var isAdmin = roles.Contains(2);
        var isManager = roles.Contains(1);
        var isDepartment = roles.Contains(3);

        if (!isAdmin)
        {
            if (isDepartment)
            {
                // Department users can see orders from their department
                if (order.CreatedByUser!.DepartmentShopId != user.DepartmentShopId)
                {
                    throw new UnauthorizedAccessException("Access denied to this order");
                }
            }
            else if (isManager)
            {
                // Managers can see orders from users they manage
                if (order.CreatedByUserId != userId && order.CreatedByUser?.ManagerUserId != userId)
                {
                    throw new UnauthorizedAccessException("Access denied to this order");
                }
            }
            else
            {
                // Regular users see only their own orders
                if (order.CreatedByUserId != userId)
                {
                    throw new UnauthorizedAccessException("Access denied to this order");
                }
            }
        }

        return await MapToOrderDtoAsync(order);
    }

    public async Task<OrderDto> RepeatOrderAsync(Guid userId, Guid orderId)
    {
        var originalOrder = await GetOrderByIdAsync(userId, orderId);

        // Get or create cart
        var cart = await _db.Carts
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart == null)
        {
            cart = new Cart
            {
                UserId = userId,
                UpdatedAt = DateTime.UtcNow
            };
            _db.Carts.Add(cart);
            await _db.SaveChangesAsync();
        }

        await _db.CartItems
            .Where(item => item.CartId == cart.Id)
            .ExecuteDeleteAsync();

        var orderLines = originalOrder.Items
            .Where(item => item.Quantity > 0)
            .GroupBy(item => item.ProductId)
            .Select(group => new
            {
                ProductId = group.Key,
                Quantity = group.Sum(x => x.Quantity)
            })
            .ToList();

        var productIds = orderLines.Select(item => item.ProductId).ToList();
        var products = await _db.Products
            .Where(product => productIds.Contains(product.Id))
            .Select(product => new
            {
                product.Id,
                product.Price,
                product.Weight,
                product.Volume,
                product.ProductGroupId
            })
            .ToDictionaryAsync(product => product.Id);

        var discountSnapshot = await _userDiscountService.BuildUserDiscountSnapshotAsync(userId);

        foreach (var line in orderLines)
        {
            if (!products.TryGetValue(line.ProductId, out var product))
            {
                continue;
            }

            var percent = _userDiscountService.ResolveDiscountPercent(discountSnapshot, product.ProductGroupId);
            var priceWithDiscount = DiscountMath.ApplyPercent(product.Price, percent);

            _db.CartItems.Add(new CartItem
            {
                CartId = cart.Id,
                ProductId = line.ProductId,
                Quantity = line.Quantity,
                PriceSnapshot = product.Price,
                DiscountPercentSnapshot = percent,
                PriceWithDiscountSnapshot = priceWithDiscount,
                WeightSnapshot = product.Weight,
                VolumeSnapshot = product.Volume,
                AddedAt = DateTime.UtcNow
            });
        }

        cart.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return originalOrder;
    }

    public async Task<List<OrderUserDto>> GetAvailableUsersForFilteringAsync(Guid userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            throw new UnauthorizedAccessException("User not found");
        }

        var roles = user.Roles ?? Array.Empty<int>();
        var isAdmin = roles.Contains(2);
        var isManager = roles.Contains(1);

        IQueryable<User> usersQuery;

        if (isAdmin)
        {
            // Admin sees all users
            usersQuery = _db.Users
                .OrderBy(u => u.FirstName)
                .ThenBy(u => u.LastName);
        }
        else if (isManager)
        {
            // Manager sees themselves + users they manage
            var managedUserIds = await _db.Users
                .Where(u => u.ManagerUserId == userId)
                .Select(u => u.Id)
                .ToListAsync();
            
            usersQuery = _db.Users
                .Where(u => u.Id == userId || managedUserIds.Contains(u.Id))
                .OrderBy(u => u.FirstName)
                .ThenBy(u => u.LastName);
        }
        else
        {
            // Regular user sees only themselves
            usersQuery = _db.Users.Where(u => u.Id == userId);
        }

        var users = await usersQuery.ToListAsync();

        return users.Select(u => new OrderUserDto
        {
            Id = u.Id,
            FirstName = u.FirstName,
            LastName = u.LastName,
            Email = u.Email
        }).ToList();
    }

    public async Task<byte[]> ExportOrderHistoryToExcelAsync(Guid userId, OrderHistoryFilterDto filter)
    {
        var (orders, _) = await QueryOrderHistoryAsync(userId, filter, applyPagination: false);

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Orders");
        var headers = new[]
        {
            "Номер",
            "Дата",
            "Користувач",
            "Тип",
            "Оплата",
            "Кількість",
            "Вага (кг)",
            "Об'єм (м³)",
            "Сума без знижки",
            "Сума зі знижкою"
        };

        for (var i = 0; i < headers.Length; i++)
        {
            worksheet.Cell(1, i + 1).Value = headers[i];
            worksheet.Cell(1, i + 1).Style.Font.SetBold();
            worksheet.Cell(1, i + 1).Style.Fill.SetBackgroundColor(XLColor.FromHtml("#EFF6FF"));
        }

        for (var index = 0; index < orders.Count; index++)
        {
            var order = orders[index];
            var rowNumber = index + 2;
            worksheet.Cell(rowNumber, 1).Value = order.OrderNumber;
            worksheet.Cell(rowNumber, 2).Value = order.CreatedAt.ToLocalTime();
            worksheet.Cell(rowNumber, 3).Value = order.CreatedByUser?.Email ?? order.CreatedByUser?.FirstName ?? "—";
            worksheet.Cell(rowNumber, 4).Value = order.OrderType ?? "—";
            worksheet.Cell(rowNumber, 5).Value = order.PaymentMethod ?? "—";
            worksheet.Cell(rowNumber, 6).Value = order.TotalQuantity;
            worksheet.Cell(rowNumber, 7).Value = order.TotalWeight;
            worksheet.Cell(rowNumber, 8).Value = order.TotalVolume;
            worksheet.Cell(rowNumber, 9).Value = order.TotalPrice;
            worksheet.Cell(rowNumber, 10).Value = order.TotalDiscountedPrice;
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> ExportOrderHistoryToPdfAsync(Guid userId, OrderHistoryFilterDto filter)
    {
        EnsureQuestPdfLicense();
        var (orders, _) = await QueryOrderHistoryAsync(userId, filter, applyPagination: false);

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(30);
                page.Header().Text("Історія замовлень").FontSize(18).SemiBold();
                page.Content().PaddingVertical(10).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(80);
                        columns.RelativeColumn();
                        columns.ConstantColumn(90);
                        columns.ConstantColumn(80);
                        columns.ConstantColumn(90);
                    });

                    void HeaderCell(IContainer cell, string text) => cell
                        .Background(Colors.Grey.Lighten3)
                        .Padding(4)
                        .Text(text)
                        .FontSize(10)
                        .SemiBold();

                    void BodyCell(IContainer cell, string text) => cell
                        .BorderBottom(1)
                        .BorderColor(Colors.Grey.Lighten4)
                        .Padding(4)
                        .Text(text)
                        .FontSize(9);

                    table.Header(header =>
                    {
                        HeaderCell(header.Cell(), "Номер");
                        HeaderCell(header.Cell(), "Дата");
                        HeaderCell(header.Cell(), "Оплата");
                        HeaderCell(header.Cell(), "К-сть");
                        HeaderCell(header.Cell(), "Сума");
                    });

                    foreach (var order in orders)
                    {
                        BodyCell(table.Cell(), order.OrderNumber ?? "—");
                        BodyCell(table.Cell(), order.CreatedAt.ToLocalTime().ToString("dd.MM.yyyy HH:mm"));
                        BodyCell(table.Cell(), order.PaymentMethod ?? "—");
                        BodyCell(table.Cell(), order.TotalQuantity.ToString("0.##"));
                        BodyCell(table.Cell(), order.TotalDiscountedPrice.ToString("0.00"));
                    }
                });
            });
        });

        using var stream = new MemoryStream();
        document.GeneratePdf(stream);
        return stream.ToArray();
    }

    public async Task<FileDownloadDto> ExportOrderToExcelAsync(Guid userId, Guid orderId)
    {
        var order = await GetOrderByIdAsync(userId, orderId);

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Order");

        worksheet.Cell(1, 1).Value = "Номер";
        worksheet.Cell(1, 2).Value = order.OrderNumber;

        worksheet.Cell(2, 1).Value = "Дата";
        worksheet.Cell(2, 2).Value = order.CreatedAt.ToLocalTime();

        worksheet.Cell(3, 1).Value = "Клієнт";
        worksheet.Cell(3, 2).Value = order.Customer?.Name ?? "—";

        worksheet.Cell(4, 1).Value = "Створив";
        worksheet.Cell(4, 2).Value = order.CreatedBy?.Email ?? order.CreatedBy?.FullName ?? "—";

        worksheet.Cell(5, 1).Value = "Оплата";
        worksheet.Cell(5, 2).Value = order.PaymentMethod;

        worksheet.Cell(6, 1).Value = "Тип";
        worksheet.Cell(6, 2).Value = order.OrderType;

        worksheet.Cell(7, 1).Value = "Коментар";
        worksheet.Cell(7, 2).Value = order.Comment ?? "—";

        worksheet.Cell(8, 1).Value = "Точка відвантаження";
        worksheet.Cell(8, 2).Value = order.ShippingDepartment?.Name ?? "—";

        var headerRow = 10;

        worksheet.Cell(headerRow, 1).Value = "Код";
        worksheet.Cell(headerRow, 2).Value = "Найменування";
        worksheet.Cell(headerRow, 3).Value = "Ціна";
        worksheet.Cell(headerRow, 4).Value = "Знижка %";
        worksheet.Cell(headerRow, 5).Value = "Ціна зі знижкою";
        worksheet.Cell(headerRow, 6).Value = "К-сть";
        worksheet.Cell(headerRow, 7).Value = "Сума";

        for (var col = 1; col <= 7; col++)
        {
            worksheet.Cell(headerRow, col).Style.Font.SetBold();
            worksheet.Cell(headerRow, col).Style.Fill.SetBackgroundColor(XLColor.FromHtml("#EFF6FF"));
        }

        var row = headerRow + 1;
        foreach (var item in order.Items)
        {
            worksheet.Cell(row, 1).Value = item.ProductCode;
            worksheet.Cell(row, 2).Value = item.ProductName;
            worksheet.Cell(row, 3).Value = item.Price;
            worksheet.Cell(row, 4).Value = item.DiscountPercent;
            worksheet.Cell(row, 5).Value = item.PriceWithDiscount;
            worksheet.Cell(row, 6).Value = item.Quantity;
            worksheet.Cell(row, 7).Value = item.LineTotal;
            row++;
        }

        row += 1;

        worksheet.Cell(row, 5).Value = "Підсумок";
        worksheet.Cell(row, 6).Value = order.Totals.TotalQuantity;
        worksheet.Cell(row, 7).Value = order.Totals.TotalDiscountedPrice;
        worksheet.Cell(row, 5).Style.Font.SetBold();
        worksheet.Cell(row, 7).Style.Font.SetBold();

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);

        return new FileDownloadDto
        {
            FileName = $"order-{order.OrderNumber}-{DateTime.UtcNow:yyyyMMddHHmm}.xlsx",
            ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            Content = stream.ToArray()
        };
    }

    public async Task<FileDownloadDto> ExportOrderToPdfAsync(Guid userId, Guid orderId)
    {
        EnsureQuestPdfLicense();
        var order = await GetOrderByIdAsync(userId, orderId);

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header()
                    .Column(column =>
                    {
                        column.Item().Text($"Замовлення № {order.OrderNumber}").FontSize(16).SemiBold();
                        column.Item().Text($"Дата: {order.CreatedAt.ToLocalTime():dd.MM.yyyy HH:mm}");
                        column.Item().Text($"Клієнт: {order.Customer?.Name ?? "—"}");
                        column.Item().Text($"Оплата: {order.PaymentMethod} · Тип: {order.OrderType}");
                        if (!string.IsNullOrWhiteSpace(order.ShippingDepartment?.Name))
                        {
                            column.Item().Text($"Точка відвантаження: {order.ShippingDepartment.Name}");
                        }
                        if (!string.IsNullOrWhiteSpace(order.Comment))
                        {
                            column.Item().Text($"Коментар: {order.Comment}");
                        }
                    });

                page.Content()
                    .PaddingVertical(10)
                    .Column(column =>
                    {
                        column.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.ConstantColumn(80);
                                columns.RelativeColumn();
                                columns.ConstantColumn(60);
                                columns.ConstantColumn(60);
                                columns.ConstantColumn(70);
                            });

                            void HeaderCell(IContainer cell, string text) => cell
                                .Background(Colors.Grey.Lighten3)
                                .Padding(4)
                                .Text(text)
                                .FontSize(10)
                                .SemiBold();

                            void BodyCell(IContainer cell, string text) => cell
                                .BorderBottom(1)
                                .BorderColor(Colors.Grey.Lighten4)
                                .Padding(4)
                                .Text(text)
                                .FontSize(9);

                            table.Header(header =>
                            {
                                HeaderCell(header.Cell(), "Код");
                                HeaderCell(header.Cell(), "Найменування");
                                HeaderCell(header.Cell(), "Ціна");
                                HeaderCell(header.Cell(), "К-сть");
                                HeaderCell(header.Cell(), "Сума");
                            });

                            foreach (var item in order.Items)
                            {
                                BodyCell(table.Cell(), item.ProductCode ?? "—");
                                BodyCell(table.Cell(), item.ProductName ?? "—");
                                BodyCell(table.Cell(), item.PriceWithDiscount.ToString("0.00"));
                                BodyCell(table.Cell(), item.Quantity.ToString("0.##"));
                                BodyCell(table.Cell(), item.LineTotal.ToString("0.00"));
                            }
                        });

                        column.Item().PaddingTop(8).AlignRight().Text($"Разом: {order.Totals.TotalQuantity:0.##} · {order.Totals.TotalDiscountedPrice:0.00}")
                            .SemiBold();
                    });
            });
        });

        using var stream = new MemoryStream();
        document.GeneratePdf(stream);

        return new FileDownloadDto
        {
            FileName = $"order-{order.OrderNumber}-{DateTime.UtcNow:yyyyMMddHHmm}.pdf",
            ContentType = "application/pdf",
            Content = stream.ToArray()
        };
    }

    private async Task<(List<Order> orders, int totalCount)> QueryOrderHistoryAsync(Guid userId, OrderHistoryFilterDto filter, bool applyPagination)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new UnauthorizedAccessException("User not found");

        var query = _db.Orders
            .Include(o => o.CreatedByUser)
            .Include(o => o.ShippingDepartment)
            .Include(o => o.Items)
            .AsQueryable();

        var roles = user.Roles ?? Array.Empty<int>();
        var isAdmin = roles.Contains(2);
        var isManager = roles.Contains(1);
        var isDepartment = roles.Contains(3);

        var scope = filter.VisibilityScope?.Trim().ToLowerInvariant();
        var needsManagedUserIds = isManager || (isAdmin && (scope == "managed" || scope == "my-and-managed"));
        List<Guid> managedUserIds = new();

        if (needsManagedUserIds)
        {
            managedUserIds = await _db.Users
                .Where(u => u.ManagerUserId == userId)
                .Select(u => u.Id)
                .ToListAsync();
        }

        if (!isAdmin)
        {
            if (isDepartment)
            {
                query = query.Where(o => o.CreatedByUser!.DepartmentShopId == user.DepartmentShopId);
            }
            else if (isManager)
            {
                query = query.Where(o =>
                    o.CreatedByUserId == userId ||
                    managedUserIds.Contains(o.CreatedByUserId));
            }
            else
            {
                query = query.Where(o => o.CreatedByUserId == userId);
            }
        }

        if (!string.IsNullOrWhiteSpace(scope))
        {
            switch (scope)
            {
                case "my":
                    query = query.Where(o => o.CreatedByUserId == userId);
                    break;
                case "managed":
                    query = managedUserIds.Count > 0
                        ? query.Where(o => managedUserIds.Contains(o.CreatedByUserId))
                        : query.Where(o => false);
                    break;
                case "my-and-managed":
                    query = managedUserIds.Count > 0
                        ? query.Where(o => o.CreatedByUserId == userId || managedUserIds.Contains(o.CreatedByUserId))
                        : query.Where(o => o.CreatedByUserId == userId);
                    break;
                case "all":
                    break;
            }
        }

        if (filter.CreatedByUserId.HasValue)
        {
            query = query.Where(o => o.CreatedByUserId == filter.CreatedByUserId.Value);
        }

        if (filter.StartDate.HasValue)
        {
            query = query.Where(o => o.CreatedAt >= filter.StartDate.Value);
        }

        if (filter.EndDate.HasValue)
        {
            query = query.Where(o => o.CreatedAt <= filter.EndDate.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.OrderType))
        {
            query = query.Where(o => o.OrderType == filter.OrderType);
        }

        if (!string.IsNullOrWhiteSpace(filter.PaymentMethod))
        {
            query = query.Where(o => o.PaymentMethod == filter.PaymentMethod);
        }

        var totalCount = await query.CountAsync();

        query = query.OrderByDescending(o => o.CreatedAt);

        if (applyPagination)
        {
            query = query
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize);
        }

        var orders = await query.ToListAsync();
        return (orders, totalCount);
    }

    private static void EnsureQuestPdfLicense()
    {
        if (_questPdfLicenseConfigured)
        {
            return;
        }

        QuestPDF.Settings.License = LicenseType.Community;
        _questPdfLicenseConfigured = true;
    }

    private async Task<string> GenerateOrderNumberAsync()
    {
        var year = DateTime.UtcNow.Year;
        var lastOrder = await _db.Orders
            .Where(o => o.OrderNumber.StartsWith($"ORD-{year}-"))
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastOrder != null)
        {
            var parts = lastOrder.OrderNumber.Split('-');
            if (parts.Length == 3 && int.TryParse(parts[2], out var lastNumber))
            {
                nextNumber = lastNumber + 1;
            }
        }

        return $"ORD-{year}-{nextNumber:D6}";
    }

    private async Task ReserveInventoryAsync(Guid departmentId, IEnumerable<CartItem> cartItems)
    {
        if (cartItems == null)
        {
            return;
        }

        var requests = cartItems
            .Where(item => item.Quantity > 0)
            .GroupBy(item => item.ProductId)
            .Select(group => new
            {
                ProductId = group.Key,
                Quantity = group.Sum(item => item.Quantity),
                Sample = group.First()
            })
            .ToList();

        if (requests.Count == 0)
        {
            return;
        }

        var productIds = requests.Select(r => r.ProductId).ToList();

        var inventoryEntries = await _db.InventorySnapshots
            .Where(snapshot => snapshot.DepartmentId == departmentId && productIds.Contains(snapshot.ProductId))
            .OrderBy(snapshot => snapshot.CapturedAt)
            .ToListAsync();

        var now = DateTime.UtcNow;

        foreach (var request in requests)
        {
            var entries = inventoryEntries.Where(entry => entry.ProductId == request.ProductId).ToList();
            var available = entries.Sum(entry => entry.AvailableQuantity);

            // If there is no stock recorded, skip reservation but still allow order creation
            if (!entries.Any() || available <= 0)
            {
                continue;
            }

            // Reserve only what is available; do not block order when stock is insufficient
            var remaining = Math.Min(request.Quantity, available);

            foreach (var entry in entries)
            {
                if (remaining <= 0)
                {
                    break;
                }

                var deduction = Math.Min(entry.AvailableQuantity, remaining);
                entry.AvailableQuantity -= deduction;
                entry.CapturedAt = now;
                remaining -= deduction;
            }
        }
    }

    private async Task<OrderDto> MapToOrderDtoAsync(Order order)
    {
        // Ensure navigation properties are loaded
        await _db.Entry(order).Reference(o => o.CreatedByUser).LoadAsync();
        await _db.Entry(order).Reference(o => o.ShippingDepartment).LoadAsync();
        await _db.Entry(order).Collection(o => o.Items).LoadAsync();

        return new OrderDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            Status = order.Status,
            OrderType = order.OrderType,
            PaymentMethod = order.PaymentMethod,
            Comment = order.Comment,
            CreatedAt = order.CreatedAt,
            UpdatedAt = order.UpdatedAt,
            Customer = order.CreatedByUser != null ? new OrderCustomerDto
            {
                Id = order.CreatedByUser.Id,
                Code = order.CreatedByUser.CompanyCode,
                Name = order.CreatedByUser.Company,
                Email = order.CreatedByUser.Email,
                Phone = order.CreatedByUser.Phone
            } : new OrderCustomerDto(),
            CreatedBy = order.CreatedByUser != null ? new OrderUserDto
            {
                Id = order.CreatedByUser.Id,
                FirstName = order.CreatedByUser.FirstName,
                LastName = order.CreatedByUser.LastName,
                Email = order.CreatedByUser.Email
            } : new OrderUserDto(),
            Manager = order.CreatedByUser?.ManagerUser != null ? new OrderUserDto
            {
                Id = order.CreatedByUser.ManagerUser.Id,
                FirstName = order.CreatedByUser.ManagerUser.FirstName,
                LastName = order.CreatedByUser.ManagerUser.LastName,
                Email = order.CreatedByUser.ManagerUser.Email
            } : null,
            ShippingDepartment = order.ShippingDepartment != null ? new OrderDepartmentDto
            {
                Id = order.ShippingDepartment.Id,
                Code = order.ShippingDepartment.Code,
                Name = order.ShippingDepartment.Name
            } : null,
            Items = order.Items.Select(oi => new OrderItemDto
            {
                Id = oi.Id,
                ProductId = oi.ProductId,
                ProductCode = oi.ProductCodeSnapshot,
                ProductName = oi.ProductNameSnapshot,
                Price = oi.PriceSnapshot,
                DiscountPercent = oi.DiscountPercentSnapshot,
                PriceWithDiscount = oi.PriceWithDiscountSnapshot,
                Quantity = oi.Quantity,
                Weight = oi.WeightSnapshot,
                Volume = oi.VolumeSnapshot,
                LineTotal = oi.LineTotal
            }).ToList(),
            Totals = new OrderTotalsDto
            {
                TotalQuantity = order.TotalQuantity,
                TotalWeight = order.TotalWeight,
                TotalVolume = order.TotalVolume,
                TotalPrice = order.TotalPrice,
                TotalDiscountedPrice = order.TotalDiscountedPrice
            }
        };
    }
}
