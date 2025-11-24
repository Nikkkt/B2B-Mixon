using System;

namespace backend.DTOs.AdminDepartments;

public class AdminDepartmentEmployeeDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Note { get; set; }
}
