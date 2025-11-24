using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Cart;

public class UpdateCartItemDto
{
    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Quantity must be greater than 0")]
    public decimal Quantity { get; set; }
}
