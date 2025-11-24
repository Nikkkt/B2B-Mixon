namespace backend.DTOs.AdminUsers;

public class AdminUserDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Company { get; set; }
    public string? CompanyCode { get; set; }
    public string? Country { get; set; }
    public string? City { get; set; }
    public string? Address { get; set; }
    public string? Location { get; set; }
    public string? Phone { get; set; }
    public string? Fax { get; set; }
    public List<string> Roles { get; set; } = new();
    public Guid? ShippingPointId { get; set; }
    public string? ShippingPointName { get; set; }
    public Guid? DepartmentShopId { get; set; }
    public string? DepartmentShopName { get; set; }
    public Guid? DiscountProfileId { get; set; }
    public string? DiscountProfileCode { get; set; }
    public Guid? ManagerUserId { get; set; }
    public string? ManagerDisplayName { get; set; }
    public string? ManagerEmail { get; set; }
    public List<AdminUserDefaultDiscountDto> DefaultDiscounts { get; set; } = new();
    public List<AdminUserSpecialDiscountDto> SpecialDiscounts { get; set; } = new();
    public bool HasFullAccess { get; set; }
    public List<Guid> ProductGroupAccessIds { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public string? LastContact { get; set; }
    public bool IsConfirmed { get; set; }
    public bool IsNew { get; set; }
}
