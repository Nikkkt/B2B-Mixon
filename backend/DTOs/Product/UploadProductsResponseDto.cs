namespace backend.DTOs.Product;

public class UploadProductsResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int TotalProcessed { get; set; }
    public int Created { get; set; }
    public int Updated { get; set; }
    public int Errors { get; set; }
    public List<string> ErrorMessages { get; set; } = new();
}
