using System;
using System.Collections.Generic;

namespace backend.DTOs.Availability;

public class GroupAvailabilityTableDto
{
    public Guid GroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public Guid DirectionId { get; set; }
    public string DirectionName { get; set; } = string.Empty;
    public DateTime? LastUpdatedAt { get; set; }
    public IReadOnlyList<GroupAvailabilityBranchDto> Branches { get; set; } = Array.Empty<GroupAvailabilityBranchDto>();
    public IReadOnlyList<GroupAvailabilityProductRowDto> Products { get; set; } = Array.Empty<GroupAvailabilityProductRowDto>();
}
