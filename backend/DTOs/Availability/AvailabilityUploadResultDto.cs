using System;
using System.Collections.Generic;

namespace backend.DTOs.Availability;

public class AvailabilityUploadResultDto
{
    public string DepartmentDisplayName { get; set; } = string.Empty;
    public int RowsProcessed { get; set; }
    public int ProductsImported { get; set; }
    public int RowsSkipped { get; set; }
    public IReadOnlyList<string> Errors { get; set; } = Array.Empty<string>();
    public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
}
