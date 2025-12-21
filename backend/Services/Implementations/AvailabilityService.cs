using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using backend.Data;
using backend.DTOs.Availability;
using backend.DTOs.Common;
using backend.Enums;
using backend.Models;using ClosedXML.Excel;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

using backend.Services.Interfaces;

namespace backend.Services.Implementations;

public class AvailabilityService : IAvailabilityService
{
    private readonly AppDbContext _db;

    static AvailabilityService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public AvailabilityService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<AvailabilityBranchDto>> GetBranchesAsync(Guid userId)
    {
        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        var departmentsQuery = _db.Departments
            .AsNoTracking()
            .Where(department => department.Type == DepartmentType.Branch
                                  || department.Type == DepartmentType.Store);

        if (!IsManagerOrAdmin(user))
        {
            var allowedDepartmentIds = new List<Guid>();

            if (user.DepartmentShopId.HasValue)
            {
                allowedDepartmentIds.Add(user.DepartmentShopId.Value);
            }

            if (user.DefaultBranchId.HasValue)
            {
                allowedDepartmentIds.Add(user.DefaultBranchId.Value);
            }

            if (allowedDepartmentIds.Count == 0)
            {
                return Array.Empty<AvailabilityBranchDto>();
            }

            departmentsQuery = departmentsQuery.Where(department => allowedDepartmentIds.Contains(department.Id));
        }

        var branches = await (
                from department in departmentsQuery
                join branch in _db.Branches.AsNoTracking()
                    on department.BranchId equals (Guid?)branch.Id into branchGroup
                from branch in branchGroup.DefaultIfEmpty()
                join parentBranch in _db.Branches.AsNoTracking()
                    on department.SourceBranchId equals (Guid?)parentBranch.Id into parentBranchGroup
                from parentBranch in parentBranchGroup.DefaultIfEmpty()
                orderby department.Type, department.Code, department.Name
                select new AvailabilityBranchDto
                {
                    Id = department.Id,
                    Code = !string.IsNullOrWhiteSpace(department.Code)
                        ? department.Code
                        : branch != null ? branch.Code : string.Empty,
                    Name = !string.IsNullOrWhiteSpace(department.Name)
                        ? department.Name
                        : branch != null ? branch.Name : string.Empty,
                    DisplayName = BuildDepartmentDisplayName(department),
                    Category = department.Type == DepartmentType.Store ? "shop" : "branch",
                    ParentBranchId = department.Type == DepartmentType.Store
                        ? (department.SourceBranchId ?? department.BranchId)
                        : null,
                    ParentDisplayName = department.Type == DepartmentType.Store
                        ? parentBranch != null
                            ? BuildBranchDisplayName(parentBranch)
                            : branch != null
                                ? BuildBranchDisplayName(branch)
                                : string.Empty
                        : string.Empty
                })
            .ToListAsync();

        return branches;
    }

    public async Task<IReadOnlyList<AvailabilityDirectionDto>> GetDirectionsAsync(Guid userId, Guid? branchId)
    {
        var access = await ResolveAccessAsync(userId);

        var directionsQuery = _db.ProductDirections
            .AsNoTracking();

        if (!access.HasFullAccess)
        {
            var allowedDirectionIdsQuery = _db.ProductGroups
                .AsNoTracking()
                .Where(pg => access.AllowedGroupIds.Contains(pg.Id))
                .Select(pg => pg.DirectionId)
                .Distinct();

            directionsQuery = directionsQuery.Where(direction => allowedDirectionIdsQuery.Contains(direction.Id));
        }

        var directions = await directionsQuery
            .OrderBy(direction => direction.SortOrder)
            .ThenBy(direction => direction.Title)
            .Select(direction => new AvailabilityDirectionDto
            {
                Id = direction.Id,
                Code = direction.Code,
                Name = direction.Title,
                DisplayName = BuildDirectionDisplayName(direction),
                SortOrder = direction.SortOrder
            })
            .ToListAsync();

        return directions;
    }

