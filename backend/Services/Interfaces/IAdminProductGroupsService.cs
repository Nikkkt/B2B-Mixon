using backend.DTOs.AdminProductGroups;
using Microsoft.AspNetCore.Http;

namespace backend.Services.Interfaces;

public interface IAdminProductGroupsService
{
    Task<IReadOnlyList<AdminProductGroupDto>> GetAsync();
    Task<AdminProductGroupDto> GetAsync(Guid id);
    Task<AdminProductGroupDto> CreateAsync(AdminProductGroupCreateRequestDto dto);
    Task<AdminProductGroupDto> UpdateAsync(Guid id, AdminProductGroupUpdateRequestDto dto);
    Task DeleteAsync(Guid id);
    Task<AdminProductGroupUploadResultDto> UploadDiscountsAsync(IFormFile file);
}
