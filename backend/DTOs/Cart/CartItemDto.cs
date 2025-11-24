namespace backend.DTOs.Cart;

public class CartItemDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal Price { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal PriceWithDiscount { get; set; }
    public decimal Weight { get; set; }
    public decimal Volume { get; set; }
    public string? Availability { get; set; }
    public DateTime AddedAt { get; set; }
}