    public async Task<IReadOnlyList<AvailabilityGroupDto>> GetGroupsAsync(Guid userId, Guid directionId)
    {
        var access = await ResolveAccessAsync(userId);
        await EnsureDirectionAccessAsync(directionId, access);

        var groupsQuery = _db.ProductGroups
            .AsNoTracking()
            .Where(group => group.DirectionId == directionId);

        if (!access.HasFullAccess)
        {
            groupsQuery = groupsQuery.Where(group => access.AllowedGroupIds.Contains(group.Id));
        }

        var groups = await groupsQuery
            .OrderBy(group => group.SortOrder)
            .ThenBy(group => group.GroupNumber)
            .Select(group => new AvailabilityGroupDto
            {
                Id = group.Id,
                DirectionId = group.DirectionId,
                GroupNumber = group.GroupNumber,
                Name = group.GroupName,
                ProductLine = group.ProductLine,
                SortOrder = group.SortOrder
            })
            .ToListAsync();

        return groups;
    }

    public async Task<AvailabilityProductsResponseDto> GetProductsAsync(Guid userId, Guid departmentId, Guid groupId)
    {
        var group = await _db.ProductGroups
            .AsNoTracking()
            .FirstOrDefaultAsync(pg => pg.Id == groupId);

        if (group == null)
        {
            throw new KeyNotFoundException("Product group not found.");
        }

        var access = await ResolveAccessAsync(userId);
        EnsureGroupAccess(groupId, access);

        var departmentContext = await ResolveDepartmentContextAsync(departmentId);

        var stockQuery = _db.InventorySnapshots
            .AsNoTracking()
            .Where(snapshot => snapshot.DepartmentId == departmentContext.DepartmentId)
            .GroupBy(snapshot => snapshot.ProductId)
            .Select(grouping => new
            {
                ProductId = grouping.Key,
                Quantity = grouping.Sum(x => x.AvailableQuantity),
                LastUpdatedAt = grouping.Max(x => x.CapturedAt)
            });

        var products = await _db.Products
            .AsNoTracking()
            .Where(product => product.ProductGroupId == groupId)
            .GroupJoin(stockQuery, product => product.Id, stock => stock.ProductId,
                (product, stockInfo) => new { product, stock = stockInfo.FirstOrDefault() })
            .OrderBy(x => x.product.GroupSerial)
            .ThenBy(x => x.product.Sku)
            .Select(x => new AvailabilityProductDto
            {
                Id = x.product.Id,
                Code = x.product.Sku,
                Name = x.product.Name,
                AvailableQuantity = x.stock != null ? x.stock.Quantity : 0,
                LastUpdatedAt = x.stock != null ? x.stock.LastUpdatedAt : (DateTime?)null
            })
            .ToListAsync();

        var totalQuantity = products.Sum(product => product.AvailableQuantity);
        var lastUpdatedAt = products.Max(product => product.LastUpdatedAt);

        return new AvailabilityProductsResponseDto
        {
            DepartmentId = departmentContext.DepartmentId,
            DepartmentName = departmentContext.DisplayName,
            GroupId = groupId,
            GroupName = group.GroupName,
            TotalQuantity = totalQuantity,
            LastUpdatedAt = lastUpdatedAt,
            Products = products
        };
    }

