namespace backend.DTOs.AdminDepartments;

public class AdminDepartmentClientDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ShippingPoint { get; set; }
}
