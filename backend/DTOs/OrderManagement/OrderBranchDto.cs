namespace backend.DTOs.OrderManagement;

public class OrderBranchDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? City { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
}
