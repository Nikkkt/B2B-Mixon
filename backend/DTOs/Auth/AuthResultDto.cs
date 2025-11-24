using backend.DTOs.User;

namespace backend.DTOs.Auth;

public class AuthResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? Token { get; set; }
    public UserDto? User { get; set; }
    public DateTime? TokenExpiresAt { get; set; }
}
