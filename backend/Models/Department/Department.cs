using backend.Enums;

namespace backend.Models;

public class Department
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DepartmentType Type { get; set; } = DepartmentType.Branch;
    public Guid? BranchId { get; set; }
    public Branch? Branch { get; set; }
    public Guid? SourceBranchId { get; set; }
    public Branch? SourceBranch { get; set; }
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<DepartmentEmployee> Employees { get; set; } = new List<DepartmentEmployee>();
    public ICollection<DepartmentActionLog> ActionLogs { get; set; } = new List<DepartmentActionLog>();
}
