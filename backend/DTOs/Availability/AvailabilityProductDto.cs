using System;

namespace backend.DTOs.Availability;

public class AvailabilityProductDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal AvailableQuantity { get; set; }
    public DateTime? LastUpdatedAt { get; set; }
}
