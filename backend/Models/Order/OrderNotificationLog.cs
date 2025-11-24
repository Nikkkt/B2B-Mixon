using backend.Enums;

namespace backend.Models;

public class OrderNotificationLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Order? Order { get; set; }
    public NotificationRecipientType RecipientType { get; set; }
    public string RecipientEmail { get; set; } = string.Empty;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
}
