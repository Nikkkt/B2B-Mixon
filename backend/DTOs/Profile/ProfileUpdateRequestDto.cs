using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Profile;

public class ProfileUpdateRequestDto
{
    [Required]
    [StringLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Phone]
    [StringLength(50)]
    public string Phone { get; set; } = string.Empty;

    [StringLength(150)]
    public string Company { get; set; } = string.Empty;

    [StringLength(50)]
    public string CompanyCode { get; set; } = string.Empty;

    [StringLength(100)]
    public string Country { get; set; } = string.Empty;

    [StringLength(100)]
    public string City { get; set; } = string.Empty;

    [StringLength(200)]
    public string Address { get; set; } = string.Empty;

    [StringLength(50)]
    public string Fax { get; set; } = string.Empty;

    [StringLength(50)]
    public string Language { get; set; } = "ukrainian";

    [StringLength(2048)]
    public string? AvatarUrl { get; set; }

    public Guid? DefaultBranchId { get; set; }
    public Guid? DiscountProfileId { get; set; }

    [StringLength(100)]
    public string? Password { get; set; }
}
