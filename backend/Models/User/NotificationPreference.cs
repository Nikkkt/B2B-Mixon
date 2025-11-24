using backend.Enums;

namespace backend.Models;

public class NotificationPreference
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public NotificationOwnerType OwnerType { get; set; }
    public Guid OwnerId { get; set; }
    public NotificationRecipientType RecipientType { get; set; }
    public string Email { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
