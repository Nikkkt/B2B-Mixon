using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;
using backend.DTOs.Orders;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Authorize]
[Route("api/orders")]
public class OrdersCatalogController : ControllerBase
{
    private readonly IOrdersCatalogService _catalogService;

    public OrdersCatalogController(IOrdersCatalogService catalogService)
    {
        _catalogService = catalogService;
    }

    [HttpGet("directions")]
    public async Task<ActionResult<IEnumerable<OrderDirectionDto>>> GetDirections()
    {
        try
        {
            var userId = GetCurrentUserId();
            var directions = await _catalogService.GetDirectionsAsync(userId);
            return Ok(directions);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpPost("lookup-by-codes")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<ActionResult<IEnumerable<OrderProductLookupResultDto>>> LookupByCodes([FromBody] OrderProductLookupRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var userId = GetCurrentUserId();
            var results = await _catalogService.SearchProductsByCodesAsync(userId, request);
            return Ok(results);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = ex.Message });
        }
    }

    [HttpGet("directions/{directionId:guid}/groups")]
    public async Task<ActionResult<IEnumerable<OrderProductGroupDto>>> GetGroups(Guid directionId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var groups = await _catalogService.GetGroupsAsync(userId, directionId);
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

    [HttpGet("groups/{groupId:guid}/products")]
    public async Task<ActionResult<IEnumerable<OrderProductDto>>> GetProducts(Guid groupId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var products = await _catalogService.GetProductsAsync(userId, groupId);
            return Ok(products);
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
