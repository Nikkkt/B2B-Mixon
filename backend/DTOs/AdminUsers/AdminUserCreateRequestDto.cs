using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.AdminUsers;

public class AdminUserCreateRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    public string LastName { get; set; } = string.Empty;

    [MinLength(1, ErrorMessage = "At least one role must be specified.")]
    public List<string> Roles { get; set; } = new() { "user" };

    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;

    public string? Company { get; set; }
    public string? CompanyCode { get; set; }
    public string? Country { get; set; }
    public string? City { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? Fax { get; set; }

    public Guid? ShippingPointId { get; set; }
    public Guid? DepartmentShopId { get; set; }
    public Guid? DiscountProfileId { get; set; }
    public Guid? ManagerUserId { get; set; }
    public bool HasFullAccess { get; set; }
    public List<Guid> ProductGroupAccessIds { get; set; } = new();
    public List<AdminUserSpecialDiscountInputDto> SpecialDiscounts { get; set; } = new();
    public string? LastContact { get; set; }
}
