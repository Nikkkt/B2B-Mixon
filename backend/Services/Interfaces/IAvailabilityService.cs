using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs.Common;
using backend.DTOs.Availability;
using Microsoft.AspNetCore.Http;

namespace backend.Services.Interfaces;

public interface IAvailabilityService
{
    Task<IReadOnlyList<AvailabilityBranchDto>> GetBranchesAsync(Guid userId);
    Task<IReadOnlyList<AvailabilityDirectionDto>> GetDirectionsAsync(Guid userId, Guid? branchId);
    Task<IReadOnlyList<AvailabilityGroupDto>> GetGroupsAsync(Guid userId, Guid directionId);
    Task<AvailabilityProductsResponseDto> GetProductsAsync(Guid userId, Guid departmentId, Guid groupId);
    Task<GroupAvailabilityTableDto> GetGroupAvailabilityAsync(Guid userId, Guid groupId);
    Task<FileDownloadDto> ExportGroupAvailabilityToExcelAsync(Guid userId, Guid groupId);
    Task<FileDownloadDto> ExportGroupAvailabilityToPdfAsync(Guid userId, Guid groupId);
    Task<ProductAvailabilityResultDto> GetProductAvailabilityByCodeAsync(Guid userId, string code);
    Task<IReadOnlyList<ProductAvailabilitySearchResultDto>> SearchProductsByNameAsync(Guid userId, string query);
    Task<AvailabilityUploadResultDto> UploadAvailabilityAsync(Guid userId, IFormFile file);
}
