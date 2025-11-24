namespace backend.DTOs.AdminUsers;

public class AdminUserSpecialDiscountInputDto
{
    public Guid ProductGroupId { get; set; }
    public decimal Percent { get; set; }
}
