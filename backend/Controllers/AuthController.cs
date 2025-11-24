using backend.DTOs.Auth;
using backend.Exceptions;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        => await ExecuteAsync(() => _authService.RegisterAsync(dto));

    [HttpPost("register/resend-code")]
    public async Task<IActionResult> ResendVerificationCode([FromBody] EmailRequestDto dto)
        => await ExecuteAsync(() => _authService.ResendVerificationCodeAsync(dto.Email));

    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyCodeDto dto)
        => await ExecuteAsync(() => _authService.VerifyEmailAsync(dto));

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
        => await ExecuteAsync(() => _authService.LoginAsync(dto));

    [HttpPost("password-reset/request")]
    public async Task<IActionResult> RequestPasswordReset([FromBody] ResetPasswordRequestDto dto)
        => await ExecuteAsync(() => _authService.RequestPasswordResetAsync(dto));

    [HttpPost("password-reset/verify")]
    public async Task<IActionResult> VerifyPasswordReset([FromBody] ResetPasswordVerifyDto dto)
        => await ExecuteAsync(() => _authService.VerifyPasswordResetCodeAsync(dto));

    [HttpPost("password-reset/confirm")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        => await ExecuteAsync(() => _authService.ResetPasswordAsync(dto));

    private async Task<IActionResult> ExecuteAsync(Func<Task<AuthResultDto>> action)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var result = await action();
            return Ok(result);
        }
        catch (AuthException ex)
        {
            return StatusCode(ex.StatusCode, new { error = ex.Message });
        }
    }
}
