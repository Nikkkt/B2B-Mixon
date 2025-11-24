namespace backend.Models;

public class ProductGroup
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string GroupNumber { get; set; } = string.Empty;
    public string ProductLine { get; set; } = string.Empty;
    public string GroupName { get; set; } = string.Empty;
    public Guid DirectionId { get; set; }
    public ProductDirection? Direction { get; set; }
    public int SortOrder { get; set; }
    public decimal? SmallWholesaleDiscount { get; set; }
    public decimal? WholesaleDiscount { get; set; }
    public decimal? LargeWholesaleDiscount { get; set; }
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<Product> Products { get; set; } = new List<Product>();
    public ICollection<GroupDiscount> DefaultDiscounts { get; set; } = new List<GroupDiscount>();
}
