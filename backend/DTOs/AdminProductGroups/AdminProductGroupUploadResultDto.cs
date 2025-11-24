using System.Collections.Generic;

namespace backend.DTOs.AdminProductGroups;

public class AdminProductGroupUploadResultDto
{
    public int Processed { get; set; }
    public int Updated { get; set; }
    public int Skipped { get; set; }
    public int NotFound { get; set; }
    public List<string> Errors { get; set; } = new();
    public string Message { get; set; } = string.Empty;
}
