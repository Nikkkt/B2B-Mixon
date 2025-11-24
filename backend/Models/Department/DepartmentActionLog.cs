namespace backend.Models;

public class DepartmentActionLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DepartmentId { get; set; }
    public Department? Department { get; set; }
    public string ActionKey { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public Guid? PerformedByUserId { get; set; }
    public User? PerformedByUser { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? PayloadJson { get; set; }
}
