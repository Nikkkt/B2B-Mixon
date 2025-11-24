-- ========================================
-- Setup Script: User-Customer Link
-- ========================================
-- This script creates a customer account and links your user to it
-- so you can create orders.

-- Step 1: Create a Customer Account
-- Replace the values as needed
INSERT INTO "CustomerAccounts" 
("Id", "Code", "Name", "PrimaryEmail", "Phone", "CreatedAt", "UpdatedAt")
VALUES
(gen_random_uuid(), 'CUST-001', 'Тестовий Клієнт', 'test@example.com', '+380000000000', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Step 2: Link your user to this customer account
-- Replace 'ce37ca0d-a253-4920-908f-8a5ca435f370' with your actual user ID if different
INSERT INTO "UserCustomerLinks"
("Id", "UserId", "CustomerAccountId", "IsManager", "CreatedAt")
VALUES
(gen_random_uuid(), 
 'ce37ca0d-a253-4920-908f-8a5ca435f370', -- Your user ID from console logs
 (SELECT "Id" FROM "CustomerAccounts" WHERE "Code" = 'CUST-001' LIMIT 1),
 false,
 NOW())
ON CONFLICT DO NOTHING;

-- Verification queries:
-- Check customer accounts
SELECT "Id", "Code", "Name", "PrimaryEmail" FROM "CustomerAccounts";

-- Check user-customer links
SELECT ucl."Id", u."FirstName", u."LastName", ca."Name" as "CustomerName", ucl."IsManager"
FROM "UserCustomerLinks" ucl
JOIN "Users" u ON ucl."UserId" = u."Id"
JOIN "CustomerAccounts" ca ON ucl."CustomerAccountId" = ca."Id";
