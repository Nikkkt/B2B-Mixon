using System.Globalization;
using System.Text;
using backend.Data;
using backend.DTOs.AdminProductGroups;
using backend.Models;
using ExcelDataReader;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

using backend.Services.Interfaces;

namespace backend.Services.Implementations;

public class AdminProductGroupsService : IAdminProductGroupsService
{
    private static readonly string[] GroupNumberHeaders =
    {
        "№ Группы", "Номер группы", "Номер", "Group Number", "GroupNumber", "Номер групи"
    };

    private static readonly string[] SmallWholesaleHeaders =
    {
        "Скидка Мелкий Опт", "Скидка Мелк. Опт", "Small Wholesale", "Discount Small", "Знижка малий опт"
    };

    private static readonly string[] WholesaleHeaders =
    {
        "Скидка Опт", "Wholesale Discount", "Discount Wholesale", "Знижка опт"
    };

    private static readonly string[] LargeWholesaleHeaders =
    {
        "Скидка Крупный Опт", "Large Wholesale", "Discount Large", "Знижка крупний опт"
    };

    private const int DefaultGroupNumberIndex = 0;
    private const int DefaultSmallWholesaleIndex = 1;
    private const int DefaultWholesaleIndex = 2;
    private const int DefaultLargeWholesaleIndex = 3;

    private readonly AppDbContext _db;

    public AdminProductGroupsService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<AdminProductGroupDto>> GetAsync()
    {
        var groups = await _db.ProductGroups
            .AsNoTracking()
            .Include(pg => pg.Direction)
            .OrderBy(pg => pg.SortOrder)
            .ThenBy(pg => pg.GroupNumber)
            .ToListAsync();

        return groups.Select(MapGroup).ToList();
    }

    public async Task<AdminProductGroupDto> GetAsync(Guid id)
    {
        var group = await _db.ProductGroups
            .AsNoTracking()
            .Include(pg => pg.Direction)
            .FirstOrDefaultAsync(pg => pg.Id == id);

        if (group == null)
        {
            throw new KeyNotFoundException("Product group not found");
        }

        return MapGroup(group);
    }

    public async Task<AdminProductGroupDto> CreateAsync(AdminProductGroupCreateRequestDto dto)
    {
        if (dto == null)
        {
            throw new ArgumentNullException(nameof(dto));
        }

        if (await _db.ProductGroups.AnyAsync(pg => pg.GroupNumber == dto.GroupNumber))
        {
            throw new InvalidOperationException("Група з таким номером вже існує.");
        }

        await EnsureDirectionExists(dto.DirectionId);

        var now = DateTime.UtcNow;
        var group = new ProductGroup
        {
            GroupNumber = dto.GroupNumber.Trim(),
            ProductLine = dto.ProductLine.Trim(),
            GroupName = dto.Name.Trim(),
            DirectionId = dto.DirectionId,
            SortOrder = dto.SortOrder ?? await GetNextSortOrderAsync(),
            AddedAt = now,
            UpdatedAt = now
        };

        _db.ProductGroups.Add(group);
        await _db.SaveChangesAsync();

        await _db.Entry(group).Reference(pg => pg.Direction).LoadAsync();
        return MapGroup(group);
    }

    public async Task<AdminProductGroupDto> UpdateAsync(Guid id, AdminProductGroupUpdateRequestDto dto)
    {
        if (dto == null)
        {
            throw new ArgumentNullException(nameof(dto));
        }

        var group = await _db.ProductGroups.FirstOrDefaultAsync(pg => pg.Id == id);
        if (group == null)
        {
            throw new KeyNotFoundException("Product group not found");
        }

        await EnsureDirectionExists(dto.DirectionId);

        group.ProductLine = dto.ProductLine.Trim();
        group.GroupName = dto.Name.Trim();
        group.DirectionId = dto.DirectionId;
        if (dto.SortOrder.HasValue)
        {
            group.SortOrder = dto.SortOrder.Value;
        }
        group.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await _db.Entry(group).Reference(pg => pg.Direction).LoadAsync();
        return MapGroup(group);
    }

