using System;

namespace backend.DTOs.Availability;

public class AvailabilityGroupDto
{
    public Guid Id { get; set; }
    public Guid DirectionId { get; set; }
    public string GroupNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string ProductLine { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}
