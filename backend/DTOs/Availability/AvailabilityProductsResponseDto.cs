namespace backend.DTOs.Availability;

public class AvailabilityProductsResponseDto
{
    public Guid DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public Guid GroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public decimal TotalQuantity { get; set; }
    public DateTime? LastUpdatedAt { get; set; }
    public List<AvailabilityProductDto> Products { get; set; } = new();
}
