namespace backend.Models;

public class Product
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal PriceWithDiscount { get; set; }
    public decimal Weight { get; set; }
    public decimal Volume { get; set; }
    public Guid ProductGroupId { get; set; }
    public ProductGroup? ProductGroup { get; set; }
    public Guid DirectionId { get; set; }
    public ProductDirection? Direction { get; set; }
    public int GroupSerial { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    public ICollection<InventorySnapshot> InventorySnapshots { get; set; } = new List<InventorySnapshot>();
}
