namespace backend.DTOs.AdminUsers;

public class AdminUserSpecialDiscountDto
{
    public Guid Id { get; set; }
    public Guid ProductGroupId { get; set; }
    public string ProductGroupNumber { get; set; } = string.Empty;
    public string ProductGroupName { get; set; } = string.Empty;
    public decimal Percent { get; set; }
    public DateTime CreatedAt { get; set; }
}
