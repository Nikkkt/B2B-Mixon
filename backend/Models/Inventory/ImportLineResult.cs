namespace backend.Models;

public class ImportLineResult
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ImportJobId { get; set; }
    public ImportJob? ImportJob { get; set; }
    public int RowNumber { get; set; }
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public string? PayloadJson { get; set; }
}
