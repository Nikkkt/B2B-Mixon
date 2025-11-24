namespace backend.Models;

public class DiscountProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<DiscountProfileGroupDiscount> GroupDiscounts { get; set; } = new List<DiscountProfileGroupDiscount>();
    public ICollection<User> Users { get; set; } = new List<User>();
}
