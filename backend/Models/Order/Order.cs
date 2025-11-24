using backend.Enums;

namespace backend.Models;

public class Order
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string OrderNumber { get; set; } = string.Empty;
    
    // User who created the order
    public Guid CreatedByUserId { get; set; }
    public User? CreatedByUser { get; set; }
    
    // Optional: Shipping/delivery department (from user's DepartmentShopId or explicitly set)
    public Guid? ShippingDepartmentId { get; set; }
    public Department? ShippingDepartment { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Submitted;
    public string OrderType { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public decimal TotalQuantity { get; set; }
    public decimal TotalWeight { get; set; }
    public decimal TotalVolume { get; set; }
    public decimal TotalPrice { get; set; }
    public decimal TotalDiscountedPrice { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    public ICollection<OrderNotificationLog> NotificationLogs { get; set; } = new List<OrderNotificationLog>();
}
