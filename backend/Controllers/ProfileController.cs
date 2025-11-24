using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using backend.DTOs.Profile;
using backend.Exceptions;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Authorize]
[Route("api/profile")]
public class ProfileController : ControllerBase
{
    private readonly IAuthService _authService;

    public ProfileController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpGet]
    public async Task<ActionResult<ProfileResponseDto>> GetProfile()
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _authService.GetProfileAsync(userId);
            return Ok(result);
        }
        catch (AuthException ex)
        {
            return StatusCode(ex.StatusCode, new { error = ex.Message });
        }
    }

    [HttpPut]
    public async Task<ActionResult<ProfileResponseDto>> UpdateProfile([FromBody] ProfileUpdateRequestDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var userId = GetCurrentUserId();
            var result = await _authService.UpdateProfileAsync(userId, dto);
            return Ok(result);
        }
        catch (AuthException ex)
        {
            return StatusCode(ex.StatusCode, new { error = ex.Message });
        }
    }

    private Guid GetCurrentUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (string.IsNullOrWhiteSpace(userId) || !Guid.TryParse(userId, out var parsed))
        {
            throw new AuthException("Unable to resolve user identity.", StatusCodes.Status401Unauthorized);
        }

        return parsed;
    }
}
