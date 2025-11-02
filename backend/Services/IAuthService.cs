using backend.DTOs;

namespace backend.Services;

public interface IAuthService
{
    Task<string> RegisterAsync(RegisterDto dto);
    Task<string> LoginAsync(LoginDto dto);
    Task<string> ResetPasswordAsync(ResetPasswordDto dto);
    Task<bool> VerifyCodeAsync(VerifyCodeDto dto);
}