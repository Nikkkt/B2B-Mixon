using backend.Data;
using backend.DTOs.Cart;
using backend.Models;
using backend.Services.Helpers;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class CartService : ICartService
{
    private readonly AppDbContext _db;
    private readonly IUserDiscountService _userDiscountService;

    public CartService(AppDbContext db, IUserDiscountService userDiscountService)
    {
        _db = db;
        _userDiscountService = userDiscountService;
    }

    public async Task<CartDto> GetOrCreateCartAsync(Guid userId)
    {
        var cart = await _db.Carts
            .Include(c => c.Items)
                .ThenInclude(ci => ci.Product)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart == null)
        {
            cart = new Cart
            {
                UserId = userId,
                UpdatedAt = DateTime.UtcNow
            };
            _db.Carts.Add(cart);
            await _db.SaveChangesAsync();
            
            // Reload the newly created cart with all navigation properties
            cart = await _db.Carts
                .Include(c => c.Items)
                    .ThenInclude(ci => ci.Product)
                .FirstOrDefaultAsync(c => c.UserId == userId);
        }

        var updated = await ApplyPricingSnapshotsAsync(userId, cart!);
        if (updated)
        {
            await _db.SaveChangesAsync();
        }

        return await MapToCartDtoAsync(cart!);
    }

    public async Task<CartDto> AddItemAsync(Guid userId, AddToCartDto request)
    {
        var product = await _db.Products.FindAsync(request.ProductId);
        if (product == null)
        {
            throw new KeyNotFoundException($"Product with ID {request.ProductId} not found");
        }

        var cart = await _db.Carts.FirstOrDefaultAsync(c => c.UserId == userId);
        if (cart == null)
        {
            cart = new Cart
            {
                UserId = userId,
                UpdatedAt = DateTime.UtcNow
            };
            _db.Carts.Add(cart);
            await _db.SaveChangesAsync();
        }

        var existingItem = await _db.CartItems
            .FirstOrDefaultAsync(ci => ci.CartId == cart.Id && ci.ProductId == request.ProductId);

        if (existingItem != null)
        {
            existingItem.Quantity += request.Quantity;
        }
        else
        {
            var cartItem = new CartItem
            {
                CartId = cart.Id,
                ProductId = request.ProductId,
                Quantity = request.Quantity,
                AddedAt = DateTime.UtcNow
            };
            _db.CartItems.Add(cartItem);
        }

        cart.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _db.ChangeTracker.Clear();
        return await GetOrCreateCartAsync(userId);
    }

    public async Task<CartDto> UpdateItemQuantityAsync(Guid userId, Guid cartItemId, UpdateCartItemDto request)
    {
        var cart = await GetOrCreateUserCartAsync(userId);
        var cartItem = cart.Items.FirstOrDefault(ci => ci.Id == cartItemId);

        if (cartItem == null)
        {
            throw new KeyNotFoundException($"Cart item with ID {cartItemId} not found");
        }

        cartItem.Quantity = request.Quantity;
        cart.UpdatedAt = DateTime.UtcNow;
        await ApplyPricingSnapshotsAsync(userId, cart);
        await _db.SaveChangesAsync();

        return await MapToCartDtoAsync(cart);
    }

    public async Task<CartDto> RemoveItemAsync(Guid userId, Guid cartItemId)
    {
        var cart = await GetOrCreateUserCartAsync(userId);
        var cartItem = cart.Items.FirstOrDefault(ci => ci.Id == cartItemId);

        if (cartItem == null)
        {
            throw new KeyNotFoundException($"Cart item with ID {cartItemId} not found");
        }

        cart.Items.Remove(cartItem);
        cart.UpdatedAt = DateTime.UtcNow;
        await ApplyPricingSnapshotsAsync(userId, cart);
        await _db.SaveChangesAsync();

        return await MapToCartDtoAsync(cart);
    }

    public async Task<CartDto> ClearCartAsync(Guid userId)
    {
        var cart = await GetOrCreateUserCartAsync(userId);
        cart.Items.Clear();
        cart.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return await MapToCartDtoAsync(cart);
    }

    private async Task<Cart> GetOrCreateUserCartAsync(Guid userId)
    {
        var cart = await _db.Carts
            .Include(c => c.Items)
                .ThenInclude(ci => ci.Product)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart == null)
        {
            cart = new Cart
            {
                UserId = userId,
                UpdatedAt = DateTime.UtcNow
            };
            _db.Carts.Add(cart);
            await _db.SaveChangesAsync();
            
            // Reload the cart to ensure it's properly tracked
            cart = await _db.Carts
                .Include(c => c.Items)
                    .ThenInclude(ci => ci.Product)
                .FirstOrDefaultAsync(c => c.UserId == userId);
        }

        return cart!;
    }

    private async Task<bool> ApplyPricingSnapshotsAsync(Guid userId, Cart cart, CancellationToken cancellationToken = default)
    {
        await _db.Entry(cart)
            .Collection(c => c.Items)
            .LoadAsync(cancellationToken);

        if (cart.Items == null || cart.Items.Count == 0)
        {
            return false;
        }

        var productIds = cart.Items
            .Select(ci => ci.ProductId)
            .Distinct()
            .ToList();

        var productLookup = await _db.Products
            .Where(p => productIds.Contains(p.Id))
            .Select(p => new
            {
                p.Id,
                p.Price,
                p.Weight,
                p.Volume,
                p.ProductGroupId
            })
            .ToDictionaryAsync(p => p.Id, cancellationToken);

        var snapshot = await _userDiscountService.BuildUserDiscountSnapshotAsync(userId, cancellationToken);
        var updated = false;

        foreach (var item in cart.Items)
        {
            if (!productLookup.TryGetValue(item.ProductId, out var product))
            {
                continue;
            }

            var percent = _userDiscountService.ResolveDiscountPercent(snapshot, product.ProductGroupId);
            var priceWithDiscount = DiscountMath.ApplyPercent(product.Price, percent);

            if (item.PriceSnapshot != product.Price ||
                item.DiscountPercentSnapshot != percent ||
                item.PriceWithDiscountSnapshot != priceWithDiscount ||
                item.WeightSnapshot != product.Weight ||
                item.VolumeSnapshot != product.Volume)
            {
                item.PriceSnapshot = product.Price;
                item.DiscountPercentSnapshot = percent;
                item.PriceWithDiscountSnapshot = priceWithDiscount;
                item.WeightSnapshot = product.Weight;
                item.VolumeSnapshot = product.Volume;
                updated = true;
            }
        }

        if (updated)
        {
            cart.UpdatedAt = DateTime.UtcNow;
        }

        return updated;
    }

    private async Task<CartDto> MapToCartDtoAsync(Cart cart)
    {
        // Reload cart with all navigation properties if needed
        if (_db.Entry(cart).State != Microsoft.EntityFrameworkCore.EntityState.Detached)
        {
            await _db.Entry(cart)
                .Collection(c => c.Items)
                .Query()
                .Include(ci => ci.Product)
                    .ThenInclude(p => p.ProductGroup)
                .LoadAsync();
        }

        var items = (cart.Items ?? new List<CartItem>()).Select(ci => new CartItemDto
        {
            Id = ci.Id,
            ProductId = ci.ProductId,
            ProductCode = ci.Product?.Sku ?? string.Empty,
            ProductName = ci.Product?.Name ?? string.Empty,
            Quantity = ci.Quantity,
            Price = ci.PriceSnapshot,
            DiscountPercent = ci.DiscountPercentSnapshot,
            PriceWithDiscount = ci.PriceWithDiscountSnapshot,
            Weight = ci.WeightSnapshot,
            Volume = ci.VolumeSnapshot,
            Availability = null, // Will be populated from inventory if needed
            AddedAt = ci.AddedAt
        }).ToList();

        var totals = new CartTotalsDto
        {
            TotalQuantity = items.Sum(i => i.Quantity),
            TotalOriginalPrice = items.Sum(i => i.Price * i.Quantity),
            TotalDiscountedPrice = items.Sum(i => i.PriceWithDiscount * i.Quantity),
            TotalWeight = items.Sum(i => i.Weight * i.Quantity),
            TotalVolume = items.Sum(i => i.Volume * i.Quantity)
        };

        return new CartDto
        {
            Id = cart.Id,
            UserId = cart.UserId,
            UpdatedAt = cart.UpdatedAt,
            Items = items,
            Totals = totals
        };
    }
}

