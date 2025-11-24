using backend.Enums;

namespace backend.DTOs.Profile;

public class ProfileResponseDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;
    public string CompanyCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Fax { get; set; } = string.Empty;
    public string Language { get; set; } = "ukrainian";
    public string AvatarUrl { get; set; } = string.Empty;
    public Guid? DefaultBranchId { get; set; }
    public Guid? DepartmentShopId { get; set; }
    public string? DepartmentShopName { get; set; }
    public Guid? DiscountProfileId { get; set; }
    public string? DiscountProfileCode { get; set; }
    public List<string> Roles { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
}
