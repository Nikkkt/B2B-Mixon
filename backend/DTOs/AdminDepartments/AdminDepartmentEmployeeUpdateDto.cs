using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.AdminDepartments;

public class AdminDepartmentEmployeeUpdateDto
{
    public Guid? Id { get; set; }

    public Guid? UserId { get; set; }

    [Required]
    [MinLength(2)]
    [MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(250)]
    public string? Note { get; set; }
}