    public async Task<GroupAvailabilityTableDto> GetGroupAvailabilityAsync(Guid userId, Guid groupId)
    {
        var group = await _db.ProductGroups
            .AsNoTracking()
            .Include(pg => pg.Direction)
            .FirstOrDefaultAsync(pg => pg.Id == groupId);

        if (group == null)
        {
            throw new KeyNotFoundException("Product group not found.");
        }

        var access = await ResolveAccessAsync(userId);
        EnsureGroupAccess(groupId, access);

        var user = await GetUserOrThrowAsync(userId);
        var departmentContexts = await LoadDepartmentContextsAsync(user);

        var products = await _db.Products
            .AsNoTracking()
            .Where(product => product.ProductGroupId == groupId)
            .OrderBy(product => product.GroupSerial)
            .ThenBy(product => product.Sku)
            .Select(product => new ProductInfo(product.Id, product.Sku, product.Name))
            .ToListAsync();

        var branchDtos = departmentContexts
            .Select(ctx => new GroupAvailabilityBranchDto
            {
                Id = ctx.DepartmentId,
                Code = ctx.Code,
                Name = ctx.Name,
                DisplayName = ctx.DisplayName
            })
            .ToList();

        if (products.Count == 0 || departmentContexts.Count == 0)
        {
            return new GroupAvailabilityTableDto
            {
                GroupId = group.Id,
                GroupName = group.GroupName,
                DirectionId = group.DirectionId,
                DirectionName = group.Direction != null ? group.Direction.Title : string.Empty,
                Branches = branchDtos,
                Products = Array.Empty<GroupAvailabilityProductRowDto>(),
                LastUpdatedAt = null
            };
        }

        var productIds = products.Select(p => p.Id).ToList();
        var departmentIds = departmentContexts.Select(ctx => ctx.DepartmentId).Distinct().ToList();

        var stocks = await _db.InventorySnapshots
            .AsNoTracking()
            .Where(snapshot => productIds.Contains(snapshot.ProductId)
                               && departmentIds.Contains(snapshot.DepartmentId))
            .GroupBy(snapshot => new { snapshot.ProductId, snapshot.DepartmentId })
            .Select(grouping => new
            {
                grouping.Key.ProductId,
                grouping.Key.DepartmentId,
                Quantity = grouping.Sum(x => x.AvailableQuantity),
                LastUpdatedAt = grouping.Max(x => x.CapturedAt)
            })
            .ToListAsync();

        var stockMap = stocks
            .GroupBy(item => item.ProductId)
            .ToDictionary(
                g => g.Key,
                g => g.ToDictionary(
                    item => item.DepartmentId,
                    item => new StockSnapshot(item.Quantity, item.LastUpdatedAt)));

        var productRows = new List<GroupAvailabilityProductRowDto>(products.Count);
        DateTime? tableLastUpdated = null;

        foreach (var product in products)
        {
            stockMap.TryGetValue(product.Id, out var perBranch);

            var branchQuantities = new List<GroupAvailabilityBranchQuantityDto>(departmentContexts.Count);
            decimal total = 0;
            DateTime? productLastUpdated = null;

            foreach (var ctx in departmentContexts)
            {
                var quantity = perBranch != null && perBranch.TryGetValue(ctx.DepartmentId, out var stock)
                    ? stock.Quantity
                    : 0;

                if (perBranch != null && perBranch.TryGetValue(ctx.DepartmentId, out stock))
                {
                    if (stock.LastUpdatedAt.HasValue && (!productLastUpdated.HasValue || stock.LastUpdatedAt > productLastUpdated))
                    {
                        productLastUpdated = stock.LastUpdatedAt;
                    }
                }

                total += quantity;
                branchQuantities.Add(new GroupAvailabilityBranchQuantityDto
                {
                    DepartmentId = ctx.DepartmentId,
                    Quantity = quantity
                });
            }

            if (productLastUpdated.HasValue && (!tableLastUpdated.HasValue || productLastUpdated > tableLastUpdated))
            {
                tableLastUpdated = productLastUpdated;
            }

            productRows.Add(new GroupAvailabilityProductRowDto
            {
                Id = product.Id,
                Code = product.Code,
                Name = product.Name,
                TotalQuantity = total,
                LastUpdatedAt = productLastUpdated,
                Branches = branchQuantities
            });
        }

        return new GroupAvailabilityTableDto
        {
            GroupId = group.Id,
            GroupName = group.GroupName,
            DirectionId = group.DirectionId,
            DirectionName = group.Direction != null ? group.Direction.Title : string.Empty,
            Branches = branchDtos,
            Products = productRows,
            LastUpdatedAt = tableLastUpdated
        };
    }

    public async Task<FileDownloadDto> ExportGroupAvailabilityToExcelAsync(Guid userId, Guid groupId)
    {
        var table = await GetGroupAvailabilityAsync(userId, groupId);

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Availability");

        worksheet.Cell(1, 1).Value = "Група";
        worksheet.Cell(1, 2).Value = table.GroupName;
        worksheet.Cell(2, 1).Value = "Напрям";
        worksheet.Cell(2, 2).Value = table.DirectionName;
        worksheet.Cell(3, 1).Value = "Оновлено";
        worksheet.Cell(3, 2).Value = table.LastUpdatedAt?.ToString("yyyy-MM-dd HH:mm") ?? "—";

        var headerRow = 5;
        var column = 1;
        worksheet.Cell(headerRow, column++).Value = "#";
        worksheet.Cell(headerRow, column++).Value = "Код";
        worksheet.Cell(headerRow, column++).Value = "Назва";
        worksheet.Cell(headerRow, column++).Value = "Загалом";

        foreach (var branch in table.Branches)
        {
            worksheet.Cell(headerRow, column++).Value = branch.DisplayName;
        }

        var currentRow = headerRow + 1;
        for (var index = 0; index < table.Products.Count; index++)
        {
            var product = table.Products[index];
            column = 1;

            worksheet.Cell(currentRow, column++).Value = index + 1;
            worksheet.Cell(currentRow, column++).Value = product.Code;
            worksheet.Cell(currentRow, column++).Value = product.Name;
            worksheet.Cell(currentRow, column++).Value = product.TotalQuantity;

            foreach (var branch in table.Branches)
            {
                var branchQty = product.Branches.FirstOrDefault(b => b.DepartmentId == branch.Id)?.Quantity ?? 0;
                worksheet.Cell(currentRow, column++).Value = branchQty;
            }

            currentRow++;
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);

        return new FileDownloadDto
        {
            FileName = $"group-availability-{table.GroupName}-{DateTime.UtcNow:yyyyMMddHHmm}.xlsx",
            ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            Content = stream.ToArray()
        };
    }

