using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Cart;

public class AddToCartDto
{
    [Required]
    public Guid ProductId { get; set; }
    
    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Quantity must be greater than 0")]
    public decimal Quantity { get; set; }
}
