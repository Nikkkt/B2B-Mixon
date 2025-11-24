using System;
using System.Collections.Generic;

namespace backend.DTOs.AdminDepartments;

public class AdminDepartmentDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string TypeLabel { get; set; } = string.Empty;
    public Guid? BranchId { get; set; }
    public string? BranchName { get; set; }
    public string? ShippingPoint { get; set; }
    public Guid? SourceBranchId { get; set; }
    public string? SourceBranch { get; set; }
    public DateTime AddedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<AdminDepartmentEmployeeDto> Employees { get; set; } = new();
    public List<AdminDepartmentClientDto> AssignedClients { get; set; } = new();
}
