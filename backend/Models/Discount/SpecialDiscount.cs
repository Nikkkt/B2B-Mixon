namespace backend.Models;

public class SpecialDiscount
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public Guid ProductGroupId { get; set; }
    public ProductGroup? ProductGroup { get; set; }
    public decimal Percent { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
