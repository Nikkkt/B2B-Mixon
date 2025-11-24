# Shopping Cart and Order Management Setup Guide

This document provides complete setup instructions for the shopping cart and order management features.

## 🎯 Overview

The implementation includes:
- ✅ Cart management (add, update, remove, clear)
- ✅ Order creation from cart
- ✅ Order history with role-based filtering
- ✅ Order details viewing
- ✅ Repeat order functionality
- ✅ Email notifications (customer, manager, shipping point)
- ✅ Order notification logging

## 📋 Backend Components Created

### DTOs (Data Transfer Objects)

#### Cart DTOs
- `CartDto.cs` - Cart representation with items and totals
- `CartItemDto.cs` - Individual cart item
- `CartTotalsDto.cs` - Aggregated cart totals
- `AddToCartDto.cs` - Request to add item
- `UpdateCartItemDto.cs` - Request to update quantity

#### Order Management DTOs
- `OrderDto.cs` - Complete order representation
- `OrderItemDto.cs` - Order line item
- `OrderTotalsDto.cs` - Order totals
- `OrderCustomerDto.cs` - Customer info in order
- `OrderUserDto.cs` - User info in order
- `OrderBranchDto.cs` - Branch/shipping point info
- `CreateOrderDto.cs` - Request to create order
- `OrderHistoryFilterDto.cs` - Filtering parameters
- `OrderHistoryResponseDto.cs` - Paginated order list

### Services

#### `CartService.cs`
- `GetOrCreateCartAsync()` - Get user's cart or create if doesn't exist
- `AddItemAsync()` - Add product to cart
- `UpdateItemQuantityAsync()` - Update item quantity
- `RemoveItemAsync()` - Remove item from cart
- `ClearCartAsync()` - Clear all cart items

#### `OrderService.cs`
- `CreateOrderFromCartAsync()` - Convert cart to order
- `GetOrderHistoryAsync()` - Get filtered order history with role-based access
- `GetOrderByIdAsync()` - Get specific order details
- `RepeatOrderAsync()` - Copy order items back to cart

#### `OrderNotificationService.cs`
- `SendOrderNotificationsAsync()` - Send all notifications for an order
- Sends 3 types of emails:
  1. **Customer** - Order confirmation
  2. **Manager** - New order alert
  3. **Shipping Point** - Order preparation notice

### Controllers

#### `CartController.cs`
```
GET    /api/cart                    - Get current cart
POST   /api/cart/items              - Add item to cart
PUT    /api/cart/items/{id}         - Update item quantity
DELETE /api/cart/items/{id}         - Remove item
DELETE /api/cart                    - Clear cart
```

#### `OrdersController.cs`
```
POST   /api/orders                  - Create order from cart
GET    /api/orders/history          - Get order history (with filters)
GET    /api/orders/{id}             - Get order details
POST   /api/orders/{id}/repeat      - Repeat order (add to cart)
```

### Frontend API Integration

#### `cartApi.js`
- `fetchCart()` - Get cart from backend
- `addToCart(productId, quantity)` - Add product
- `updateCartItem(cartItemId, quantity)` - Update quantity
- `removeCartItem(cartItemId)` - Remove item
- `clearCart()` - Clear cart

#### `orderManagementApi.js`
- `createOrder(orderData)` - Submit order
- `fetchOrderHistory(filters)` - Get orders with filters
- `fetchOrderById(orderId)` - Get order details
- `repeatOrder(orderId)` - Repeat order

## ⚙️ Configuration Required

### 1. Email Settings (.env file)

Add these variables to your `.env` file:

```env
# Email Configuration for Order Notifications
Email__SmtpHost=smtp.gmail.com
Email__SmtpPort=587
Email__SmtpUsername=your-email@gmail.com
Email__SmtpPassword=your-app-password
Email__FromEmail=noreply@mixon.com
Email__FromName=Mixon B2B System
```

#### Using Gmail:
1. Enable 2-Factor Authentication on your Google Account
2. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Create new app password
   - Use this password in `Email__SmtpPassword`

#### Using Other SMTP Providers:
- **Outlook/Office365**: `smtp-mail.outlook.com:587`
- **Yahoo**: `smtp.mail.yahoo.com:587`
- **SendGrid**: `smtp.sendgrid.net:587`
- **Mailgun**: `smtp.mailgun.org:587`

### 2. appsettings.json

Add email configuration section:

```json
{
  "Email": {
    "SmtpHost": "smtp.gmail.com",
    "SmtpPort": 587,
    "SmtpUsername": "",
    "SmtpPassword": "",
    "FromEmail": "noreply@mixon.com",
    "FromName": "Mixon B2B"
  }
}
```

### 3. Database Migration (Already Complete)

The database tables already exist:
- ✅ `Carts`
- ✅ `CartItems`
- ✅ `Orders`
- ✅ `OrderItems`
- ✅ `OrderNotificationLogs`
- ✅ `NotificationPreferences`

### 4. Populate Notification Preferences (Optional)

For proper email routing, populate the `NotificationPreferences` table:

