namespace backend.Models;

public class GroupDiscount
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProductGroupId { get; set; }
    public ProductGroup? ProductGroup { get; set; }
    public string DiscountProfileCode { get; set; } = string.Empty;
    public decimal Percent { get; set; }
}
