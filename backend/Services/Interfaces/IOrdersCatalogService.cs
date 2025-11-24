using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs.Orders;

namespace backend.Services.Interfaces;

public interface IOrdersCatalogService
{
    Task<IReadOnlyList<OrderDirectionDto>> GetDirectionsAsync(Guid userId);
    Task<IReadOnlyList<OrderProductGroupDto>> GetGroupsAsync(Guid userId, Guid directionId);
    Task<IReadOnlyList<OrderProductDto>> GetProductsAsync(Guid userId, Guid productGroupId);
    Task<IReadOnlyList<OrderProductLookupResultDto>> SearchProductsByCodesAsync(Guid userId, OrderProductLookupRequestDto request);
}
