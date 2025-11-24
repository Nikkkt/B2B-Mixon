using backend.DTOs.AdminUsers;

namespace backend.Services.Interfaces;

public interface IAdminUsersService
{
    Task<AdminUsersResponseDto> GetDashboardAsync();
    Task<AdminUserDto> GetUserAsync(Guid userId);
    Task<AdminUserDto> CreateUserAsync(AdminUserCreateRequestDto dto);
    Task<AdminUserDto> UpdateUserAsync(Guid userId, AdminUserUpdateRequestDto dto);
}
