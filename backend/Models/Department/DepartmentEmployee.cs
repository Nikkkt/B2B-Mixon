namespace backend.Models;

public class DepartmentEmployee
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DepartmentId { get; set; }
    public Department? Department { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Note { get; set; }
}
