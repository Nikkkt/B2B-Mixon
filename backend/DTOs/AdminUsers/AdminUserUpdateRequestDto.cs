using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.AdminUsers;

public class AdminUserUpdateRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    public string LastName { get; set; } = string.Empty;

    public string? Company { get; set; }
    public string? CompanyCode { get; set; }
    public string? Country { get; set; }
    public string? City { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? Fax { get; set; }

    [MinLength(1, ErrorMessage = "At least one role must be specified.")]
    public List<string> Roles { get; set; } = new();

    public Guid? ShippingPointId { get; set; }
    public Guid? DepartmentShopId { get; set; }
    public Guid? DiscountProfileId { get; set; }
    public Guid? ManagerUserId { get; set; }
    public bool HasFullAccess { get; set; }
    public List<Guid> ProductGroupAccessIds { get; set; } = new();
    public List<AdminUserSpecialDiscountInputDto> SpecialDiscounts { get; set; } = new();
    public string? LastContact { get; set; }
    public bool IsConfirmed { get; set; }
    public string? Password { get; set; }
}