```sql
-- Example: Set branch notification email
INSERT INTO "NotificationPreferences" 
  ("Id", "OwnerType", "OwnerId", "RecipientType", "Email", "IsPrimary", "CreatedAt")
VALUES 
  (gen_random_uuid(), 2, '{branch-id}', 2, 'warehouse@mixon.com', true, NOW());

-- Example: Set customer notification email
INSERT INTO "NotificationPreferences"
  ("Id", "OwnerType", "OwnerId", "RecipientType", "Email", "IsPrimary", "CreatedAt")
VALUES
  (gen_random_uuid(), 1, '{customer-id}', 0, 'customer@example.com', true, NOW());
```

## 🚀 Usage Examples

### Creating an Order (Backend API)

```http
POST /api/orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "customerAccountId": "guid-here",
  "orderType": "Текущий",
  "paymentMethod": "Безналичный",
  "comment": "Delivery after 12:00",
  "shippingBranchId": "guid-here-or-null"
}
```

### Getting Order History (Backend API)

```http
GET /api/orders/history?page=1&pageSize=20&customerAccountId={guid}
Authorization: Bearer {token}
```

**Role-based filtering:**
- **Regular User**: Sees only their own orders
- **Manager**: Sees own orders + orders from managed customers
- **Admin**: Sees all orders

### Repeating an Order (Backend API)

```http
POST /api/orders/{orderId}/repeat
Authorization: Bearer {token}
```

This endpoint:
1. Verifies user access to the order
2. Clears current cart
3. Adds all items from the original order to cart
4. Returns the original order details

## 📧 Email Notification Flow

When an order is created:

1. **Order Created** → Saved to database
2. **Cart Cleared** → Cart items removed
3. **Notifications Triggered** (async):
   - ✉️ Customer confirmation email
   - ✉️ Manager notification email
   - ✉️ Shipping point preparation email
4. **Logs Created** → All notification attempts logged to `OrderNotificationLogs`

### Email Templates

The service includes 3 beautifully formatted HTML email templates:

1. **Customer Template** - Order confirmation with:
   - Order number and date
   - Full item breakdown
   - Totals and payment info
   - Professional branding

2. **Manager Template** - Alert with:
   - Order summary
   - Customer information
   - Action required notice

3. **Shipping Point Template** - Preparation notice with:
   - Item list with weights/volumes
   - Total weight and volume
   - Urgent notification styling

## 🔐 Security Features

- ✅ JWT authentication required for all endpoints
- ✅ Role-based access control for order history
- ✅ User can only access their own data (unless Manager/Admin)
- ✅ Manager access limited to linked customers
- ✅ Admin has full access

## 📊 Order Number Generation

Format: `ORD-{YEAR}-{NUMBER}`

Example: `ORD-2025-000123`

- Auto-incrementing per year
- 6-digit zero-padded number
- Resets each year

## 🔄 Integration with Frontend

To integrate the backend with your existing frontend:

### Option 1: Update CartContext to use backend

Replace localStorage logic with API calls:

```javascript
import { fetchCart, addToCart, updateCartItem, removeCartItem, clearCart } from '../api/cartApi';
import { createOrder, fetchOrderHistory } from '../api/orderManagementApi';

// In CartContext.jsx
const addItem = useCallback(async (product, quantity) => {
  try {
    const updatedCart = await addToCart(product.id, quantity);
    setItems(updatedCart.items);
  } catch (error) {
    console.error('Failed to add item:', error);
  }
}, []);
```

### Option 2: Keep hybrid approach

- Keep current frontend for quick prototyping
- Backend APIs ready for production deployment
- Gradually migrate from localStorage to API

## 🧪 Testing

### Test Cart Operations

```bash
# Get cart
curl -X GET http://localhost:5000/api/cart \
  -H "Authorization: Bearer {token}"

# Add item
curl -X POST http://localhost:5000/api/cart/items \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"productId":"guid","quantity":2}'
```

### Test Order Creation

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "customerAccountId":"guid",
    "orderType":"Текущий",
    "paymentMethod":"Наличный"
  }'
```

## 📝 Next Steps

1. **Configure Email** - Set up SMTP credentials in `.env`
2. **Test Notifications** - Create test order and verify emails
3. **Populate Data** - Add notification preferences for branches
4. **Update Frontend** - Integrate new API endpoints
5. **Deploy** - Push to production

## 🆘 Troubleshooting

### Emails not sending?

Check:
- ✅ SMTP credentials are correct
- ✅ Email configuration in `.env` is loaded
- ✅ Check `OrderNotificationLogs` table for error messages
- ✅ Gmail: App passwords enabled, 2FA active
- ✅ Firewall allows outbound SMTP (port 587)

### Orders not creating?

Check:
- ✅ Cart has items before creating order
- ✅ CustomerAccountId exists in database
- ✅ User is authenticated (valid JWT token)
- ✅ Shipping branch exists if specified

### Role-based filtering not working?

Check:
- ✅ User roles are properly set in `Users.Roles` (int[])
- ✅ Manager has `UserCustomerLink` records for managed customers
- ✅ JWT token includes user ID claim

## 📚 Additional Resources

- [ASP.NET Core Email Documentation](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/email)
- [EF Core Navigation Properties](https://learn.microsoft.com/en-us/ef/core/modeling/relationships)
- [JWT Authentication in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/)

---

✅ **Implementation Complete!** All backend infrastructure is ready for cart and order management with email notifications.
