using System;

namespace backend.DTOs.Availability;

public class GroupAvailabilityBranchQuantityDto
{
    public Guid DepartmentId { get; set; }
    public decimal Quantity { get; set; }
}
