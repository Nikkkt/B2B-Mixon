namespace backend.Services.Models;

public class UserDiscountSnapshot
{
    public Guid UserId { get; }
    public Guid? DiscountProfileId { get; }
    public IReadOnlyDictionary<Guid, decimal> ProfileDiscounts { get; }
    public IReadOnlyDictionary<Guid, decimal> SpecialDiscounts { get; }

    public UserDiscountSnapshot(
        Guid userId,
        Guid? discountProfileId,
        IReadOnlyDictionary<Guid, decimal> profileDiscounts,
        IReadOnlyDictionary<Guid, decimal> specialDiscounts)
    {
        UserId = userId;
        DiscountProfileId = discountProfileId;
        ProfileDiscounts = profileDiscounts;
        SpecialDiscounts = specialDiscounts;
    }
}
