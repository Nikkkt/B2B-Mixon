using backend.DTOs.AdminDirections;

namespace backend.Services.Interfaces;

public interface IAdminDirectionsService
{
    Task<IReadOnlyList<AdminDirectionDto>> GetDirectionsAsync();
    Task<AdminDirectionDto> GetDirectionAsync(Guid directionId);
    Task<AdminDirectionDto> CreateDirectionAsync(AdminDirectionCreateRequestDto dto);
    Task<AdminDirectionDto> UpdateDirectionAsync(Guid directionId, AdminDirectionUpdateRequestDto dto);
    Task DeleteDirectionAsync(Guid directionId);
}
