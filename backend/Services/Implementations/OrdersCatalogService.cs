using System;
using System.Collections.Generic;
using backend.Data;
using backend.DTOs.Orders;
using backend.Models;
using backend.Services.Helpers;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class OrdersCatalogService : IOrdersCatalogService
{
    private readonly AppDbContext _db;
    private readonly IUserDiscountService _userDiscountService;

    public OrdersCatalogService(AppDbContext db, IUserDiscountService userDiscountService)
    {
        _db = db;
        _userDiscountService = userDiscountService;
    }

    public async Task<IReadOnlyList<OrderDirectionDto>> GetDirectionsAsync(Guid userId)
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
            .Select(direction => new OrderDirectionDto
            {
                Id = direction.Id,
                Code = direction.Code,
                Title = direction.Title,
                DisplayName = BuildDirectionDisplayName(direction),
                SortOrder = direction.SortOrder
            })
            .ToListAsync();

        return directions;
    }

    public async Task<IReadOnlyList<OrderProductGroupDto>> GetGroupsAsync(Guid userId, Guid directionId)
    {
        var directionExists = await _db.ProductDirections
            .AsNoTracking()
            .AnyAsync(d => d.Id == directionId);

        if (!directionExists)
        {
            throw new KeyNotFoundException("Direction not found.");
        }

        var access = await ResolveAccessAsync(userId);
        await EnsureDirectionAccessAsync(directionId, access);

        var groupsQuery = _db.ProductGroups
            .AsNoTracking()
            .Where(pg => pg.DirectionId == directionId);

        if (!access.HasFullAccess)
        {
            groupsQuery = groupsQuery.Where(pg => access.AllowedGroupIds.Contains(pg.Id));
        }

        var groups = await groupsQuery
            .OrderBy(pg => pg.SortOrder)
            .ThenBy(pg => pg.GroupNumber)
            .Select(pg => new OrderProductGroupDto
            {
                Id = pg.Id,
                DirectionId = pg.DirectionId,
                DirectionTitle = pg.Direction != null ? pg.Direction.Title : string.Empty,
                GroupNumber = pg.GroupNumber,
                Name = pg.GroupName,
                ProductLine = pg.ProductLine,
                SortOrder = pg.SortOrder
            })
            .ToListAsync();

        return groups;
    }

    public async Task<IReadOnlyList<OrderProductDto>> GetProductsAsync(Guid userId, Guid productGroupId)
    {
        var group = await _db.ProductGroups
            .AsNoTracking()
            .FirstOrDefaultAsync(pg => pg.Id == productGroupId);

        if (group == null)
        {
            throw new KeyNotFoundException("Product group not found.");
        }

        var access = await ResolveAccessAsync(userId);
        EnsureGroupAccess(productGroupId, access);

        var allowedDepartmentIds = await ResolveAllowedDepartmentsAsync(userId);

        var stockQuery = _db.InventorySnapshots
            .AsNoTracking();

        if (allowedDepartmentIds.Count > 0)
        {
            stockQuery = stockQuery.Where(snapshot => allowedDepartmentIds.Contains(snapshot.DepartmentId));
        }

        var stockAggregatedQuery = stockQuery
            .GroupBy(snapshot => snapshot.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                Quantity = g.Sum(x => x.AvailableQuantity),
                LastUpdatedAt = g.Max(x => x.CapturedAt)
            });

        var products = await _db.Products
            .AsNoTracking()
            .Where(product => product.ProductGroupId == productGroupId)
            .GroupJoin(
                stockAggregatedQuery,
                product => product.Id,
                stock => stock.ProductId,
                (product, stockInfo) => new { product, stock = stockInfo.FirstOrDefault() })
            .OrderBy(x => x.product.GroupSerial)
            .ThenBy(x => x.product.Sku)
            .Select(x => new
            {
                Product = x.product,
                Stock = x.stock
            })
            .ToListAsync();

        var snapshot = await _userDiscountService.BuildUserDiscountSnapshotAsync(userId);

        return products.Select(x =>
        {
            var percent = _userDiscountService.ResolveDiscountPercent(snapshot, x.Product.ProductGroupId);
            var priceWithDiscount = DiscountMath.ApplyPercent(x.Product.Price, percent);

            return new OrderProductDto
            {
                Id = x.Product.Id,
                ProductGroupId = x.Product.ProductGroupId,
                DirectionId = x.Product.DirectionId,
                Code = x.Product.Sku,
                Name = x.Product.Name,
                Price = x.Product.Price,
                PriceWithDiscount = priceWithDiscount,
                DiscountPercent = percent,
                Weight = x.Product.Weight,
                Volume = x.Product.Volume,
                GroupSerial = x.Product.GroupSerial,
                Availability = x.Stock?.Quantity,
                AvailabilityUpdatedAt = x.Stock?.LastUpdatedAt
            };
        }).ToList();
    }

    public async Task<IReadOnlyList<OrderProductLookupResultDto>> SearchProductsByCodesAsync(Guid userId, OrderProductLookupRequestDto request)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        var access = await ResolveAccessAsync(userId);

        var normalizedItems = NormalizeLookupItems(request);

        var codes = normalizedItems.Select(item => item.Code).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        if (codes.Count == 0)
        {
            return Array.Empty<OrderProductLookupResultDto>();
        }

        IQueryable<Product> productsQuery = _db.Products.AsNoTracking();
        if (!access.HasFullAccess)
        {
            productsQuery = productsQuery.Where(product => access.AllowedGroupIds.Contains(product.ProductGroupId));
        }

        var productMap = await productsQuery
            .Where(product => codes.Contains(product.Sku))
            .Select(product => new
            {
                product.Id,
                product.Sku,
                product.Name,
                product.Price,
                product.Weight,
                product.Volume,
                product.ProductGroupId
            })
            .ToDictionaryAsync(p => p.Sku, StringComparer.OrdinalIgnoreCase);

        var stockLookup = await _db.InventorySnapshots
            .AsNoTracking()
            .Where(snapshot => productMap.Values.Select(p => p.Id).Contains(snapshot.ProductId))
            .GroupBy(snapshot => snapshot.ProductId)
            .Select(grouping => new
            {
                ProductId = grouping.Key,
                Quantity = grouping.Sum(x => x.AvailableQuantity),
                LastUpdatedAt = grouping.Max(x => x.CapturedAt)
            })
            .ToDictionaryAsync(entry => entry.ProductId);

        var snapshot = await _userDiscountService.BuildUserDiscountSnapshotAsync(userId);
        var results = new List<OrderProductLookupResultDto>(normalizedItems.Count);
        foreach (var item in normalizedItems)
        {
            if (!productMap.TryGetValue(item.Code, out var productData))
            {
                results.Add(new OrderProductLookupResultDto
                {
                    Code = item.Code,
                    Name = "!!! ТОВАР НЕ ЗНАЙДЕНО !!!",
                    RequestedQuantity = item.Quantity,
                    IsError = true,
                    ErrorMessage = "Товар не знайдено або немає доступу."
                });
                continue;
            }

            stockLookup.TryGetValue(productData.Id, out var stockData);

            var percent = _userDiscountService.ResolveDiscountPercent(snapshot, productData.ProductGroupId);
            var priceWithDiscount = DiscountMath.ApplyPercent(productData.Price, percent);

            results.Add(new OrderProductLookupResultDto
            {
                ProductId = productData.Id,
                ProductGroupId = productData.ProductGroupId,
                Code = productData.Sku,
                Name = productData.Name,
                RequestedQuantity = item.Quantity,
                Availability = stockData?.Quantity,
                AvailabilityUpdatedAt = stockData?.LastUpdatedAt,
                Price = productData.Price,
                PriceWithDiscount = priceWithDiscount,
                DiscountPercent = percent,
                Weight = productData.Weight,
                Volume = productData.Volume,
                IsError = false
            });
        }

        return results;
    }

    private static List<OrderProductLookupItemDto> NormalizeLookupItems(OrderProductLookupRequestDto request)
    {
        var normalized = new List<OrderProductLookupItemDto>(request.Items.Count);
        foreach (var item in request.Items)
        {
            if (item == null)
            {
                continue;
            }

            var code = item.Code?.Trim();
            if (string.IsNullOrWhiteSpace(code))
            {
                continue;
            }

            normalized.Add(new OrderProductLookupItemDto
            {
                Code = code,
                Quantity = item.Quantity
            });
        }

        return normalized;
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

