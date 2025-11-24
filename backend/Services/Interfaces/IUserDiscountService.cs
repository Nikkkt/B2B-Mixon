using backend.Services.Models;

namespace backend.Services.Interfaces;

public interface IUserDiscountService
{
    Task<UserDiscountSnapshot> BuildUserDiscountSnapshotAsync(Guid userId, CancellationToken cancellationToken = default);
    decimal ResolveDiscountPercent(UserDiscountSnapshot snapshot, Guid productGroupId);
}
