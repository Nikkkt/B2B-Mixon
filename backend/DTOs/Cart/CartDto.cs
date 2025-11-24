namespace backend.DTOs.Cart;

public class CartDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<CartItemDto> Items { get; set; } = new();
    public CartTotalsDto Totals { get; set; } = new();
}
