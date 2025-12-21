using System;

namespace backend.DTOs.Availability;

public class ProductAvailabilityBranchQuantityDto
{
    public Guid DepartmentId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public DateTime? LastUpdatedAt { get; set; }
}
