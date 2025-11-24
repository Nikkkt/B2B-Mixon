namespace backend.Models;

public class OrderItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Order? Order { get; set; }
    public Guid ProductId { get; set; }
    public Product? Product { get; set; }
    public string ProductCodeSnapshot { get; set; } = string.Empty;
    public string ProductNameSnapshot { get; set; } = string.Empty;
    public decimal PriceSnapshot { get; set; }
    public decimal DiscountPercentSnapshot { get; set; }
    public decimal PriceWithDiscountSnapshot { get; set; }
    public decimal Quantity { get; set; }
    public decimal WeightSnapshot { get; set; }
    public decimal VolumeSnapshot { get; set; }
    public decimal LineTotal { get; set; }
}
