using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Orders;

public class OrderProductLookupRequestDto
{
    [Required]
    [MinLength(1)]
    public List<OrderProductLookupItemDto> Items { get; set; } = new();
}
