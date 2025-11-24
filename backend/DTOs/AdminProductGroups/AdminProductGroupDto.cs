using System;

namespace backend.DTOs.AdminProductGroups;

public class AdminProductGroupDto
{
    public Guid Id { get; set; }
    public string GroupNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ProductLine { get; set; }
    public Guid DirectionId { get; set; }
    public string DirectionTitle { get; set; } = string.Empty;
    public string? DirectionCode { get; set; }
    public decimal? SmallWholesaleDiscount { get; set; }
    public decimal? WholesaleDiscount { get; set; }
    public decimal? LargeWholesaleDiscount { get; set; }
    public DateTime AddedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
