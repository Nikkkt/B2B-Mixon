namespace backend.DTOs.AdminUsers;

public class AdminProductGroupDto
{
    public Guid Id { get; set; }
    public string GroupNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
}
