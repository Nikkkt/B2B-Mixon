using backend.DTOs.AdminDirections;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/directions")]
public class AdminDirectionsController : ControllerBase
{
    private readonly IAdminDirectionsService _directionsService;

    public AdminDirectionsController(IAdminDirectionsService directionsService)
    {
        _directionsService = directionsService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AdminDirectionDto>>> GetDirections()
    {
        var directions = await _directionsService.GetDirectionsAsync();
        return Ok(directions);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AdminDirectionDto>> GetDirection(Guid id)
    {
        try
        {
            var direction = await _directionsService.GetDirectionAsync(id);
            return Ok(direction);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<AdminDirectionDto>> CreateDirection([FromBody] AdminDirectionCreateRequestDto dto)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var created = await _directionsService.CreateDirectionAsync(dto);
            return CreatedAtAction(nameof(GetDirection), new { id = created.Id }, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AdminDirectionDto>> UpdateDirection(Guid id, [FromBody] AdminDirectionUpdateRequestDto dto)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var updated = await _directionsService.UpdateDirectionAsync(id, dto);
            return Ok(updated);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteDirection(Guid id)
    {
        try
        {
            await _directionsService.DeleteDirectionAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }
}
