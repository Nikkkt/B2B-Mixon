using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Auth;

public class ResetPasswordRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = "";
}

public class ResetPasswordVerifyDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = "";

    [Required]
    [StringLength(6, MinimumLength = 6)]
    public string Code { get; set; } = "";
}

public class ResetPasswordDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = "";

    [Required]
    [StringLength(6, MinimumLength = 6)]
    public string Code { get; set; } = "";

    [Required]
    [RegularExpression(@"^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$", ErrorMessage = "Password must be at least 8 characters and contain an uppercase letter, a number, and a special character.")]
    public string NewPassword { get; set; } = "";

    [Required]
    [Compare(nameof(NewPassword), ErrorMessage = "Passwords do not match.")]
    public string ConfirmPassword { get; set; } = "";
}
