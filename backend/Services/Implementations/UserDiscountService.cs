using backend.Data;
using backend.Services.Helpers;
using backend.Services.Interfaces;
using backend.Services.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class UserDiscountService : IUserDiscountService
{
    private readonly AppDbContext _db;

    public UserDiscountService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<UserDiscountSnapshot> BuildUserDiscountSnapshotAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _db.Users
            .AsNoTracking()
            .Include(u => u.SpecialDiscounts)
            .Include(u => u.DiscountProfile)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null)
        {
            throw new KeyNotFoundException($"User '{userId}' not found");
        }

        var profileDiscounts = new Dictionary<Guid, decimal>();
        if (user.DiscountProfileId.HasValue)
        {
            var defaults = await _db.DiscountProfileGroupDiscounts
                .AsNoTracking()
                .Where(d => d.DiscountProfileId == user.DiscountProfileId.Value)
                .Select(d => new { d.ProductGroupId, d.Percent })
                .ToListAsync(cancellationToken);

            foreach (var entry in defaults)
            {
                profileDiscounts[entry.ProductGroupId] = DiscountMath.NormalizePercent(entry.Percent);
            }
        }

        // Legacy fallback: if no explicit profile-group discounts exist, use code-based group discounts
        if (profileDiscounts.Count == 0 && user.DiscountProfile != null && !string.IsNullOrWhiteSpace(user.DiscountProfile.Code))
        {
            var legacyDefaults = await _db.GroupDiscounts
                .AsNoTracking()
                .Where(d => d.DiscountProfileCode == user.DiscountProfile.Code)
                .Select(d => new { d.ProductGroupId, d.Percent })
                .ToListAsync(cancellationToken);

            foreach (var entry in legacyDefaults)
            {
                profileDiscounts[entry.ProductGroupId] = DiscountMath.NormalizePercent(entry.Percent);
            }
        }

        var specialDiscounts = (user.SpecialDiscounts ?? new List<backend.Models.SpecialDiscount>())
            .GroupBy(sd => sd.ProductGroupId)
            .ToDictionary(g => g.Key, g => DiscountMath.NormalizePercent(g.Last().Percent));

        return new UserDiscountSnapshot(user.Id, user.DiscountProfileId, profileDiscounts, specialDiscounts);
    }

    public decimal ResolveDiscountPercent(UserDiscountSnapshot snapshot, Guid productGroupId)
    {
        if (snapshot.SpecialDiscounts.TryGetValue(productGroupId, out var special))
        {
            return special;
        }

        if (snapshot.ProfileDiscounts.TryGetValue(productGroupId, out var profile))
        {
            return profile;
        }

        return 0m;
    }
}
