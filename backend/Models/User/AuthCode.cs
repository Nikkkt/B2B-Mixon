using backend.Enums;

namespace backend.Models;

public class AuthCode
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string Code { get; set; } = string.Empty;
    public AuthCodePurpose Purpose { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? ConsumedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsActive => ConsumedAt == null && DateTime.UtcNow <= ExpiresAt;
}
