using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.OrderManagement;

public class CreateOrderDto
{
    [Required]
    [StringLength(100)]
    public string OrderType { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string PaymentMethod { get; set; } = string.Empty;
    
    [StringLength(1000)]
    public string? Comment { get; set; }
    
    // Optional: Override shipping department (defaults to user's DepartmentShopId)
    public Guid? ShippingDepartmentId { get; set; }
}