    public async Task DeleteAsync(Guid id)
    {
        var group = await _db.ProductGroups.FirstOrDefaultAsync(pg => pg.Id == id);
        if (group == null)
        {
            throw new KeyNotFoundException("Product group not found");
        }

        var hasProducts = await _db.Products.AnyAsync(p => p.ProductGroupId == id);
        if (hasProducts)
        {
            throw new InvalidOperationException("Групу неможливо видалити, оскільки до неї прив'язані товари.");
        }

        _db.ProductGroups.Remove(group);
        await _db.SaveChangesAsync();
    }

    public async Task<AdminProductGroupUploadResultDto> UploadDiscountsAsync(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            throw new ArgumentException("Файл не знайдено або він порожній.");
        }

        Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
        using var stream = new MemoryStream();
        await file.CopyToAsync(stream);
        stream.Position = 0;

        using var reader = ExcelReaderFactory.CreateReader(stream);
        var dataSet = reader.AsDataSet(new ExcelDataSetConfiguration
        {
            ConfigureDataTable = _ => new ExcelDataTableConfiguration
            {
                UseHeaderRow = false
            }
        });

        var table = dataSet.Tables[0];
        if (table == null || table.Rows.Count == 0)
        {
            throw new InvalidOperationException("Файл не містить даних.");
        }

        EnsureMinimumColumnCount(table.Columns);

        var rows = table.Rows.Cast<System.Data.DataRow>().ToList();
        var columnIndices = InitializeColumnIndices();

        var headerPresent = rows.Count > 0 && TryMapHeaderRow(rows[0], columnIndices);
        if (headerPresent)
        {
            rows.RemoveAt(0);
        }

        if (rows.Count == 0)
        {
            throw new InvalidOperationException("Файл не містить рядків з даними.");
        }

        var result = new AdminProductGroupUploadResultDto();
        var now = DateTime.UtcNow;

        for (var rowIndex = 0; rowIndex < rows.Count; rowIndex++)
        {
            var row = rows[rowIndex];
            var excelRowNumber = headerPresent ? rowIndex + 2 : rowIndex + 1;

            try
            {
                var groupNumber = GetCellValue(row, columnIndices.GroupNumber)?.Trim();
                if (string.IsNullOrWhiteSpace(groupNumber))
                {
                    result.Skipped++;
                    continue;
                }

                var small = ParsePercent(GetCellValue(row, columnIndices.SmallWholesale));
                var wholesale = ParsePercent(GetCellValue(row, columnIndices.Wholesale));
                var large = ParsePercent(GetCellValue(row, columnIndices.LargeWholesale));

                var group = await _db.ProductGroups.FirstOrDefaultAsync(pg => pg.GroupNumber == groupNumber);
                if (group == null)
                {
                    result.NotFound++;
                    continue;
                }

                group.SmallWholesaleDiscount = small;
                group.WholesaleDiscount = wholesale;
                group.LargeWholesaleDiscount = large;
                group.UpdatedAt = now;
                result.Updated++;
            }
            catch (Exception ex)
            {
                result.Errors.Add($"Рядок {excelRowNumber}: {ex.Message}");
            }
            finally
            {
                result.Processed++;
            }
        }

