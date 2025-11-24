using System;
using System.Collections.Generic;

namespace backend.DTOs.Availability;

public class GroupAvailabilityProductRowDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal TotalQuantity { get; set; }
    public DateTime? LastUpdatedAt { get; set; }
    public IReadOnlyList<GroupAvailabilityBranchQuantityDto> Branches { get; set; } = Array.Empty<GroupAvailabilityBranchQuantityDto>();
}
