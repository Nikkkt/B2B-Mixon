namespace backend.DTOs.AdminUsers;

public class AdminUsersResponseDto
{
    public List<AdminUserDto> Users { get; set; } = new();
    public List<AdminBranchDto> Branches { get; set; } = new();
    public List<AdminBranchDto> Shops { get; set; } = new();
    public List<AdminProductGroupDto> ProductGroups { get; set; } = new();
    public List<AdminDiscountProfileDto> DiscountProfiles { get; set; } = new();
    public List<AdminManagerOptionDto> Managers { get; set; } = new();
}
