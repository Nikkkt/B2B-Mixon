namespace backend.DTOs.OrderManagement;

public class OrderTotalsDto
{
    public decimal TotalQuantity { get; set; }
    public decimal TotalWeight { get; set; }
    public decimal TotalVolume { get; set; }
    public decimal TotalPrice { get; set; }
    public decimal TotalDiscountedPrice { get; set; }
}
