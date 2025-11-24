using System.Collections.Generic;
using backend.Enums;

namespace backend.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string Email { get; set; } = "";
    public byte[] PasswordHash { get; set; } = Array.Empty<byte>();
    public byte[] PasswordSalt { get; set; } = Array.Empty<byte>();
    public string Company { get; set; } = "";
    public string CompanyCode { get; set; } = "";
    public string Country { get; set; } = "";
    public string City { get; set; } = "";
    public string Address { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Fax { get; set; } = "";
    public string? LastContactNote { get; set; }
    public string InterfaceLanguage { get; set; } = "ukrainian";
    public string AvatarUrl { get; set; } = "";
    public int[] Roles { get; set; } = Array.Empty<int>();
    public Guid? ManagerUserId { get; set; }
    public User? ManagerUser { get; set; }
    public bool IsConfirmed { get; set; } = false;
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime? LastPasswordResetAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid? DefaultBranchId { get; set; }
    public Department? DefaultBranch { get; set; }
    public Guid? DepartmentShopId { get; set; }
    public Department? DepartmentShop { get; set; }
    public Guid? DiscountProfileId { get; set; }
    public DiscountProfile? DiscountProfile { get; set; }
    public ICollection<AuthCode> AuthCodes { get; set; } = new List<AuthCode>();
    public ICollection<SpecialDiscount> SpecialDiscounts { get; set; } = new List<SpecialDiscount>();
    public ICollection<UserProductAccess> ProductAccesses { get; set; } = new List<UserProductAccess>();
    public ICollection<Order> OrdersCreated { get; set; } = new List<Order>();
    public ICollection<NotificationPreference> NotificationPreferences { get; set; } = new List<NotificationPreference>();
}
