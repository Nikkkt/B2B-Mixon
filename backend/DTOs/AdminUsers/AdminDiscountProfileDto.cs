namespace backend.DTOs.AdminUsers;

public class AdminDiscountProfileDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<AdminUserDefaultDiscountDto> DefaultDiscounts { get; set; } = new();
}
