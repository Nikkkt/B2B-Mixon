using System;

namespace backend.DTOs.Availability;

public class ProductAvailabilitySearchResultDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}
