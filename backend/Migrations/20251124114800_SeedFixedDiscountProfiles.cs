using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations;

public partial class SeedFixedDiscountProfiles : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        ApplyProfile(
            migrationBuilder,
            code: "none",
            name: "Немає знижки",
            description: "Ціни без знижок",
            percentExpression: "0");

        ApplyProfile(
            migrationBuilder,
            code: "small-wholesale",
            name: "Малий опт",
            description: "Базові знижки рівня Малий опт",
            percentExpression: "COALESCE(pg.\"SmallWholesaleDiscount\", 0)");

        ApplyProfile(
            migrationBuilder,
            code: "wholesale",
            name: "Опт",
            description: "Базові знижки рівня Опт",
            percentExpression: "COALESCE(pg.\"WholesaleDiscount\", 0)");

        ApplyProfile(
            migrationBuilder,
            code: "large-wholesale",
            name: "Великий опт",
            description: "Базові знижки рівня Великий опт",
            percentExpression: "COALESCE(pg.\"LargeWholesaleDiscount\", 0)");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
DELETE FROM ""DiscountProfileGroupDiscounts""
WHERE ""DiscountProfileId"" IN (
    SELECT ""Id"" FROM ""DiscountProfiles"" WHERE ""Code"" IN ('none','small-wholesale','wholesale','large-wholesale')
);

DELETE FROM ""DiscountProfiles""
WHERE ""Code"" IN ('none','small-wholesale','wholesale','large-wholesale');
");
    }

    private static void ApplyProfile(
        MigrationBuilder migrationBuilder,
        string code,
        string name,
        string description,
        string percentExpression)
    {
        var upsertProfileSql = $@"
WITH upsert AS (
    UPDATE ""DiscountProfiles""
    SET ""Name"" = '{Escape(name)}',
        ""Description"" = '{Escape(description)}',
        ""UpdatedAt"" = CURRENT_TIMESTAMP
    WHERE ""Code"" = '{Escape(code)}'
    RETURNING ""Id""
)
INSERT INTO ""DiscountProfiles"" (""Id"", ""Code"", ""Name"", ""Description"", ""CreatedAt"", ""UpdatedAt"")
SELECT gen_random_uuid(), '{Escape(code)}', '{Escape(name)}', '{Escape(description)}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM upsert);
";

        migrationBuilder.Sql(upsertProfileSql);

        var updateDiscountsSql = $@"
UPDATE ""DiscountProfileGroupDiscounts"" AS d
SET ""Percent"" = {percentExpression}
FROM ""ProductGroups"" AS pg
JOIN ""DiscountProfiles"" AS dp ON dp.""Code"" = '{Escape(code)}'
WHERE d.""DiscountProfileId"" = dp.""Id""
  AND d.""ProductGroupId"" = pg.""Id"";
";

        migrationBuilder.Sql(updateDiscountsSql);

        var insertDiscountsSql = $@"
INSERT INTO ""DiscountProfileGroupDiscounts"" (""Id"", ""DiscountProfileId"", ""ProductGroupId"", ""Percent"")
SELECT gen_random_uuid(), dp.""Id"", pg.""Id"", {percentExpression}
FROM ""ProductGroups"" AS pg
JOIN ""DiscountProfiles"" AS dp ON dp.""Code"" = '{Escape(code)}'
WHERE NOT EXISTS (
    SELECT 1 FROM ""DiscountProfileGroupDiscounts"" AS existing
    WHERE existing.""DiscountProfileId"" = dp.""Id""
      AND existing.""ProductGroupId"" = pg.""Id""
);
";

        migrationBuilder.Sql(insertDiscountsSql);
    }

    private static string Escape(string value) => value.Replace("'", "''");
}
