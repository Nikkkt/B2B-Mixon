namespace backend.Models;

public class DiscountProfileGroupDiscount
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DiscountProfileId { get; set; }
    public DiscountProfile? DiscountProfile { get; set; }
    public Guid ProductGroupId { get; set; }
    public ProductGroup? ProductGroup { get; set; }
    public decimal Percent { get; set; }
}
