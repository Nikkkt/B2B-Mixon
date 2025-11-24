using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Auth;

public class VerifyCodeDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = "";

    [Required]
    [StringLength(6, MinimumLength = 6)]
    public string Code { get; set; } = "";
}
