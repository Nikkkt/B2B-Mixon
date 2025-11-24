using backend.DTOs.Auth;
using backend.DTOs.Profile;
using backend.DTOs.User;

namespace backend.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResultDto> RegisterAsync(RegisterDto dto);
    Task<AuthResultDto> LoginAsync(LoginDto dto);
    Task<AuthResultDto> ResendVerificationCodeAsync(string email);
    Task<AuthResultDto> VerifyEmailAsync(VerifyCodeDto dto);
    Task<AuthResultDto> RequestPasswordResetAsync(ResetPasswordRequestDto dto);
    Task<AuthResultDto> VerifyPasswordResetCodeAsync(ResetPasswordVerifyDto dto);
    Task<AuthResultDto> ResetPasswordAsync(ResetPasswordDto dto);
    Task<ProfileResponseDto> GetProfileAsync(Guid userId);
    Task<ProfileResponseDto> UpdateProfileAsync(Guid userId, ProfileUpdateRequestDto dto);
}
