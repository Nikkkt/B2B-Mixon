using System;

namespace backend.DTOs.Availability;

public class AvailabilityBranchDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public Guid? ParentBranchId { get; set; }
    public string ParentDisplayName { get; set; } = string.Empty;
}
