using backend.Data;
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

        // Determine shipping department: prefer explicit request, then user's shop, then user's default branch
        var shippingDepartmentId = request.ShippingDepartmentId
            ?? user.DepartmentShopId
            ?? user.DefaultBranchId;

        if (shippingDepartmentId == null)
        {
            throw new InvalidOperationException("Не вказано підрозділ відвантаження для замовлення.");
        }

        // Calculate totals
        var totalQuantity = cart.Items.Sum(ci => ci.Quantity);
        var totalWeight = cart.Items.Sum(ci => ci.WeightSnapshot * ci.Quantity);
        var totalVolume = cart.Items.Sum(ci => ci.VolumeSnapshot * ci.Quantity);
        var totalPrice = cart.Items.Sum(ci => ci.PriceSnapshot * ci.Quantity);
        var totalDiscountedPrice = cart.Items.Sum(ci => ci.PriceWithDiscountSnapshot * ci.Quantity);

        await ReserveInventoryAsync(shippingDepartmentId.Value, cart.Items);

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
        var originalOrder = await _db.Orders
            .Include(o => o.Items)
                .ThenInclude(oi => oi.Product)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (originalOrder == null)
        {
            throw new KeyNotFoundException($"Order with ID {orderId} not found");
        }

        // Verify access (same logic as GetOrderByIdAsync)
        if (originalOrder.CreatedByUserId != userId)
        {
            throw new UnauthorizedAccessException("Can only repeat your own orders");
        }

        // Get or create cart
        var cart = await _db.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart == null)
        {
            cart = new Cart
            {
                UserId = userId,
                UpdatedAt = DateTime.UtcNow
            };
            _db.Carts.Add(cart);
        }

        // Clear existing cart items
        cart.Items.Clear();

        var discountSnapshot = await _userDiscountService.BuildUserDiscountSnapshotAsync(userId);

        // Add items from original order to cart
        foreach (var orderItem in originalOrder.Items)
        {
            // Get current product data
            var product = await _db.Products.FindAsync(orderItem.ProductId);
            if (product != null)
            {
                var percent = _userDiscountService.ResolveDiscountPercent(discountSnapshot, product.ProductGroupId);
                var priceWithDiscount = DiscountMath.ApplyPercent(product.Price, percent);

                var cartItem = new CartItem
                {
                    CartId = cart.Id,
                    ProductId = orderItem.ProductId,
                    Quantity = orderItem.Quantity,
                    PriceSnapshot = product.Price,
                    DiscountPercentSnapshot = percent,
                    PriceWithDiscountSnapshot = priceWithDiscount,
                    WeightSnapshot = product.Weight,
                    VolumeSnapshot = product.Volume,
                    AddedAt = DateTime.UtcNow
                };
                cart.Items.Add(cartItem);
            }
        }

        cart.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return await MapToOrderDtoAsync(originalOrder);
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
