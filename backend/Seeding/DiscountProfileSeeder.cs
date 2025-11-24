using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Seeding;

public static class DiscountProfileSeeder
{
    private sealed record ProfileDefinition(
        string Code,
        string Name,
        string Description,
        Func<ProductGroupSnapshot, decimal> ResolvePercent);

    private sealed record ProductGroupSnapshot(
        Guid Id,
        decimal? SmallWholesale,
        decimal? Wholesale,
        decimal? LargeWholesale);

    public static async Task SeedAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await ApplyDiscountProfilesAsync(db, cancellationToken);
    }

    private static async Task ApplyDiscountProfilesAsync(AppDbContext db, CancellationToken cancellationToken)
    {
        var definitions = new[]
        {
            new ProfileDefinition(
                "none",
                "Немає знижки",
                "Ціни без знижок",
                _ => 0m),
            new ProfileDefinition(
                "small-wholesale",
                "Малий опт",
                "Базові знижки рівня Малий опт",
                snapshot => snapshot.SmallWholesale ?? 0m),
            new ProfileDefinition(
                "wholesale",
                "Опт",
                "Базові знижки рівня Опт",
                snapshot => snapshot.Wholesale ?? 0m),
            new ProfileDefinition(
                "large-wholesale",
                "Великий опт",
                "Базові знижки рівня Великий опт",
                snapshot => snapshot.LargeWholesale ?? 0m)
        };

        var productGroups = await db.ProductGroups
            .AsNoTracking()
            .Select(pg => new ProductGroupSnapshot(
                pg.Id,
                pg.SmallWholesaleDiscount,
                pg.WholesaleDiscount,
                pg.LargeWholesaleDiscount))
            .ToListAsync(cancellationToken);

        if (productGroups.Count == 0)
        {
            return;
        }

        var codeComparer = StringComparer.OrdinalIgnoreCase;
        var existingProfiles = await db.DiscountProfiles
            .Where(profile => definitions.Select(d => d.Code).Contains(profile.Code))
            .ToListAsync(cancellationToken);

        var profileMap = existingProfiles.ToDictionary(profile => profile.Code, codeComparer);
        var utcNow = DateTime.UtcNow;

        foreach (var definition in definitions)
        {
            if (!profileMap.TryGetValue(definition.Code, out var profile))
            {
                profile = new DiscountProfile
                {
                    Code = definition.Code,
                    Name = definition.Name,
                    Description = definition.Description,
                    CreatedAt = utcNow,
                    UpdatedAt = utcNow
                };

                db.DiscountProfiles.Add(profile);
                profileMap[definition.Code] = profile;
            }
            else
            {
                var updated = false;
                if (!string.Equals(profile.Name, definition.Name, StringComparison.Ordinal))
                {
                    profile.Name = definition.Name;
                    updated = true;
                }

                if (!string.Equals(profile.Description, definition.Description, StringComparison.Ordinal))
                {
                    profile.Description = definition.Description;
                    updated = true;
                }

                if (updated)
                {
                    profile.UpdatedAt = utcNow;
                }
            }
        }

        await db.SaveChangesAsync(cancellationToken);

        var profileIds = profileMap.Values.Select(p => p.Id).ToList();
        var existingDiscounts = await db.DiscountProfileGroupDiscounts
            .Where(discount => profileIds.Contains(discount.DiscountProfileId))
            .ToListAsync(cancellationToken);

        foreach (var definition in definitions)
        {
            var profile = profileMap[definition.Code];
            var discountLookup = existingDiscounts
                .Where(d => d.DiscountProfileId == profile.Id)
                .ToDictionary(d => d.ProductGroupId);

            foreach (var snapshot in productGroups)
            {
                var percent = NormalizePercent(definition.ResolvePercent(snapshot));
                if (discountLookup.TryGetValue(snapshot.Id, out var existing))
                {
                    if (existing.Percent != percent)
                    {
                        existing.Percent = percent;
                    }
                }
                else
                {
                    db.DiscountProfileGroupDiscounts.Add(new DiscountProfileGroupDiscount
                    {
                        DiscountProfileId = profile.Id,
                        ProductGroupId = snapshot.Id,
                        Percent = percent
                    });
                }
            }
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private static decimal NormalizePercent(decimal value)
    {
        if (value < 0m)
        {
            return 0m;
        }

        if (value > 100m)
        {
            return 100m;
        }

        return Math.Round(value, 2, MidpointRounding.AwayFromZero);
    }
}