        await _db.SaveChangesAsync();
        result.Message = $"Оновлено {result.Updated}, пропущено {result.Skipped}, не знайдено {result.NotFound}.";
        return result;
    }

    private static AdminProductGroupDto MapGroup(ProductGroup group)
    {
        return new AdminProductGroupDto
        {
            Id = group.Id,
            GroupNumber = group.GroupNumber,
            Name = group.GroupName,
            ProductLine = group.ProductLine,
            DirectionId = group.DirectionId,
            DirectionTitle = group.Direction?.Title ?? string.Empty,
            SmallWholesaleDiscount = group.SmallWholesaleDiscount,
            WholesaleDiscount = group.WholesaleDiscount,
            LargeWholesaleDiscount = group.LargeWholesaleDiscount,
            AddedAt = group.AddedAt,
            UpdatedAt = group.UpdatedAt
        };
    }

    private async Task EnsureDirectionExists(Guid directionId)
    {
        var exists = await _db.ProductDirections.AnyAsync(d => d.Id == directionId);
        if (!exists)
        {
            throw new ArgumentException("Обраний напрямок не існує.");
        }
    }

    private async Task<int> GetNextSortOrderAsync()
    {
        var maxSort = await _db.ProductGroups.Select(pg => (int?)pg.SortOrder).MaxAsync();
        return (maxSort ?? 0) + 1;
    }

    private static decimal? ParsePercent(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var cleaned = value.Replace("%", string.Empty).Replace(',', '.').Trim();
        return decimal.TryParse(cleaned, NumberStyles.Any, CultureInfo.InvariantCulture, out var number)
            ? number
            : null;
    }

    private static ColumnIndices InitializeColumnIndices() => new()
    {
        GroupNumber = DefaultGroupNumberIndex,
        SmallWholesale = DefaultSmallWholesaleIndex,
        Wholesale = DefaultWholesaleIndex,
        LargeWholesale = DefaultLargeWholesaleIndex
    };

    private static bool TryMapHeaderRow(System.Data.DataRow row, ColumnIndices indices)
    {
        var headerMatches = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        for (var columnIndex = 0; columnIndex < row.Table.Columns.Count; columnIndex++)
        {
            var cellValue = row[columnIndex]?.ToString()?.Trim();
            if (string.IsNullOrWhiteSpace(cellValue))
            {
                continue;
            }

            if (!headerMatches.ContainsKey(nameof(indices.GroupNumber)) && MatchesAny(cellValue, GroupNumberHeaders))
            {
                headerMatches[nameof(indices.GroupNumber)] = columnIndex;
            }
            else if (!headerMatches.ContainsKey(nameof(indices.SmallWholesale)) && MatchesAny(cellValue, SmallWholesaleHeaders))
            {
                headerMatches[nameof(indices.SmallWholesale)] = columnIndex;
            }
            else if (!headerMatches.ContainsKey(nameof(indices.Wholesale)) && MatchesAny(cellValue, WholesaleHeaders))
            {
                headerMatches[nameof(indices.Wholesale)] = columnIndex;
            }
            else if (!headerMatches.ContainsKey(nameof(indices.LargeWholesale)) && MatchesAny(cellValue, LargeWholesaleHeaders))
            {
                headerMatches[nameof(indices.LargeWholesale)] = columnIndex;
            }
        }

        if (headerMatches.Count < 4)
        {
            return false;
        }

        indices.GroupNumber = headerMatches[nameof(indices.GroupNumber)];
        indices.SmallWholesale = headerMatches[nameof(indices.SmallWholesale)];
        indices.Wholesale = headerMatches[nameof(indices.Wholesale)];
        indices.LargeWholesale = headerMatches[nameof(indices.LargeWholesale)];
        return true;
    }

    private static bool MatchesAny(string value, IEnumerable<string> candidates)
        => candidates.Any(candidate => string.Equals(value, candidate, StringComparison.OrdinalIgnoreCase));

    private static void EnsureMinimumColumnCount(System.Data.DataColumnCollection columns)
    {
        if (columns.Count < 4)
        {
            throw new ArgumentException("Файл має містити щонайменше 4 колонки: номер групи та три рівні знижок.");
        }
    }

    private static string? GetCellValue(System.Data.DataRow row, int index)
    {
        if (index < 0 || index >= row.Table.Columns.Count)
        {
            return null;
        }

        return row[index]?.ToString();
    }

    private sealed class ColumnIndices
    {
        public int GroupNumber { get; set; }
        public int SmallWholesale { get; set; }
        public int Wholesale { get; set; }
        public int LargeWholesale { get; set; }
    }
}

