# Order History - User Filter Debugging Guide

## Issue Fixed
The user list and orders weren't showing because the `GetAvailableUsersForFilteringAsync` method only returned users who had **already created orders**. This meant:
- Empty list if no orders exist yet
- Only shows users with order history

## Solution Applied

### Backend Fix (`OrderService.cs`)

**Before (Wrong):**
```csharp
// Admin sees all users who created orders
usersQuery = _db.Users
    .Where(u => _db.Orders.Any(o => o.CreatedByUserId == u.Id))
    .OrderBy(u => u.FirstName)
    .ThenBy(u => u.LastName);
```

**After (Correct):**
```csharp
// Admin sees ALL users
usersQuery = _db.Users
    .OrderBy(u => u.FirstName)
    .ThenBy(u => u.LastName);

// Manager sees themselves + users linked to managed customers
var managedCustomerIds = user.ManagedCustomers.Select(mc => mc.CustomerAccountId).ToList();
var managedUserIds = await _db.UserCustomerLinks
    .Where(ucl => managedCustomerIds.Contains(ucl.CustomerAccountId))
    .Select(ucl => ucl.UserId)
    .Distinct()
    .ToListAsync();
```

### Frontend Debugging

Added console logging to help diagnose issues:
- `console.log("Fetched available users:", users)` - Shows user list
- `console.log("Fetching orders with filter:", {...})` - Shows request params
- `console.log("Fetched orders response:", response)` - Shows order response
- `console.error("Error details:", err.response?.data)` - Shows detailed errors

## How to Test

### 1. Check Backend is Running
```bash
cd backend
dotnet run
```

### 2. Open Browser Console
- Press F12
- Go to Console tab

### 3. Navigate to Order History
- Go to `/order-history` page
- Check console output

### Expected Console Output

**Users Load:**
```javascript
Fetched available users: [
  {
    id: "guid-here",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    fullName: "John Doe"
  },
  // ... more users
]
```

**Orders Load:**
```javascript
Fetching orders with filter: {
  createdByUserId: null,
  page: 1,
  pageSize: 20
}

Fetched orders response: {
  orders: [...],
  totalCount: 5,
  page: 1,
  pageSize: 20,
  totalPages: 1
}
```

## Common Issues & Solutions

### Issue: Empty user list
**Check:**
- Are there users in the database?
- Is the user authenticated? (Check `user` object in console)
- Check Network tab for `/api/orders/available-users` request

**SQL to verify users exist:**
```sql
SELECT "Id", "FirstName", "LastName", "Email", "Roles" FROM "Users";
```

### Issue: Empty order list
**Check:**
- Are there orders in the database?
- Check user's role and permissions
- Look at Network tab for `/api/orders/history` request

**SQL to verify orders exist:**
```sql
SELECT "Id", "OrderNumber", "CreatedByUserId", "CustomerAccountId", "CreatedAt" 
FROM "Orders" 
ORDER BY "CreatedAt" DESC;
```

### Issue: Authentication error
**Symptoms:**
- 401 Unauthorized in Network tab
- "Будь ласка, увійдіть в систему" message

**Solution:**
- Clear localStorage and re-login
- Check JWT token expiration

### Issue: Role-based filtering not working
**Check user's roles:**
```javascript
// In browser console
console.log(JSON.parse(localStorage.getItem('mixon_auth_state_v1')));
```

Expected structure:
```javascript
{
  token: "jwt-token-here",
  user: {
    id: "guid",
    firstName: "John",
    lastName: "Doe",
    role: "admin", // or "manager" or "user"
    roles: ["admin"] // normalized array
  }
}
```

## API Endpoints

### Get Available Users
```
GET /api/orders/available-users
Authorization: Bearer {token}

Response:
[
  {
    "id": "guid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "fullName": "John Doe"
  }
]
```

### Get Order History
```
GET /api/orders/history?createdByUserId={guid}&page=1&pageSize=20
Authorization: Bearer {token}

Response:
{
  "orders": [...],
  "totalCount": 10,
  "page": 1,
  "pageSize": 20,
  "totalPages": 1
}
```

## Role-Based Access Rules

### Regular User
- **Can see:** Only themselves in user list
- **Can filter:** No filter (only 1 user)
- **Order access:** Only their own orders

### Manager
- **Can see:** Themselves + users linked to managed customers
- **Can filter:** Yes, by any visible user
- **Order access:** Own orders + orders from managed customers

### Admin
- **Can see:** All users in system
- **Can filter:** Yes, by any user
- **Order access:** All orders

## Testing Checklist

- [ ] Backend running without errors
- [ ] User logged in successfully
- [ ] User list loads (check console)
- [ ] Orders list loads (check console)
- [ ] User filter dropdown appears (if multiple users)
- [ ] Selecting user filters orders
- [ ] Pagination works
- [ ] "Всі користувачі" option clears filter
- [ ] Export buttons present (even if not functional yet)

## If Still Not Working

1. **Restart backend:**
   ```bash
   # Stop backend (Ctrl+C)
   cd backend
   dotnet clean
   dotnet build
   dotnet run
   ```

2. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R
   - Or clear localStorage and re-login

3. **Check database:**
   - Verify users exist
   - Verify orders exist (or test with empty state)
   - Check user roles are set correctly

4. **Verify API calls:**
   - Open Network tab (F12)
   - Watch for `/api/orders/available-users` call
   - Watch for `/api/orders/history` call
   - Check response status and data

5. **Check error messages:**
   - Console tab for JavaScript errors
   - Network tab for HTTP errors
   - Backend terminal for server errors

---

**Note:** Console logs added for debugging. Remove them once issue is resolved for cleaner production code.
