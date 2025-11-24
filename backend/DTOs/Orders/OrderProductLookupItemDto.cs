using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Orders;

public class OrderProductLookupItemDto
{
    [Required]
    [StringLength(128)]
    public string Code { get; set; } = string.Empty;

    [Range(0, double.MaxValue)]
    public decimal Quantity { get; set; }
}
