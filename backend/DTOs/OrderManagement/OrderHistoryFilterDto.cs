namespace backend.DTOs.OrderManagement;

public class OrderHistoryFilterDto
{
    public Guid? CreatedByUserId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? OrderType { get; set; }
    public string? PaymentMethod { get; set; }
    public string? VisibilityScope { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
