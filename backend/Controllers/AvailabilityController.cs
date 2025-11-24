using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;
using backend.DTOs.Availability;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Authorize]
[Route("api/availability")]
public class AvailabilityController : ControllerBase
{
    private readonly IAvailabilityService _availabilityService;

    public AvailabilityController(IAvailabilityService availabilityService)
    {
        _availabilityService = availabilityService;
    }

    [HttpGet("branches")]
    public async Task<ActionResult<IEnumerable<AvailabilityBranchDto>>> GetBranches()
    {
        try
        {
            var userId = GetCurrentUserId();
            var branches = await _availabilityService.GetBranchesAsync(userId);
            return Ok(branches);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpPost("uploads")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<ActionResult<AvailabilityUploadResultDto>> UploadAvailability(IFormFile file)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _availabilityService.UploadAvailabilityAsync(userId, file);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = ex.Message });
        }
    }

    [HttpGet("directions")]
    public async Task<ActionResult<IEnumerable<AvailabilityDirectionDto>>> GetDirections([FromQuery] Guid? branchId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var directions = await _availabilityService.GetDirectionsAsync(userId, branchId);
            return Ok(directions);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpGet("directions/{directionId:guid}/groups")]
    public async Task<ActionResult<IEnumerable<AvailabilityGroupDto>>> GetGroups(Guid directionId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var groups = await _availabilityService.GetGroupsAsync(userId, directionId);
            return Ok(groups);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = ex.Message });
        }
    }

    [HttpGet("branches/{branchId:guid}/groups/{groupId:guid}/products")]
    public async Task<ActionResult<AvailabilityProductsResponseDto>> GetProducts(Guid branchId, Guid groupId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var response = await _availabilityService.GetProductsAsync(userId, branchId, groupId);
            return Ok(response);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = ex.Message });
        }
    }

    [HttpGet("groups/{groupId:guid}/table")]
    public async Task<ActionResult<GroupAvailabilityTableDto>> GetGroupAvailability(Guid groupId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var table = await _availabilityService.GetGroupAvailabilityAsync(userId, groupId);
            return Ok(table);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = ex.Message });
        }
    }

    [HttpGet("products/by-code")]
    public async Task<ActionResult<ProductAvailabilityResultDto>> GetProductAvailabilityByCode([FromQuery] string code)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _availabilityService.GetProductAvailabilityByCodeAsync(userId, code);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = ex.Message });
        }
    }

    [HttpGet("products/search")]
    public async Task<ActionResult<IEnumerable<ProductAvailabilitySearchResultDto>>> SearchProductsByName([FromQuery] string query)
    {
        try
        {
            var userId = GetCurrentUserId();
            var results = await _availabilityService.SearchProductsByNameAsync(userId, query);
            return Ok(results);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = ex.Message });
        }
    }

    [HttpGet("groups/{groupId:guid}/export/excel")]
    public async Task<IActionResult> ExportGroupAvailabilityToExcel(Guid groupId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var file = await _availabilityService.ExportGroupAvailabilityToExcelAsync(userId, groupId);
            return File(file.Content, file.ContentType, file.FileName);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = ex.Message });
        }
    }

    [HttpGet("groups/{groupId:guid}/export/pdf")]
    public async Task<IActionResult> ExportGroupAvailabilityToPdf(Guid groupId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var file = await _availabilityService.ExportGroupAvailabilityToPdfAsync(userId, groupId);
            return File(file.Content, file.ContentType, file.FileName);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = ex.Message });
        }
    }

    private Guid GetCurrentUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (string.IsNullOrWhiteSpace(userId) || !Guid.TryParse(userId, out var parsed))
        {
            throw new UnauthorizedAccessException("Unable to resolve user identity.");
        }

        return parsed;
    }
}
