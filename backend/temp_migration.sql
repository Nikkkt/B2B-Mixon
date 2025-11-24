CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE TABLE "Branches" (
        "Id" uuid NOT NULL,
        "Code" text NOT NULL,
        "Name" text NOT NULL,
        "Type" integer NOT NULL,
        "Address" text,
        "City" text,
        "Region" text,
        "Country" text,
        "PostalCode" text,
        "Phone" text,
        "Email" text,
        "IsActive" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_Branches" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE TABLE "DiscountProfiles" (
        "Id" uuid NOT NULL,
        "Code" text NOT NULL,
        "Name" text NOT NULL,
        "Description" text NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_DiscountProfiles" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE TABLE "ImportJobs" (
        "Id" uuid NOT NULL,
        "JobType" integer NOT NULL,
        "Status" integer NOT NULL,
        "Filename" text,
        "TotalRows" integer NOT NULL,
        "ProcessedRows" integer NOT NULL,
        "SuccessfulRows" integer NOT NULL,
        "FailedRows" integer NOT NULL,
        "ErrorMessage" text,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_ImportJobs" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE TABLE "ProductDirections" (
        "Id" uuid NOT NULL,
        "Code" text NOT NULL,
        "Title" text NOT NULL,
        "SortOrder" integer NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_ProductDirections" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE TABLE "Departments" (
        "Id" uuid NOT NULL,
        "Code" text NOT NULL,
        "Name" text NOT NULL,
        "Type" integer NOT NULL,
        "BranchId" uuid,
        "SourceBranchId" uuid,
        "AddedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_Departments" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Departments_Branches_BranchId" FOREIGN KEY ("BranchId") REFERENCES "Branches" ("Id"),
        CONSTRAINT "FK_Departments_Branches_SourceBranchId" FOREIGN KEY ("SourceBranchId") REFERENCES "Branches" ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE TABLE "ImportLineResults" (
        "Id" uuid NOT NULL,
        "ImportJobId" uuid NOT NULL,
        "RowNumber" integer NOT NULL,
        "Success" boolean NOT NULL,
        "ErrorMessage" text,
        "PayloadJson" text,
        CONSTRAINT "PK_ImportLineResults" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_ImportLineResults_ImportJobs_ImportJobId" FOREIGN KEY ("ImportJobId") REFERENCES "ImportJobs" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE TABLE "ProductGroups" (
        "Id" uuid NOT NULL,
        "GroupNumber" text NOT NULL,
        "ProductLine" text NOT NULL,
        "GroupName" text NOT NULL,
        "DirectionId" uuid NOT NULL,
        "SortOrder" integer NOT NULL,
        "SmallWholesaleDiscount" numeric,
        "WholesaleDiscount" numeric,
        "LargeWholesaleDiscount" numeric,
        "AddedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_ProductGroups" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_ProductGroups_ProductDirections_DirectionId" FOREIGN KEY ("DirectionId") REFERENCES "ProductDirections" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE TABLE "DepartmentEmployees" (
        "Id" uuid NOT NULL,
        "DepartmentId" uuid NOT NULL,
        "Name" text NOT NULL,
        "Note" text,
        CONSTRAINT "PK_DepartmentEmployees" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_DepartmentEmployees_Departments_DepartmentId" FOREIGN KEY ("DepartmentId") REFERENCES "Departments" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE TABLE "Users" (
        "Id" uuid NOT NULL,
        "FirstName" text NOT NULL,
        "LastName" text NOT NULL,
        "Email" text NOT NULL,
        "PasswordHash" bytea NOT NULL,
        "PasswordSalt" bytea NOT NULL,
        "Company" text NOT NULL,
        "CompanyCode" text NOT NULL,
        "Country" text NOT NULL,
        "City" text NOT NULL,
        "Address" text NOT NULL,
        "Phone" text NOT NULL,
        "Fax" text NOT NULL,
        "LastContactNote" text,
        "InterfaceLanguage" text NOT NULL,
        "AvatarUrl" text NOT NULL,
        "Roles" integer[] NOT NULL,
        "ManagerUserId" uuid,
        "IsConfirmed" boolean NOT NULL,
        "ConfirmedAt" timestamp with time zone,
        "LastLoginAt" timestamp with time zone,
        "LastPasswordResetAt" timestamp with time zone,
        "CreatedAt" timestamp with time zone NOT NULL,
        "DefaultBranchId" uuid,
        "DepartmentShopId" uuid,
        "DiscountProfileId" uuid,
        CONSTRAINT "PK_Users" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Users_Departments_DefaultBranchId" FOREIGN KEY ("DefaultBranchId") REFERENCES "Departments" ("Id"),
        CONSTRAINT "FK_Users_Departments_DepartmentShopId" FOREIGN KEY ("DepartmentShopId") REFERENCES "Departments" ("Id"),
        CONSTRAINT "FK_Users_DiscountProfiles_DiscountProfileId" FOREIGN KEY ("DiscountProfileId") REFERENCES "DiscountProfiles" ("Id"),
        CONSTRAINT "FK_Users_Users_ManagerUserId" FOREIGN KEY ("ManagerUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE TABLE "DiscountProfileGroupDiscounts" (
        "Id" uuid NOT NULL,
        "DiscountProfileId" uuid NOT NULL,
        "ProductGroupId" uuid NOT NULL,
        "Percent" numeric NOT NULL,
        CONSTRAINT "PK_DiscountProfileGroupDiscounts" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_DiscountProfileGroupDiscounts_DiscountProfiles_DiscountProf~" FOREIGN KEY ("DiscountProfileId") REFERENCES "DiscountProfiles" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_DiscountProfileGroupDiscounts_ProductGroups_ProductGroupId" FOREIGN KEY ("ProductGroupId") REFERENCES "ProductGroups" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE TABLE "GroupDiscounts" (
        "Id" uuid NOT NULL,
        "ProductGroupId" uuid NOT NULL,
        "DiscountProfileCode" text NOT NULL,
        "Percent" numeric NOT NULL,
        CONSTRAINT "PK_GroupDiscounts" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_GroupDiscounts_ProductGroups_ProductGroupId" FOREIGN KEY ("ProductGroupId") REFERENCES "ProductGroups" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE TABLE "Products" (
        "Id" uuid NOT NULL,
        "Sku" text NOT NULL,
        "Name" text NOT NULL,
        "Price" numeric NOT NULL,
        "DiscountPercent" numeric NOT NULL,
        "PriceWithDiscount" numeric NOT NULL,
        "Weight" numeric NOT NULL,
        "Volume" numeric NOT NULL,
        "ProductGroupId" uuid NOT NULL,
        "DirectionId" uuid NOT NULL,
        "GroupSerial" integer NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_Products" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Products_ProductDirections_DirectionId" FOREIGN KEY ("DirectionId") REFERENCES "ProductDirections" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_Products_ProductGroups_ProductGroupId" FOREIGN KEY ("ProductGroupId") REFERENCES "ProductGroups" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE TABLE "AuthCodes" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "Code" text NOT NULL,
        "Purpose" integer NOT NULL,
        "ExpiresAt" timestamp with time zone NOT NULL,
        "ConsumedAt" timestamp with time zone,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_AuthCodes" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_AuthCodes_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE TABLE "Carts" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_Carts" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Carts_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE TABLE "CustomerAccount" (
        "Id" uuid NOT NULL,
        "Code" text NOT NULL,
        "Name" text NOT NULL,
        "PrimaryEmail" text,
        "SecondaryEmail" text,
        "Phone" text,
        "DefaultBranchId" uuid,
        "ManagerUserId" uuid,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_CustomerAccount" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_CustomerAccount_Branches_DefaultBranchId" FOREIGN KEY ("DefaultBranchId") REFERENCES "Branches" ("Id"),
        CONSTRAINT "FK_CustomerAccount_Users_ManagerUserId" FOREIGN KEY ("ManagerUserId") REFERENCES "Users" ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE TABLE "DepartmentActionLogs" (
        "Id" uuid NOT NULL,
        "DepartmentId" uuid NOT NULL,
        "ActionKey" text NOT NULL,
        "Label" text NOT NULL,
        "PerformedByUserId" uuid,
        "CreatedAt" timestamp with time zone NOT NULL,
        "PayloadJson" text,
        CONSTRAINT "PK_DepartmentActionLogs" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_DepartmentActionLogs_Departments_DepartmentId" FOREIGN KEY ("DepartmentId") REFERENCES "Departments" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_DepartmentActionLogs_Users_PerformedByUserId" FOREIGN KEY ("PerformedByUserId") REFERENCES "Users" ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE TABLE "SpecialDiscounts" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "ProductGroupId" uuid NOT NULL,
        "Percent" numeric NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_SpecialDiscounts" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_SpecialDiscounts_ProductGroups_ProductGroupId" FOREIGN KEY ("ProductGroupId") REFERENCES "ProductGroups" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_SpecialDiscounts_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE TABLE "UserProductAccesses" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "ProductGroupId" uuid,
        "IsFullAccess" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_UserProductAccesses" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_UserProductAccesses_ProductGroups_ProductGroupId" FOREIGN KEY ("ProductGroupId") REFERENCES "ProductGroups" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_UserProductAccesses_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE TABLE "InventorySnapshots" (
        "Id" uuid NOT NULL,
        "DepartmentId" uuid NOT NULL,
        "ProductId" uuid NOT NULL,
        "AvailableQuantity" numeric NOT NULL,
        "CapturedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_InventorySnapshots" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_InventorySnapshots_Departments_DepartmentId" FOREIGN KEY ("DepartmentId") REFERENCES "Departments" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_InventorySnapshots_Products_ProductId" FOREIGN KEY ("ProductId") REFERENCES "Products" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE TABLE "CartItems" (
        "Id" uuid NOT NULL,
        "CartId" uuid NOT NULL,
        "ProductId" uuid NOT NULL,
        "Quantity" numeric NOT NULL,
        "PriceSnapshot" numeric NOT NULL,
        "DiscountPercentSnapshot" numeric NOT NULL,
        "PriceWithDiscountSnapshot" numeric NOT NULL,
        "WeightSnapshot" numeric NOT NULL,
        "VolumeSnapshot" numeric NOT NULL,
        "AddedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_CartItems" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_CartItems_Carts_CartId" FOREIGN KEY ("CartId") REFERENCES "Carts" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_CartItems_Products_ProductId" FOREIGN KEY ("ProductId") REFERENCES "Products" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE TABLE "NotificationPreferences" (
        "Id" uuid NOT NULL,
        "OwnerType" integer NOT NULL,
        "OwnerId" uuid NOT NULL,
        "RecipientType" integer NOT NULL,
        "Email" text NOT NULL,
        "IsPrimary" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "BranchId" uuid,
        "CustomerAccountId" uuid,
        "UserId" uuid,
        CONSTRAINT "PK_NotificationPreferences" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_NotificationPreferences_Branches_BranchId" FOREIGN KEY ("BranchId") REFERENCES "Branches" ("Id"),
        CONSTRAINT "FK_NotificationPreferences_CustomerAccount_CustomerAccountId" FOREIGN KEY ("CustomerAccountId") REFERENCES "CustomerAccount" ("Id"),
        CONSTRAINT "FK_NotificationPreferences_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE TABLE "Orders" (
        "Id" uuid NOT NULL,
        "OrderNumber" text NOT NULL,
        "CreatedByUserId" uuid NOT NULL,
        "ShippingBranchId" uuid,
        "Status" integer NOT NULL,
        "OrderType" text NOT NULL,
        "PaymentMethod" text NOT NULL,
        "TotalQuantity" numeric NOT NULL,
        "TotalWeight" numeric NOT NULL,
        "TotalVolume" numeric NOT NULL,
        "TotalPrice" numeric NOT NULL,
        "TotalDiscountedPrice" numeric NOT NULL,
        "Comment" text,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        "CustomerAccountId" uuid,
        CONSTRAINT "PK_Orders" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Orders_Branches_ShippingBranchId" FOREIGN KEY ("ShippingBranchId") REFERENCES "Branches" ("Id"),
        CONSTRAINT "FK_Orders_CustomerAccount_CustomerAccountId" FOREIGN KEY ("CustomerAccountId") REFERENCES "CustomerAccount" ("Id"),
        CONSTRAINT "FK_Orders_Users_CreatedByUserId" FOREIGN KEY ("CreatedByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE TABLE "UserCustomerLink" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "CustomerAccountId" uuid NOT NULL,
        "IsManager" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_UserCustomerLink" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_UserCustomerLink_CustomerAccount_CustomerAccountId" FOREIGN KEY ("CustomerAccountId") REFERENCES "CustomerAccount" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_UserCustomerLink_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE TABLE "OrderItems" (
        "Id" uuid NOT NULL,
        "OrderId" uuid NOT NULL,
        "ProductId" uuid NOT NULL,
        "ProductCodeSnapshot" text NOT NULL,
        "ProductNameSnapshot" text NOT NULL,
        "PriceSnapshot" numeric NOT NULL,
        "DiscountPercentSnapshot" numeric NOT NULL,
        "PriceWithDiscountSnapshot" numeric NOT NULL,
        "Quantity" numeric NOT NULL,
        "WeightSnapshot" numeric NOT NULL,
        "VolumeSnapshot" numeric NOT NULL,
        "LineTotal" numeric NOT NULL,
        CONSTRAINT "PK_OrderItems" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_OrderItems_Orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES "Orders" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_OrderItems_Products_ProductId" FOREIGN KEY ("ProductId") REFERENCES "Products" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE TABLE "OrderNotificationLogs" (
        "Id" uuid NOT NULL,
        "OrderId" uuid NOT NULL,
        "RecipientType" integer NOT NULL,
        "RecipientEmail" text NOT NULL,
        "SentAt" timestamp with time zone NOT NULL,
        "Success" boolean NOT NULL,
        "ErrorMessage" text,
        CONSTRAINT "PK_OrderNotificationLogs" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_OrderNotificationLogs_Orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES "Orders" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_AuthCodes_UserId" ON "AuthCodes" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_CartItems_CartId" ON "CartItems" ("CartId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_CartItems_ProductId" ON "CartItems" ("ProductId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_Carts_UserId" ON "Carts" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_CustomerAccount_DefaultBranchId" ON "CustomerAccount" ("DefaultBranchId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_CustomerAccount_ManagerUserId" ON "CustomerAccount" ("ManagerUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_DepartmentActionLogs_DepartmentId" ON "DepartmentActionLogs" ("DepartmentId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_DepartmentActionLogs_PerformedByUserId" ON "DepartmentActionLogs" ("PerformedByUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_DepartmentEmployees_DepartmentId" ON "DepartmentEmployees" ("DepartmentId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_Departments_BranchId" ON "Departments" ("BranchId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_Departments_SourceBranchId" ON "Departments" ("SourceBranchId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_DiscountProfileGroupDiscounts_DiscountProfileId" ON "DiscountProfileGroupDiscounts" ("DiscountProfileId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_DiscountProfileGroupDiscounts_ProductGroupId" ON "DiscountProfileGroupDiscounts" ("ProductGroupId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_GroupDiscounts_ProductGroupId" ON "GroupDiscounts" ("ProductGroupId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_ImportLineResults_ImportJobId" ON "ImportLineResults" ("ImportJobId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_InventorySnapshots_DepartmentId" ON "InventorySnapshots" ("DepartmentId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_InventorySnapshots_ProductId" ON "InventorySnapshots" ("ProductId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_NotificationPreferences_BranchId" ON "NotificationPreferences" ("BranchId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_NotificationPreferences_CustomerAccountId" ON "NotificationPreferences" ("CustomerAccountId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_NotificationPreferences_UserId" ON "NotificationPreferences" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_OrderItems_OrderId" ON "OrderItems" ("OrderId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_OrderItems_ProductId" ON "OrderItems" ("ProductId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_OrderNotificationLogs_OrderId" ON "OrderNotificationLogs" ("OrderId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_Orders_CreatedByUserId" ON "Orders" ("CreatedByUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_Orders_CustomerAccountId" ON "Orders" ("CustomerAccountId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_Orders_ShippingBranchId" ON "Orders" ("ShippingBranchId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_ProductGroups_DirectionId" ON "ProductGroups" ("DirectionId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_Products_DirectionId" ON "Products" ("DirectionId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_Products_ProductGroupId" ON "Products" ("ProductGroupId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_SpecialDiscounts_ProductGroupId" ON "SpecialDiscounts" ("ProductGroupId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_SpecialDiscounts_UserId" ON "SpecialDiscounts" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_UserCustomerLink_CustomerAccountId" ON "UserCustomerLink" ("CustomerAccountId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_UserCustomerLink_UserId" ON "UserCustomerLink" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_UserProductAccesses_ProductGroupId" ON "UserProductAccesses" ("ProductGroupId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_UserProductAccesses_UserId" ON "UserProductAccesses" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_Users_DefaultBranchId" ON "Users" ("DefaultBranchId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_Users_DepartmentShopId" ON "Users" ("DepartmentShopId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_Users_DiscountProfileId" ON "Users" ("DiscountProfileId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    CREATE INDEX "IX_Users_ManagerUserId" ON "Users" ("ManagerUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123151230_InitialCreate') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20251123151230_InitialCreate', '9.0.9');
    END IF;
END $EF$;
COMMIT;

