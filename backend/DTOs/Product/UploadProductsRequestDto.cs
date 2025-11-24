using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Product;

public class UploadProductsRequestDto
{
    [Required(ErrorMessage = "Файл обязателен")]
    public IFormFile File { get; set; } = null!;
}
