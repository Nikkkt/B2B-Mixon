using backend.DTOs.Cart;

namespace backend.Services.Interfaces;

public interface ICartService
{
    Task<CartDto> GetOrCreateCartAsync(Guid userId);
    Task<CartDto> AddItemAsync(Guid userId, AddToCartDto request);
    Task<CartDto> UpdateItemQuantityAsync(Guid userId, Guid cartItemId, UpdateCartItemDto request);
    Task<CartDto> RemoveItemAsync(Guid userId, Guid cartItemId);
    Task<CartDto> ClearCartAsync(Guid userId);
}
