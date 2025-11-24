using backend.Enums;

namespace backend.Models;

public class ImportJob
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public ImportJobType JobType { get; set; } = ImportJobType.Unknown;
    public ImportJobStatus Status { get; set; } = ImportJobStatus.Pending;
    public string? Filename { get; set; }
    public int TotalRows { get; set; }
    public int ProcessedRows { get; set; }
    public int SuccessfulRows { get; set; }
    public int FailedRows { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<ImportLineResult> LineResults { get; set; } = new List<ImportLineResult>();
}
