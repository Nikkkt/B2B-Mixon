namespace backend.Models;

public class CartItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CartId { get; set; }
    public Cart? Cart { get; set; }
    public Guid ProductId { get; set; }
    public Product? Product { get; set; }
    public decimal Quantity { get; set; }
    public decimal PriceSnapshot { get; set; }
    public decimal DiscountPercentSnapshot { get; set; }
    public decimal PriceWithDiscountSnapshot { get; set; }
    public decimal WeightSnapshot { get; set; }
    public decimal VolumeSnapshot { get; set; }
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}
