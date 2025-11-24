using System;

namespace backend.DTOs.Orders;

public class OrderProductGroupDto
{
    public Guid Id { get; set; }
    public Guid DirectionId { get; set; }
    public string DirectionTitle { get; set; } = string.Empty;
    public string GroupNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string ProductLine { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}
