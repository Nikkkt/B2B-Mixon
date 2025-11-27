using System.Globalization;
using System.Text;
using backend.Data;
using backend.DTOs.Product;
using backend.Models;
using ExcelDataReader;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

using backend.Services.Interfaces;

namespace backend.Services.Implementations;

public class ProductService : IProductService
{
    private const string ColumnSku = "Артикул";
    private const string ColumnName = "Найменування";
    private const string ColumnPrice = "Ціна";
    private const string ColumnVolume = "Об’єм";
    private const string ColumnWeight = "Вага";
    private const string ColumnGroupNumber = "Номер групи товару";
    private const string ColumnGroupSerial = "Номер всередині групи товару";

    private const int ColumnIndexSku = 0;
    private const int ColumnIndexName = 1;
    private const int ColumnIndexPrice = 2;
    private const int ColumnIndexVolume = 3;
    private const int ColumnIndexWeight = 4;
    private const int ColumnIndexGroupNumber = 5;
    private const int ColumnIndexGroupSerial = 6;

    private static readonly string[] RequiredColumnOrder =
    {
        ColumnSku,
        ColumnName,
        ColumnPrice,
        ColumnVolume,
        ColumnWeight,
        ColumnGroupNumber,
        ColumnGroupSerial
    };

    private static readonly CultureInfo[] SupportedNumberCultures =
    {
        new("uk-UA"),
        new("ru-RU"),
        CultureInfo.InvariantCulture
    };

    private readonly AppDbContext _context;
    private readonly ILogger<ProductService> _logger;