    public async Task<FileDownloadDto> ExportGroupAvailabilityToPdfAsync(Guid userId, Guid groupId)
    {
        var table = await GetGroupAvailabilityAsync(userId, groupId);

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(30);
                page.Size(PageSizes.A4.Landscape());
                page.DefaultTextStyle(x => x.FontSize(9));

                page.Header()
                    .Column(column =>
                    {
                        column.Item().Text($"Наявність групи: {table.GroupName}").FontSize(14).Bold();
                        column.Item().Text($"Напрям: {table.DirectionName}");
                        column.Item().Text($"Оновлено: {table.LastUpdatedAt?.ToString("yyyy-MM-dd HH:mm") ?? "—"}");
                    });

                page.Content()
                    .Table(tableDescriptor =>
                    {
                        tableDescriptor.ColumnsDefinition(columns =>
                        {
                            columns.ConstantColumn(25);
                            columns.ConstantColumn(80);
                            columns.RelativeColumn();
                            columns.ConstantColumn(50);
                            foreach (var _ in table.Branches)
                            {
                                columns.ConstantColumn(60);
                            }
                        });

                        tableDescriptor.Header(header =>
                        {
                            header.Cell().Element(HeaderCell).Text("#");
                            header.Cell().Element(HeaderCell).Text("Код");
                            header.Cell().Element(HeaderCell).Text("Назва");
                            header.Cell().Element(HeaderCell).Text("Загалом");

                            foreach (var branch in table.Branches)
                            {
                                header.Cell().Element(HeaderCell).Text(branch.DisplayName);
                            }
                        });

                        for (var index = 0; index < table.Products.Count; index++)
                        {
                            var product = table.Products[index];

                            tableDescriptor.Cell().Element(Cell).Text((index + 1).ToString());
                            tableDescriptor.Cell().Element(Cell).Text(product.Code);
                            tableDescriptor.Cell().Element(Cell).Text(product.Name);
                            tableDescriptor.Cell().Element(Cell).Text(product.TotalQuantity.ToString("N2"));

                            foreach (var branch in table.Branches)
                            {
                                var quantity = product.Branches.FirstOrDefault(b => b.DepartmentId == branch.Id)?.Quantity ?? 0;
                                tableDescriptor.Cell().Element(Cell).Text(quantity.ToString("N2"));
                            }
                        }
                    });

                page.Footer()
                    .AlignRight()
                    .Text(x =>
                    {
                        x.Span("Сторінка ");
                        x.CurrentPageNumber();
                        x.Span(" / ");
                        x.TotalPages();
                    });
            });
        });

        var pdfBytes = document.GeneratePdf();

        return new FileDownloadDto
        {
            FileName = $"group-availability-{table.GroupName}-{DateTime.UtcNow:yyyyMMddHHmm}.pdf",
            ContentType = "application/pdf",
            Content = pdfBytes
        };

        IContainer HeaderCell(IContainer container) => container.Padding(4).Background("#f1f5f9").BorderBottom(1).BorderColor("#94a3b8");
        IContainer Cell(IContainer container) => container.Padding(4).BorderBottom(0.5f).BorderColor("#e2e8f0");
    }

    public async Task<ProductAvailabilityResultDto> GetProductAvailabilityByCodeAsync(Guid userId, string code)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            throw new ArgumentException("Product code is required.", nameof(code));
        }

        var normalizedCode = code.Trim();
        var normalizedCodeLower = normalizedCode.ToLower();

        var access = await ResolveAccessAsync(userId);

        var product = await _db.Products
            .AsNoTracking()
            .Where(p => p.Sku.ToLower() == normalizedCodeLower)
            .Select(p => new
            {
                p.Id,
                p.Sku,
                p.Name,
                p.ProductGroupId
            })
            .FirstOrDefaultAsync();

        if (product == null)
        {
            throw new KeyNotFoundException("Product not found.");
        }

        EnsureGroupAccess(product.ProductGroupId, access);

        var user = await GetUserOrThrowAsync(userId);
        var departmentContexts = await LoadDepartmentContextsAsync(user);

        if (departmentContexts.Count == 0)
        {
            return new ProductAvailabilityResultDto
            {
                Id = product.Id,
                Code = product.Sku,
                Name = product.Name,
                TotalQuantity = 0,
                Branches = Array.Empty<ProductAvailabilityBranchQuantityDto>()
            };
        }

        var departmentIds = departmentContexts
            .Select(ctx => ctx.DepartmentId)
            .Distinct()
            .ToList();

        var stockEntries = await _db.InventorySnapshots
            .AsNoTracking()
            .Where(snapshot => snapshot.ProductId == product.Id && departmentIds.Contains(snapshot.DepartmentId))
            .GroupBy(snapshot => snapshot.DepartmentId)
            .Select(grouping => new
            {
                DepartmentId = grouping.Key,
                Quantity = grouping.Sum(x => x.AvailableQuantity),
                LastUpdatedAt = grouping.Max(x => x.CapturedAt)
            })
            .ToDictionaryAsync(entry => entry.DepartmentId);

        var departmentResults = new List<ProductAvailabilityBranchQuantityDto>(departmentContexts.Count);
        decimal total = 0;
        DateTime? lastUpdated = null;

        foreach (var ctx in departmentContexts)
        {
            stockEntries.TryGetValue(ctx.DepartmentId, out var stock);
            var quantity = stock?.Quantity ?? 0;

            if (stock != null)
            {
                var stockUpdatedAt = stock.LastUpdatedAt;
                if (!lastUpdated.HasValue || stockUpdatedAt > lastUpdated)
                {
                    lastUpdated = stockUpdatedAt;
                }
            }

            total += quantity;

            departmentResults.Add(new ProductAvailabilityBranchQuantityDto
            {
                DepartmentId = ctx.DepartmentId,
                Code = ctx.Code,
                Name = ctx.Name,
                DisplayName = ctx.DisplayName,
                Quantity = quantity,
                LastUpdatedAt = stock?.LastUpdatedAt
            });
        }

        return new ProductAvailabilityResultDto
        {
            Id = product.Id,
            Code = product.Sku,
            Name = product.Name,
            TotalQuantity = total,
            LastUpdatedAt = lastUpdated,
            Branches = departmentResults
        };
    }

    public async Task<IReadOnlyList<ProductAvailabilitySearchResultDto>> SearchProductsByNameAsync(Guid userId, string query)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Trim().Length < 3)
        {
            return Array.Empty<ProductAvailabilitySearchResultDto>();
        }

        var normalizedQuery = query.Trim();
        var normalizedQueryLower = normalizedQuery.ToLower();
        var access = await ResolveAccessAsync(userId);

        IQueryable<Product> productsQuery = _db.Products.AsNoTracking();
        if (!access.HasFullAccess)
        {
            productsQuery = productsQuery.Where(product => access.AllowedGroupIds.Contains(product.ProductGroupId));
        }

        var results = await productsQuery
            .Where(product => product.Name.ToLower().Contains(normalizedQueryLower))
            .OrderBy(product => product.Name)
            .ThenBy(product => product.Sku)
            .Take(50)
            .Select(product => new ProductAvailabilitySearchResultDto
            {
                Id = product.Id,
                Code = product.Sku,
                Name = product.Name
            })
            .ToListAsync();

        return results;
    }

    public async Task<AvailabilityUploadResultDto> UploadAvailabilityAsync(Guid userId, IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            throw new ArgumentException("Файл не передано або він порожній.", nameof(file));
        }

        var user = await GetUserOrThrowAsync(userId);

        Guid? departmentId = null;
        if (user.DepartmentShopId.HasValue)
        {
            if (!IsDepartmentUploader(user))
            {
                throw new UnauthorizedAccessException("Завантаження залишків доступне лише користувачам підрозділів або філій.");
            }

            departmentId = user.DepartmentShopId.Value;
        }
        else if (user.DefaultBranchId.HasValue)
        {
            departmentId = user.DefaultBranchId.Value;
        }

        if (!departmentId.HasValue)
        {
            throw new InvalidOperationException("Для користувача не налаштовано магазин або філію для завантаження залишків.");
        }

        var department = await _db.Departments
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == departmentId.Value);

        if (department == null)
        {
            throw new InvalidOperationException("Підрозділ користувача не знайдено.");
        }

        if (department.Type != DepartmentType.Branch && department.Type != DepartmentType.Store)
        {
            throw new InvalidOperationException("Оберіть філію або магазин, дозволений для завантаження залишків.");
        }

        var departmentDisplayName = BuildDepartmentDisplayName(department);

        var parsedRows = ReadAvailabilityUpload(file);
        if (parsedRows.Count == 0)
        {
            throw new ArgumentException("Файл не містить валідних рядків для імпорту.");
        }

        var codes = parsedRows
            .Select(row => row.Code)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var productLookup = await _db.Products
            .AsNoTracking()
            .Where(product => codes.Contains(product.Sku))
            .Select(product => new { product.Id, product.Sku })
            .ToDictionaryAsync(x => x.Sku, x => x.Id, StringComparer.OrdinalIgnoreCase);

        var errors = new List<string>();
        var rowsSkipped = 0;
        var productQuantities = new Dictionary<Guid, decimal>();

        foreach (var row in parsedRows)
        {
            if (!productLookup.TryGetValue(row.Code, out var productId))
            {
                rowsSkipped++;
                if (errors.Count < 50)
                {
                    errors.Add($"Рядок {row.RowNumber}: товар '{row.Code}' не знайдено.");
                }
                continue;
            }

            productQuantities[productId] = row.Quantity;
        }

        if (productQuantities.Count == 0)
        {
            throw new ArgumentException("Жодного товару з файлу не знайдено у каталозі. Перевірте коди.");
        }

        var existingSnapshots = await _db.InventorySnapshots
            .Where(snapshot => snapshot.DepartmentId == department.Id)
            .ToListAsync();

        _db.InventorySnapshots.RemoveRange(existingSnapshots);

        var now = DateTime.UtcNow;
        var newSnapshots = productQuantities
            .Select(pair => new InventorySnapshot
            {
                Id = Guid.NewGuid(),
                DepartmentId = department.Id,
                ProductId = pair.Key,
                AvailableQuantity = pair.Value,
                CapturedAt = now
            })
            .ToList();

        _db.InventorySnapshots.AddRange(newSnapshots);
        await _db.SaveChangesAsync();

        return new AvailabilityUploadResultDto
        {
            DepartmentDisplayName = departmentDisplayName,
            RowsProcessed = parsedRows.Count,
            ProductsImported = newSnapshots.Count,
            RowsSkipped = rowsSkipped,
            Errors = errors,
            ProcessedAt = now
        };
    }

    private static bool IsManagerOrAdmin(User user)
    {
        if (user.Roles == null)
        {
            return false;
        }

        return user.Roles.Contains((int)UserRole.Admin) || user.Roles.Contains((int)UserRole.Manager);
    }

    private async Task<User> GetUserOrThrowAsync(Guid userId)
    {
        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        return user;
    }

    private async Task<UserAccess> ResolveAccessAsync(Guid userId)
    {
        var userExists = await _db.Users
            .AsNoTracking()
            .AnyAsync(u => u.Id == userId);

        if (!userExists)
        {
            throw new KeyNotFoundException("User not found.");
        }

        var accesses = await _db.UserProductAccesses
            .AsNoTracking()
            .Where(access => access.UserId == userId)
            .Select(access => new { access.ProductGroupId, access.IsFullAccess })
            .ToListAsync();

        if (accesses.Count == 0 || accesses.Any(a => a.IsFullAccess))
        {
            return UserAccess.Full;
        }

        var allowedIds = accesses
            .Where(a => a.ProductGroupId.HasValue)
            .Select(a => a.ProductGroupId!.Value)
            .Distinct()
            .ToHashSet();

        return new UserAccess(false, allowedIds);
    }

    private async Task EnsureDirectionAccessAsync(Guid directionId, UserAccess access)
    {
        if (access.HasFullAccess)
        {
            return;
        }

        var hasAccess = await _db.ProductGroups
            .AsNoTracking()
            .AnyAsync(pg => pg.DirectionId == directionId && access.AllowedGroupIds.Contains(pg.Id));

        if (!hasAccess)
        {
            throw new UnauthorizedAccessException("Direction is not available for the current user.");
        }
    }

    private void EnsureGroupAccess(Guid productGroupId, UserAccess access)
    {
        if (access.HasFullAccess)
        {
            return;
        }

        if (!access.AllowedGroupIds.Contains(productGroupId))
        {
            throw new UnauthorizedAccessException("Product group is not available for the current user.");
        }
    }

    private static string BuildBranchDisplayName(Branch branch)
    {
        if (string.IsNullOrWhiteSpace(branch.Code))
        {
            return branch.Name;
        }

        return string.IsNullOrWhiteSpace(branch.Name)
            ? branch.Code
            : $"{branch.Code} - {branch.Name}";
    }

    private static string BuildDepartmentDisplayName(Department department)
    {
        if (string.IsNullOrWhiteSpace(department.Code))
        {
            return department.Name;
        }

        return string.IsNullOrWhiteSpace(department.Name)
            ? department.Code
            : $"{department.Code} - {department.Name}";
    }

    private async Task<BranchContext> ResolveBranchContextAsync(Guid branchSelectionId)
    {
        var branch = await _db.Branches
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == branchSelectionId);

        if (branch != null)
        {
            return new BranchContext(null, branch, branch.Id);
        }

        var department = await _db.Departments
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == branchSelectionId);

        if (department == null)
        {
            throw new KeyNotFoundException("Branch not found.");
        }

        Branch? linkedBranch = null;
        Guid? physicalId = department.BranchId;
        if (department.BranchId.HasValue)
        {
            linkedBranch = await _db.Branches
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.Id == department.BranchId.Value);
        }

        if (physicalId == null)
        {
            physicalId = department.Id;
        }

        if (linkedBranch == null)
        {
            linkedBranch = new Branch
            {
                Id = physicalId.Value,
                Code = department.Code,
                Name = department.Name
            };
        }

        return new BranchContext(department, linkedBranch, physicalId.Value);
    }

    private sealed record BranchContext(Department? Department, Branch Branch, Guid PhysicalBranchId)
    {
        public Guid ClientFacingId => Department?.Id ?? Branch.Id;
        public string DisplayName => Department != null
            ? BuildDepartmentDisplayName(Department)
            : BuildBranchDisplayName(Branch);
    }

    private sealed record ProductInfo(Guid Id, string Code, string Name);

    private sealed record DepartmentAvailabilityContext(Guid DepartmentId, string Code, string Name, string DisplayName);
    private sealed record UploadRow(int RowNumber, string Code, decimal Quantity);

    private sealed record StockSnapshot(decimal Quantity, DateTime? LastUpdatedAt);

    private async Task<IReadOnlyList<DepartmentAvailabilityContext>> LoadDepartmentContextsAsync(User user)
    {
        var departmentsQuery = _db.Departments
            .AsNoTracking()
            .Include(d => d.Branch)
            .Include(d => d.SourceBranch)
            .Where(department => department.Type == DepartmentType.Branch
                                  || department.Type == DepartmentType.Store);

        if (!IsManagerOrAdmin(user))
        {
            var allowedDepartmentIds = new List<Guid>();

            if (user.DepartmentShopId.HasValue)
            {
                allowedDepartmentIds.Add(user.DepartmentShopId.Value);
            }

            if (user.DefaultBranchId.HasValue)
            {
                allowedDepartmentIds.Add(user.DefaultBranchId.Value);
            }

            if (allowedDepartmentIds.Count == 0)
            {
                return Array.Empty<DepartmentAvailabilityContext>();
            }

            departmentsQuery = departmentsQuery.Where(department => allowedDepartmentIds.Contains(department.Id));
        }

        var departments = await departmentsQuery
            .OrderBy(department => department.Type)
            .ThenBy(department => department.Code)
            .ThenBy(department => department.Name)
            .ToListAsync();

        return departments
            .Select(BuildDepartmentAvailabilityContext)
            .ToList();
    }

    private static DepartmentAvailabilityContext BuildDepartmentAvailabilityContext(Department department)
    {
        var code = !string.IsNullOrWhiteSpace(department.Code)
            ? department.Code
            : department.Branch != null ? department.Branch.Code : string.Empty;

        var name = !string.IsNullOrWhiteSpace(department.Name)
            ? department.Name
            : department.Branch != null ? department.Branch.Name : string.Empty;

        var displayName = BuildDepartmentDisplayName(department);
        return new DepartmentAvailabilityContext(department.Id, code, name, displayName);
    }

    private async Task<DepartmentAvailabilityContext> ResolveDepartmentContextAsync(Guid departmentId)
    {
        var department = await _db.Departments
            .AsNoTracking()
            .Include(d => d.Branch)
            .FirstOrDefaultAsync(d => d.Id == departmentId);

        if (department == null)
        {
            throw new KeyNotFoundException("Department not found.");
        }

        if (department.Type != DepartmentType.Branch && department.Type != DepartmentType.Store)
        {
            throw new InvalidOperationException("Selected department is not allowed for availability operations.");
        }

        return BuildDepartmentAvailabilityContext(department);
    }

    private static bool IsDepartmentUploader(User user)
    {
        if (user.Roles == null)
        {
            return false;
        }

        foreach (var role in user.Roles)
        {
            if ((UserRole)role == UserRole.Department || (UserRole)role == UserRole.Admin)
            {
                return true;
            }
        }

        return false;
    }

    private static List<UploadRow> ReadAvailabilityUpload(IFormFile file)
    {
        using var stream = file.OpenReadStream();
        using var workbook = new XLWorkbook(stream);
        var worksheet = workbook.Worksheets.FirstOrDefault();

        if (worksheet == null)
        {
            throw new ArgumentException("Файл не містить робочих аркушів.");
        }

        var range = worksheet.RangeUsed();
        if (range == null)
        {
            throw new ArgumentException("Файл не містить рядків з даними.");
        }

        if (range.ColumnCount() < 2)
        {
            throw new ArgumentException("Файл має містити щонайменше дві колонки: у першій — код товару, у другій — кількість.");
        }

        var usedRows = range.RowsUsed().ToList();
        if (usedRows.Count == 0)
        {
            throw new ArgumentException("Файл не містить рядків з даними.");
        }

        var headerPresent = LooksLikeAvailabilityHeader(usedRows[0]);
        var dataRows = headerPresent ? usedRows.Skip(1).ToList() : usedRows;

        if (dataRows.Count == 0)
        {
            throw new ArgumentException("Файл не містить рядків з даними.");
        }

        var rows = new List<UploadRow>();
        foreach (var row in dataRows)
        {
            var rowNumber = row.RowNumber();
            var code = row.Cell(1).GetString().Trim();
            if (string.IsNullOrWhiteSpace(code))
            {
                continue;
            }

            if (!TryParseQuantity(row.Cell(2), out var quantity))
            {
                continue;
            }

            rows.Add(new UploadRow(rowNumber, code, quantity));
        }

        return rows;
    }

    private static bool LooksLikeAvailabilityHeader(IXLRangeRow row)
    {
        var codeHeader = row.Cell(1).GetString().Trim();
        var quantityHeader = row.Cell(2).GetString().Trim();

        return string.Equals(codeHeader, "Код", StringComparison.OrdinalIgnoreCase) &&
               string.Equals(quantityHeader, "Кількість", StringComparison.OrdinalIgnoreCase);
    }

    private static bool TryParseQuantity(IXLCell cell, out decimal quantity)
    {
        if (cell.TryGetValue(out quantity))
        {
            return true;
        }

        var text = cell.GetString();
        if (decimal.TryParse(text, NumberStyles.Number | NumberStyles.AllowThousands, CultureInfo.InvariantCulture, out quantity))
        {
            return true;
        }

        return decimal.TryParse(text, NumberStyles.Number | NumberStyles.AllowThousands, new CultureInfo("uk-UA"), out quantity);
    }

    private static string BuildDirectionDisplayName(ProductDirection direction)
    {
        if (string.IsNullOrWhiteSpace(direction.Code))
        {
            return direction.Title;
        }

        return string.IsNullOrWhiteSpace(direction.Title)
            ? direction.Code
            : $"{direction.Code} - {direction.Title}";
    }

    private sealed record UserAccess(bool HasFullAccess, IReadOnlyCollection<Guid> AllowedGroupIds)
    {
        public static UserAccess Full { get; } = new(true, Array.Empty<Guid>());
    }
}

