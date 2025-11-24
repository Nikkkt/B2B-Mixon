using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.AdminDirections;

public class AdminDirectionCreateRequestDto
{
    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [StringLength(32)]
    public string? Code { get; set; }

    public int? SortOrder { get; set; }
}
