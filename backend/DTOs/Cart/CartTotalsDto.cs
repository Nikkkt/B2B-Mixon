namespace backend.DTOs.Cart;

public class CartTotalsDto
{
    public decimal TotalQuantity { get; set; }
    public decimal TotalOriginalPrice { get; set; }
    public decimal TotalDiscountedPrice { get; set; }
    public decimal TotalWeight { get; set; }
    public decimal TotalVolume { get; set; }
}
