namespace backend.Enums;

public enum BranchType
{
    Warehouse = 0,
    Store = 1,
    SalesOffice = 2
}

public enum DepartmentType
{
    Branch = 0,
    Store = 1,
    SalesDepartment = 2
}

public enum ImportJobType
{
    Unknown = 0,
    ProductCatalog = 1,
    Inventory = 2,
    OrdersByCode = 3,
    ProductGroups = 4
}

public enum ImportJobStatus
{
    Pending = 0,
    Processing = 1,
    Completed = 2,
    Failed = 3
}

public enum NotificationRecipientType
{
    Customer = 0,
    Manager = 1,
    ShippingPoint = 2,
    Additional = 3
}

public enum NotificationOwnerType
{
    User = 0,
    Customer = 1,
    Branch = 2
}

public enum OrderStatus
{
    Draft = 0,
    Submitted = 1,
    Processing = 2,
    Completed = 3,
    Cancelled = 4
}
