using System;

namespace backend.DTOs.Orders;

public class OrderProductDto
{
    public Guid Id { get; set; }
    public Guid ProductGroupId { get; set; }
    public Guid DirectionId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal PriceWithDiscount { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal Weight { get; set; }
    public decimal Volume { get; set; }
    public int GroupSerial { get; set; }
    public decimal? Availability { get; set; }
    public DateTime? AvailabilityUpdatedAt { get; set; }
}
