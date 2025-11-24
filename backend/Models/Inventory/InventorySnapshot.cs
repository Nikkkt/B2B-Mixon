namespace backend.Models;

public class InventorySnapshot
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DepartmentId { get; set; }
    public Department? Department { get; set; }
    public Guid ProductId { get; set; }
    public Product? Product { get; set; }
    public decimal AvailableQuantity { get; set; }
    public DateTime CapturedAt { get; set; } = DateTime.UtcNow;
}
