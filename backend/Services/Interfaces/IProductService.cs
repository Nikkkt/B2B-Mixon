using backend.DTOs.Product;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace backend.Services.Interfaces;

public interface IProductService
{
    Task<UploadProductsResponseDto> ProcessProductUploadAsync(IFormFile file);
}
