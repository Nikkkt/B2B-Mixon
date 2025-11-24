using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.AdminDepartments;

public class AdminDepartmentUpdateRequestDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [RegularExpression("^(branch|store|sales)$", ErrorMessage = "Type must be branch, store or sales.")]
    public string Type { get; set; } = "branch";

    public Guid? BranchId { get; set; }

    public Guid? SourceBranchId { get; set; }

    public List<AdminDepartmentEmployeeUpdateDto> Employees { get; set; } = new();
}
