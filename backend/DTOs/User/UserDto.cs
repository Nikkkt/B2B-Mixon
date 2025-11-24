using backend.Enums;

namespace backend.DTOs.User;

public class UserDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string Email { get; set; } = "";
    public string Company { get; set; } = "";
    public string CompanyCode { get; set; } = "";
    public string Country { get; set; } = "";
    public string City { get; set; } = "";
    public string Address { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Fax { get; set; } = "";
    public string Language { get; set; } = "ukrainian";
    public string AvatarUrl { get; set; } = "";
    public Guid? DefaultBranchId { get; set; }
    public string? DefaultBranchName { get; set; }
    public Guid? DepartmentShopId { get; set; }
    public string? DepartmentShopName { get; set; }
    public Guid? DiscountProfileId { get; set; }
    public string? DiscountProfileCode { get; set; }
    public bool IsConfirmed { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public List<string> Roles { get; set; } = new();
}
