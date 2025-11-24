using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    public DbSet<User> Users { get; set; }
    public DbSet<AuthCode> AuthCodes { get; set; }
    // Note: CustomerAccount and UserCustomerLink removed - no longer needed for notification-only system
    public DbSet<ProductDirection> ProductDirections { get; set; }
    public DbSet<ProductGroup> ProductGroups { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<GroupDiscount> GroupDiscounts { get; set; }
    public DbSet<Branch> Branches { get; set; }
    public DbSet<InventorySnapshot> InventorySnapshots { get; set; }
    public DbSet<Cart> Carts { get; set; }
    public DbSet<CartItem> CartItems { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderItem> OrderItems { get; set; }
    public DbSet<OrderNotificationLog> OrderNotificationLogs { get; set; }
    public DbSet<NotificationPreference> NotificationPreferences { get; set; }
    public DbSet<DiscountProfile> DiscountProfiles { get; set; }
    public DbSet<DiscountProfileGroupDiscount> DiscountProfileGroupDiscounts { get; set; }
    public DbSet<SpecialDiscount> SpecialDiscounts { get; set; }
    public DbSet<UserProductAccess> UserProductAccesses { get; set; }
    public DbSet<Department> Departments { get; set; }
    public DbSet<DepartmentEmployee> DepartmentEmployees { get; set; }
    public DbSet<DepartmentActionLog> DepartmentActionLogs { get; set; }
    public DbSet<ImportJob> ImportJobs { get; set; }
    public DbSet<ImportLineResult> ImportLineResults { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .Property(u => u.Roles)
            .HasColumnType("integer[]");

        modelBuilder.Entity<User>()
            .HasOne(u => u.ManagerUser)
            .WithMany()
            .HasForeignKey(u => u.ManagerUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Order>()
            .HasOne(o => o.CreatedByUser)
            .WithMany(u => u.OrdersCreated)
            .HasForeignKey(o => o.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<UserProductAccess>()
            .HasOne(access => access.User)
            .WithMany(user => user.ProductAccesses)
            .HasForeignKey(access => access.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserProductAccess>()
            .HasOne(access => access.ProductGroup)
            .WithMany()
            .HasForeignKey(access => access.ProductGroupId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}