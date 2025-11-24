using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceShippingBranchWithDepartment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Branches_ShippingBranchId",
                table: "Orders");

            migrationBuilder.RenameColumn(
                name: "ShippingBranchId",
                table: "Orders",
                newName: "ShippingDepartmentId");

            migrationBuilder.RenameIndex(
                name: "IX_Orders_ShippingBranchId",
                table: "Orders",
                newName: "IX_Orders_ShippingDepartmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Departments_ShippingDepartmentId",
                table: "Orders",
                column: "ShippingDepartmentId",
                principalTable: "Departments",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Departments_ShippingDepartmentId",
                table: "Orders");

            migrationBuilder.RenameColumn(
                name: "ShippingDepartmentId",
                table: "Orders",
                newName: "ShippingBranchId");

            migrationBuilder.RenameIndex(
                name: "IX_Orders_ShippingDepartmentId",
                table: "Orders",
                newName: "IX_Orders_ShippingBranchId");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Branches_ShippingBranchId",
                table: "Orders",
                column: "ShippingBranchId",
                principalTable: "Branches",
                principalColumn: "Id");
        }
    }
}
