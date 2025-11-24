# Fixes Applied

## Issue 1: ✅ Shipping Point Not Being Saved/Displayed
**Problem**: When editing a user and selecting a shipping point, after saving and returning to edit the user, the radio button was not showing as selected.

**Root Cause**: In `syncFormState` function, it was using `user.shippingPointId` instead of `user.shippingPoint`. The `mapUserToViewModel` function already converts `shippingPointId` to string and stores it as `shippingPoint`, so the sync function should use that field.

**Fix**: 
- Changed line 350 in `AdminUsers.jsx` from:
  ```javascript
  shippingPoint: user.shippingPointId ? String(user.shippingPointId) : null,
  ```
  to:
  ```javascript
  shippingPoint: user.shippingPoint || null,
  ```

**Files Modified**:
- `frontend/src/pages/AdminUsers.jsx` - line 350

---

## Issue 2: ✅ Removed Unnecessary "Тип знижки" Textbox
**Problem**: There was an extra section with heading "Тип знижки" that contained a textarea (lastContact field), which was a duplicate/incorrect section.

**Fix**: 
- Removed the duplicate section (lines 2096-2108) that had:
  - Heading: "Тип знижки"
  - Textarea for `formState.lastContact`
- Kept only the correct section with heading "Нотатка про статус комунікації"

**Files Modified**:
- `frontend/src/pages/AdminUsers.jsx` - removed duplicate section

---

## Issue 3: ✅ Shop Name Display on /availability-download Page
**Problem**: The page title showed "Магазин не налаштовано" even when a shop was assigned to the department user.

**Root Cause**: The frontend was checking for `departmentShopId` but the shop name wasn't being sent from the backend.

**Fix**:
1. **Backend Changes**:
   - Added `DepartmentShopName` field to:
     - `ProfileResponseDto.cs`
     - `UserDto.cs`
   - Updated `AuthService.cs`:
     - Added `Include(u => u.DepartmentShop)` in `GetProfileAsync` method
     - Added `Include(u => u.DepartmentShop)` in `LoginAsync` method
     - Added `BuildDepartmentDisplayName` helper method
     - Updated `MapUser` and `MapProfile` to populate `DepartmentShopName`:
       ```csharp
       DepartmentShopName = user.DepartmentShop != null ? BuildDepartmentDisplayName(user.DepartmentShop) : null
       ```

2. **Frontend Changes**:
   - Updated `AvailabilityDownload.jsx`:
     - Changed `shopDisplayName` logic to use `currentUser.departmentShopName` directly
     - Simplified the logic since the shop name is now provided by the backend

**Files Modified**:
- `backend/DTOs/ProfileResponseDto.cs`
- `backend/DTOs/UserDto.cs`
- `backend/Services/AuthService.cs`
- `frontend/src/pages/AvailabilityDownload.jsx`

---

## Testing Checklist
- [ ] Test Issue 1: Edit user, select shipping point, save, re-edit - verify radio button is selected
- [ ] Test Issue 2: Verify no duplicate "Тип знижки" textbox appears in user edit form
- [ ] Test Issue 3: Login as department user with assigned shop, navigate to /availability-download, verify shop name displays correctly
- [ ] Test that all user roles still work correctly
- [ ] Test that users without department shop don't see errors

## Build Status
✅ Backend builds successfully with no errors
⚠️ Backend has warnings (unrelated to these changes):
- NU1603: ClosedXML version mismatch
- CS8604: EmailService null reference warning
- MSB3026: File lock warnings (backend.exe in use)
