using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using backend.DTOs.OrderManagement;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Authorize]
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpPost]
    public async Task<ActionResult<OrderDto>> CreateOrder([FromBody] CreateOrderDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var userId = GetCurrentUserId();
            var order = await _orderService.CreateOrderFromCartAsync(userId, request);
            return Ok(order);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
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

    [HttpGet("history/export/excel")]
    public async Task<IActionResult> ExportOrderHistoryToExcel(
        [FromQuery] Guid? createdByUserId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] string? orderType,
        [FromQuery] string? paymentMethod,
        [FromQuery] string? visibilityScope)
    {
        try
        {
            var userId = GetCurrentUserId();
            var filter = new OrderHistoryFilterDto
            {
                CreatedByUserId = createdByUserId,
                StartDate = startDate,
                EndDate = endDate,
                OrderType = orderType,
                PaymentMethod = paymentMethod,
                VisibilityScope = visibilityScope,
            };

            var bytes = await _orderService.ExportOrderHistoryToExcelAsync(userId, filter);
            var fileName = $"order-history-{DateTime.UtcNow:yyyyMMddHHmmss}.xlsx";
            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    [HttpGet("history/export/pdf")]
    public async Task<IActionResult> ExportOrderHistoryToPdf(
        [FromQuery] Guid? createdByUserId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] string? orderType,
        [FromQuery] string? paymentMethod,
        [FromQuery] string? visibilityScope)
    {
        try
        {
            var userId = GetCurrentUserId();
            var filter = new OrderHistoryFilterDto
            {
                CreatedByUserId = createdByUserId,
                StartDate = startDate,
                EndDate = endDate,
                OrderType = orderType,
                PaymentMethod = paymentMethod,
                VisibilityScope = visibilityScope,
            };

            var bytes = await _orderService.ExportOrderHistoryToPdfAsync(userId, filter);
            var fileName = $"order-history-{DateTime.UtcNow:yyyyMMddHHmmss}.pdf";
            return File(bytes, "application/pdf", fileName);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    [HttpGet("history")]
    public async Task<ActionResult<OrderHistoryResponseDto>> GetOrderHistory(
        [FromQuery] Guid? createdByUserId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] string? orderType,
        [FromQuery] string? paymentMethod,
        [FromQuery] string? visibilityScope,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var userId = GetCurrentUserId();
            var filter = new OrderHistoryFilterDto
            {
                CreatedByUserId = createdByUserId,
                StartDate = startDate,
                EndDate = endDate,
                OrderType = orderType,
                PaymentMethod = paymentMethod,
                VisibilityScope = visibilityScope,
                Page = page,
                PageSize = pageSize
            };

            var result = await _orderService.GetOrderHistoryAsync(userId, filter);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    [HttpGet("{orderId:guid}")]
    public async Task<ActionResult<OrderDto>> GetOrderById(Guid orderId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var order = await _orderService.GetOrderByIdAsync(userId, orderId);
            return Ok(order);
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

    [HttpPost("{orderId:guid}/repeat")]
    public async Task<ActionResult<OrderDto>> RepeatOrder(Guid orderId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var order = await _orderService.RepeatOrderAsync(userId, orderId);
            return Ok(order);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{orderId:guid}/export/excel")]
    public async Task<IActionResult> ExportOrderToExcel(Guid orderId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var file = await _orderService.ExportOrderToExcelAsync(userId, orderId);
            return File(file.Content, file.ContentType, file.FileName);
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

    [HttpGet("{orderId:guid}/export/pdf")]
    public async Task<IActionResult> ExportOrderToPdf(Guid orderId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var file = await _orderService.ExportOrderToPdfAsync(userId, orderId);
            return File(file.Content, file.ContentType, file.FileName);
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

    [HttpGet("available-users")]
    public async Task<ActionResult> GetAvailableUsers()
    {
        try
        {
            var userId = GetCurrentUserId();
            var users = await _orderService.GetAvailableUsersForFilteringAsync(userId);
            return Ok(users);
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
