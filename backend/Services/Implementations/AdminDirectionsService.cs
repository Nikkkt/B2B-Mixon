using backend.Data;
using backend.DTOs.AdminDirections;
using backend.Models;using Microsoft.EntityFrameworkCore;

using backend.Services.Interfaces;

namespace backend.Services.Implementations;

public class AdminDirectionsService : IAdminDirectionsService
{
    private readonly AppDbContext _db;

    public AdminDirectionsService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<AdminDirectionDto>> GetDirectionsAsync()
    {
        var directions = await _db.ProductDirections
            .AsNoTracking()
            .OrderBy(direction => direction.SortOrder)
            .ThenBy(direction => direction.Title)
            .ToListAsync();

        return directions.Select(MapDirection).ToList();
    }

    public async Task<AdminDirectionDto> GetDirectionAsync(Guid directionId)
    {
        var direction = await _db.ProductDirections
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == directionId);

        if (direction == null)
        {
            throw new KeyNotFoundException("Direction not found");
        }

        return MapDirection(direction);
    }

    public async Task<AdminDirectionDto> CreateDirectionAsync(AdminDirectionCreateRequestDto dto)
    {
        if (dto == null)
        {
            throw new ArgumentNullException(nameof(dto));
        }

        var title = NormalizeTitle(dto.Title);
        var code = NormalizeCode(dto.Code);

        if (!string.IsNullOrEmpty(code))
        {
            await EnsureCodeIsUniqueAsync(code);
        }
        else
        {
            code = await GenerateCodeAsync();
        }

        var sortOrder = NormalizeSortOrder(dto.SortOrder) ?? await GetNextSortOrderAsync();
        var now = DateTime.UtcNow;

        var direction = new ProductDirection
        {
            Title = title,
            Code = code,
            SortOrder = sortOrder,
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.ProductDirections.Add(direction);
        await _db.SaveChangesAsync();

        return MapDirection(direction);
    }

    public async Task<AdminDirectionDto> UpdateDirectionAsync(Guid directionId, AdminDirectionUpdateRequestDto dto)
    {
        if (dto == null)
        {
            throw new ArgumentNullException(nameof(dto));
        }

        var direction = await _db.ProductDirections.FirstOrDefaultAsync(d => d.Id == directionId);
        if (direction == null)
        {
            throw new KeyNotFoundException("Direction not found");
        }

        var title = NormalizeTitle(dto.Title);
        var code = NormalizeCode(dto.Code);

        if (!string.IsNullOrEmpty(code) && !string.Equals(direction.Code, code, StringComparison.OrdinalIgnoreCase))
        {
            await EnsureCodeIsUniqueAsync(code, direction.Id);
            direction.Code = code;
        }

        if (dto.SortOrder.HasValue)
        {
            direction.SortOrder = NormalizeSortOrder(dto.SortOrder)!.Value;
        }

        direction.Title = title;
        direction.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return MapDirection(direction);
    }

    public async Task DeleteDirectionAsync(Guid directionId)
    {
        var direction = await _db.ProductDirections.FirstOrDefaultAsync(d => d.Id == directionId);
        if (direction == null)
        {
            throw new KeyNotFoundException("Direction not found");
        }

        var isLinkedToGroups = await _db.ProductGroups.AnyAsync(group => group.DirectionId == directionId);
        if (isLinkedToGroups)
        {
            throw new InvalidOperationException("Напрямок прив'язаний до груп товарів і не може бути видалений.");
        }

        _db.ProductDirections.Remove(direction);
        await _db.SaveChangesAsync();
    }

    private static AdminDirectionDto MapDirection(ProductDirection direction)
    {
        return new AdminDirectionDto
        {
            Id = direction.Id,
            Code = direction.Code,
            Title = direction.Title,
            SortOrder = direction.SortOrder,
            CreatedAt = direction.CreatedAt,
            UpdatedAt = direction.UpdatedAt
        };
    }

    private static string NormalizeTitle(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Назва обов'язкова.");
        }

        return value.Trim();
    }

    private static string? NormalizeCode(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static int? NormalizeSortOrder(int? sortOrder)
    {
        if (!sortOrder.HasValue)
        {
            return null;
        }

        if (sortOrder.Value < 0)
        {
            throw new ArgumentException("Sort order must be non-negative.");
        }

        return sortOrder.Value;
    }

    private async Task EnsureCodeIsUniqueAsync(string code, Guid? excludeId = null)
    {
        var exists = await _db.ProductDirections
            .AsNoTracking()
            .AnyAsync(d => d.Code == code && (!excludeId.HasValue || d.Id != excludeId.Value));

        if (exists)
        {
            throw new InvalidOperationException("Напрямок з таким кодом вже існує.");
        }
    }

    private async Task<string> GenerateCodeAsync()
    {
        var codes = await _db.ProductDirections
            .AsNoTracking()
            .Select(d => d.Code)
            .ToListAsync();

        var maxNumber = 0;
        foreach (var code in codes)
        {
            if (TryExtractNumber(code, out var number) && number > maxNumber)
            {
                maxNumber = number;
            }
        }

        var nextNumber = maxNumber + 1;
        return $"DIR-{nextNumber:D3}";
    }

    private async Task<int> GetNextSortOrderAsync()
    {
        var maxSortOrder = await _db.ProductDirections
            .Select(d => (int?)d.SortOrder)
            .MaxAsync();

        return (maxSortOrder ?? 0) + 1;
    }

    private static bool TryExtractNumber(string? source, out int value)
    {
        value = 0;
        if (string.IsNullOrWhiteSpace(source))
        {
            return false;
        }

        var digits = new string(source.Where(char.IsDigit).ToArray());
        return !string.IsNullOrEmpty(digits) && int.TryParse(digits, out value);
    }
}

