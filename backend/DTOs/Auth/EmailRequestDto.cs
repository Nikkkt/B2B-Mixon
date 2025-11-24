using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Auth;

public class EmailRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}
