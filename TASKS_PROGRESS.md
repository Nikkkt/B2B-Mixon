# Tasks Progress

## Completed
1. ✅ Added `DepartmentShopId` field to User model and DTOs  
2. ✅ Created database migration `AddDepartmentShopIdToUser`
3. ✅ Updated backend to filter branches (only DepartmentType.Branch) and shops (only DepartmentType.Store)
4. ✅ Added Shops to AdminUsersResponseDto and ReferenceData
5. ✅ Updated AdminUsersService to handle DepartmentShopId validation and mapping
6. ✅ Added shops state and handlers in frontend AdminUsers.jsx
7. ✅ Added shop selection UI for create form (for department role users)

## In Progress
- Adding shop selection UI to edit form (for department role users)

## Pending
- Update AvailabilityDownload page to display shop name from DepartmentShopId
- Test all functionality end-to-end

## Notes
- Shipping point (DefaultBranchId) is for customer's default branch
- Department shop (DepartmentShopId) is specifically for department role users to select which shop they manage for availability uploads
- Frontend correctly conditionally shows shop selection only when "department" role is selected
