using backend.DTOs.AdminUsers;
using backend.Services.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/users")]
public class AdminUsersController : ControllerBase
{
    private readonly IAdminUsersService _adminUsersService;
    private readonly ILogger<AdminUsersController> _logger;

    public AdminUsersController(IAdminUsersService adminUsersService, ILogger<AdminUsersController> logger)
    {
        _adminUsersService = adminUsersService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<AdminUsersResponseDto>> GetDashboard()
    {
        var result = await _adminUsersService.GetDashboardAsync();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<AdminUserDto>> CreateUser([FromBody] AdminUserCreateRequestDto dto)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var created = await _adminUsersService.CreateUserAsync(dto);
            return CreatedAtAction(nameof(GetUser), new { id = created.Id }, created);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Admin attempted to create user with conflicting data");
            return Conflict(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Admin provided invalid data while creating user");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AdminUserDto>> GetUser(Guid id)
    {
        try
        {
            var user = await _adminUsersService.GetUserAsync(id);
            return Ok(user);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Admin requested non-existent user {UserId}", id);
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AdminUserDto>> UpdateUser(Guid id, [FromBody] AdminUserUpdateRequestDto dto)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var updated = await _adminUsersService.UpdateUserAsync(id, dto);
            return Ok(updated);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Admin attempted to update non-existent user {UserId}", id);
            return NotFound(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Admin provided invalid data while updating user {UserId}", id);
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteUser(Guid id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == id)
            {
                return BadRequest(new { error = "You cannot delete your own account." });
            }

            await _adminUsersService.DeleteUserAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Admin attempted to delete non-existent user {UserId}", id);
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Admin attempted to delete user {UserId} that cannot be deleted", id);
            return Conflict(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Admin attempted to delete user {UserId} with invalid request", id);
            return BadRequest(new { error = ex.Message });
        }
    }

    private Guid GetCurrentUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (string.IsNullOrWhiteSpace(userId) || !Guid.TryParse(userId, out var parsed))
        {
            throw new InvalidOperationException("Unable to resolve user identity.");
        }

        return parsed;
    }
}