    public ProductService(AppDbContext context, ILogger<ProductService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<UploadProductsResponseDto> ProcessProductUploadAsync(IFormFile file)
    {
        var response = new UploadProductsResponseDto();
        var errorMessages = new List<string>();
        int processed = 0, created = 0, updated = 0, errors = 0;

        try
        {
            // Configure ExcelDataReader to handle Excel files
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

            var dataTable = dataSet.Tables[0];
            EnsureRequiredColumnCount(dataTable.Columns);

            var rows = dataTable.Rows.Cast<System.Data.DataRow>().ToList();

            if (rows.Count == 0)
            {
                throw new ArgumentException("Файл не містить даних для імпорту.");
            }

            var headerPresent = LooksLikeHeaderRow(rows[0]);
            if (headerPresent)
            {
                rows.RemoveAt(0);
            }

            if (rows.Count == 0)
            {
                throw new ArgumentException("Файл не містить рядків з товарами для імпорту.");
            }

            var excelRowStartIndex = headerPresent ? 2 : 1;

            // Process each row in the Excel file
            for (var rowIndex = 0; rowIndex < rows.Count; rowIndex++)
            {
                var row = rows[rowIndex];
                var excelRowNumber = excelRowStartIndex + rowIndex;

                try
                {
                    var sku = row[ColumnIndexSku]?.ToString()?.Trim();
                    var name = row[ColumnIndexName]?.ToString()?.Trim();
                    var priceStr = row[ColumnIndexPrice]?.ToString()?.Trim();
                    var volumeStr = row[ColumnIndexVolume]?.ToString()?.Trim();
                    var weightStr = row[ColumnIndexWeight]?.ToString()?.Trim();
                    var groupNumber = row[ColumnIndexGroupNumber]?.ToString()?.Trim();
                    var groupSerialStr = row[ColumnIndexGroupSerial]?.ToString()?.Trim();

                    // Validate required fields
                    if (string.IsNullOrWhiteSpace(sku) || string.IsNullOrWhiteSpace(name) || 
                        string.IsNullOrWhiteSpace(priceStr) || string.IsNullOrWhiteSpace(groupNumber))
                    {
                        errorMessages.Add($"Строка {excelRowNumber}: Пропущены обязательные поля");
                        errors++;
                        continue;
                    }

                    // Parse numeric values with culture-specific formatting
                    if (!TryParseDecimal(priceStr, out var price))
                    {
                        errorMessages.Add($"Строка {excelRowNumber}: Неверный формат цены: {priceStr}");
                        errors++;
                        continue;
                    }

                    if (!TryParseDecimal(volumeStr, out var volume))
                    {
                        volume = 0; // Default value if not provided or invalid
                    }

                    if (!TryParseDecimal(weightStr, out var weight))
                    {
                        weight = 0; // Default value if not provided or invalid
                    }

                    if (!int.TryParse(groupSerialStr, out int groupSerial))
                    {
                        groupSerial = 0; // Default value if not provided or invalid
                    }

                    // Find or create product group
                    var productGroup = await _context.ProductGroups
                        .FirstOrDefaultAsync(pg => pg.GroupNumber == groupNumber);

                    if (productGroup == null)
                    {
                        errorMessages.Add($"Строка {excelRowNumber}: Группа с номером {groupNumber} не найдена. Создайте её заранее в админке.");
                        errors++;
                        continue;
                    }

                    if (productGroup.DirectionId == Guid.Empty)
                    {
                        errorMessages.Add($"Строка {excelRowNumber}: Группа {groupNumber} не привязана к направлению.");
                        errors++;
                        continue;
                    }

                    // Find existing product or create new one
                    var product = await _context.Products
                        .FirstOrDefaultAsync(p => p.Sku == sku);

                    if (product == null)
                    {
                        // Create new product
                        product = new Product
                        {
                            Id = Guid.NewGuid(),
                            Sku = sku,
                            Name = name,
                            Price = price,
                            DiscountPercent = 0, // Default discount
                            PriceWithDiscount = price,
                            Volume = volume,
                            Weight = weight,
                            GroupSerial = groupSerial,
                            ProductGroupId = productGroup.Id,
                            DirectionId = productGroup.DirectionId,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };
                        await _context.Products.AddAsync(product);
                        created++;
                    }
                    else
                    {
                        // Update existing product
                        product.Name = name;
                        product.Price = price;
                        product.PriceWithDiscount = price * (1 - product.DiscountPercent / 100);
                        product.Volume = volume;
                        product.Weight = weight;
                        product.GroupSerial = groupSerial;
                        product.ProductGroupId = productGroup.Id;
                        product.DirectionId = productGroup.DirectionId;
                        product.UpdatedAt = DateTime.UtcNow;
                        _context.Products.Update(product);
                        updated++;
                    }

                    processed++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing product row {RowNumber}", excelRowNumber);
                    errorMessages.Add($"Ошибка в строке {excelRowNumber}: {ex.Message}");
                    errors++;
                }
            }

            // Save all changes to the database
            await _context.SaveChangesAsync();

            response.Success = true;
            response.Message = $"Обработано {processed} товаров. Создано: {created}, Обновлено: {updated}, Ошибок: {errors}";
            response.TotalProcessed = processed;
            response.Created = created;
            response.Updated = updated;
            response.Errors = errors;
            response.ErrorMessages = errorMessages;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing product upload");
            response.Success = false;
            response.Message = $"Ошибка при обработке файла: {ex.Message}";
            response.ErrorMessages.Add(ex.Message);
        }

        return response;
    }

    private static void EnsureRequiredColumnCount(System.Data.DataColumnCollection columns)
    {
        if (columns.Count < RequiredColumnOrder.Length)
        {
            throw new ArgumentException($"Файл має містити щонайменше {RequiredColumnOrder.Length} колонок у такому порядку: {string.Join(", ", RequiredColumnOrder)}.");
        }
    }

    private static bool LooksLikeHeaderRow(System.Data.DataRow row)
    {
        for (var i = 0; i < RequiredColumnOrder.Length && i < row.Table.Columns.Count; i++)
        {
            var cellValue = row[i]?.ToString()?.Trim();
            if (!string.Equals(cellValue, RequiredColumnOrder[i], StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }
        }

        return true;
    }

    private static bool TryParseDecimal(string? value, out decimal result)
    {
        result = 0m;
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        var sanitized = value.Trim().Replace(" ", string.Empty);

        foreach (var culture in SupportedNumberCultures)
        {
            if (decimal.TryParse(sanitized, NumberStyles.Any, culture, out result))
            {
                return true;
            }
        }

        var normalized = sanitized.Replace(',', '.');
        return decimal.TryParse(normalized, NumberStyles.Any, CultureInfo.InvariantCulture, out result);
    }
}

