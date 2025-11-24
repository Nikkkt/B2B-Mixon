using backend.Enums;

namespace backend.DTOs.OrderManagement;

public class OrderDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public OrderStatus Status { get; set; }
    public string OrderType { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    public OrderCustomerDto Customer { get; set; } = new();
    public OrderUserDto CreatedBy { get; set; } = new();
    public OrderUserDto? Manager { get; set; }
    public OrderDepartmentDto? ShippingDepartment { get; set; }
    
    public List<OrderItemDto> Items { get; set; } = new();
    public OrderTotalsDto Totals { get; set; } = new();
}
