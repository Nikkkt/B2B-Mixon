using System;
using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.AdminProductGroups;

public class AdminProductGroupCreateRequestDto
{
    [Required]
    [StringLength(50)]
    public string GroupNumber { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string ProductLine { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public Guid DirectionId { get; set; }

    public int? SortOrder { get; set; }
}
