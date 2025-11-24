using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using backend.DTOs.Cart;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Authorize]
[Route("api/cart")]
public class CartController : ControllerBase
{
    private readonly ICartService _cartService;

    public CartController(ICartService cartService)
    {
        _cartService = cartService;
    }

    [HttpGet]
    public async Task<ActionResult<CartDto>> GetCart()
    {
        try
        {
            var userId = GetCurrentUserId();
            var cart = await _cartService.GetOrCreateCartAsync(userId);
            return Ok(cart);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    [HttpPost("items")]
    public async Task<ActionResult<CartDto>> AddItem([FromBody] AddToCartDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var userId = GetCurrentUserId();
            var cart = await _cartService.AddItemAsync(userId, request);
            return Ok(cart);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    [HttpPut("items/{cartItemId:guid}")]
    public async Task<ActionResult<CartDto>> UpdateItemQuantity(
        Guid cartItemId, 
        [FromBody] UpdateCartItemDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var userId = GetCurrentUserId();
            var cart = await _cartService.UpdateItemQuantityAsync(userId, cartItemId, request);
            return Ok(cart);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    [HttpDelete("items/{cartItemId:guid}")]
    public async Task<ActionResult<CartDto>> RemoveItem(Guid cartItemId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var cart = await _cartService.RemoveItemAsync(userId, cartItemId);
            return Ok(cart);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    [HttpDelete]
    public async Task<ActionResult<CartDto>> ClearCart()
    {
        try
        {
            var userId = GetCurrentUserId();
            var cart = await _cartService.ClearCartAsync(userId);
            return Ok(cart);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
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
