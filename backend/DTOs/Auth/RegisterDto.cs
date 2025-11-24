using System.ComponentModel.DataAnnotations;
using backend.Enums;

namespace backend.DTOs.Auth;

public class RegisterDto
{
    [Required]
    [StringLength(100)]
    public string FirstName { get; set; } = "";

    [Required]
    [StringLength(100)]
    public string LastName { get; set; } = "";

    [Required]
    [EmailAddress]
    public string Email { get; set; } = "";

    [Required]
    [RegularExpression(@"^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$", ErrorMessage = "Password must be at least 8 characters and contain an uppercase letter, a number, and a special character.")]
    public string Password { get; set; } = "";

    [Required]
    [Compare(nameof(Password), ErrorMessage = "Passwords do not match.")]
    public string ConfirmPassword { get; set; } = "";

    [StringLength(150)]
    public string Company { get; set; } = "";

    [StringLength(100)]
    public string Country { get; set; } = "";

    [StringLength(100)]
    public string City { get; set; } = "";

    [StringLength(200)]
    public string Address { get; set; } = "";

    [Phone]
    [StringLength(50)]
    public string Phone { get; set; } = "";

    [MinLength(1, ErrorMessage = "At least one role must be specified.")]
    public List<string> Roles { get; set; } = new() { "customer" };
}
