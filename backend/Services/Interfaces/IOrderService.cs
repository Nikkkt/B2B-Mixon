using backend.DTOs.Common;
using backend.DTOs.OrderManagement;

namespace backend.Services.Interfaces;

public interface IOrderService
{
    Task<OrderDto> CreateOrderFromCartAsync(Guid userId, CreateOrderDto request);
    Task<OrderHistoryResponseDto> GetOrderHistoryAsync(Guid userId, OrderHistoryFilterDto filter);
    Task<OrderDto> GetOrderByIdAsync(Guid userId, Guid orderId);
    Task<OrderDto> RepeatOrderAsync(Guid userId, Guid orderId);
    Task<List<OrderUserDto>> GetAvailableUsersForFilteringAsync(Guid userId);
    Task<byte[]> ExportOrderHistoryToExcelAsync(Guid userId, OrderHistoryFilterDto filter);
    Task<byte[]> ExportOrderHistoryToPdfAsync(Guid userId, OrderHistoryFilterDto filter);
    Task<FileDownloadDto> ExportOrderToExcelAsync(Guid userId, Guid orderId);
    Task<FileDownloadDto> ExportOrderToPdfAsync(Guid userId, Guid orderId);
}
