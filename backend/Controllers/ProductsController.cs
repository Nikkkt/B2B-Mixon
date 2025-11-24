using backend.DTOs.Product;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(IProductService productService, ILogger<ProductsController> logger)
    {
        _productService = productService;
        _logger = logger;
    }

    [HttpPost("upload")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10MB limit
    [RequestFormLimits(MultipartBodyLengthLimit = 10 * 1024 * 1024)]
    public async Task<IActionResult> UploadProducts([FromForm] UploadProductsRequestDto request)
    {
        try
        {
            if (request.File == null || request.File.Length == 0)
            {
                return BadRequest(new { error = "Файл не выбран или пуст" });
            }

            // Validate file extension
            var fileExtension = Path.GetExtension(request.File.FileName).ToLowerInvariant();
            if (fileExtension != ".xls" && fileExtension != ".xlsx")
            {
                return BadRequest(new { error = "Допускаются только файлы Excel (.xls, .xlsx)" });
            }

            // Process the file
            var result = await _productService.ProcessProductUploadAsync(request.File);
            
            if (!result.Success)
            {
                return StatusCode(StatusCodes.Status422UnprocessableEntity, result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading products");
            return StatusCode(StatusCodes.Status500InternalServerError, new 
            { 
                error = "Произошла ошибка при обработке файла",
                details = ex.Message
            });
        }
    }
}
