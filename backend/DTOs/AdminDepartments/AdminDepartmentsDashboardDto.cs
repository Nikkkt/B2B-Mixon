using backend.DTOs.AdminUsers;

namespace backend.DTOs.AdminDepartments;

public class AdminDepartmentsDashboardDto
{
    public List<AdminDepartmentDto> Branches { get; set; } = new();
    public List<AdminDepartmentDto> Stores { get; set; } = new();
    public List<AdminDepartmentDto> SalesDepartments { get; set; } = new();
    public List<AdminBranchDto> BranchOptions { get; set; } = new();
}
