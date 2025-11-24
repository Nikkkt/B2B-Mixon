using backend.DTOs.AdminDepartments;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/departments")]
public class AdminDepartmentsController : ControllerBase
{
    private readonly IAdminDepartmentsService _departmentsService;

    public AdminDepartmentsController(IAdminDepartmentsService departmentsService)
    {
        _departmentsService = departmentsService;
    }

    [HttpGet]
    public async Task<ActionResult<AdminDepartmentsDashboardDto>> GetDashboard()
    {
        var result = await _departmentsService.GetDashboardAsync();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<AdminDepartmentDto>> CreateDepartment([FromBody] AdminDepartmentCreateRequestDto dto)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var created = await _departmentsService.CreateDepartmentAsync(dto);
            return CreatedAtAction(nameof(GetDepartment), new { id = created.Id }, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AdminDepartmentDto>> GetDepartment(Guid id)
    {
        try
        {
            var department = await _departmentsService.GetDepartmentAsync(id);
            return Ok(department);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AdminDepartmentDto>> UpdateDepartment(Guid id, [FromBody] AdminDepartmentUpdateRequestDto dto)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var updated = await _departmentsService.UpdateDepartmentAsync(id, dto);
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
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteDepartment(Guid id)
    {
        try
        {
            await _departmentsService.DeleteDepartmentAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }
}
