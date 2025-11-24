using backend.DTOs.AdminDepartments;

namespace backend.Services.Interfaces;

public interface IAdminDepartmentsService
{
    Task<AdminDepartmentDto> CreateDepartmentAsync(AdminDepartmentCreateRequestDto dto);
    Task<AdminDepartmentsDashboardDto> GetDashboardAsync();
    Task<AdminDepartmentDto> GetDepartmentAsync(Guid departmentId);
    Task<AdminDepartmentDto> UpdateDepartmentAsync(Guid departmentId, AdminDepartmentUpdateRequestDto dto);
    Task DeleteDepartmentAsync(Guid departmentId);
}
