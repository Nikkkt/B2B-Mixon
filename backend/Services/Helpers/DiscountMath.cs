using System;

namespace backend.Services.Helpers;

public static class DiscountMath
{
    public static decimal NormalizePercent(decimal value)
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

    public static decimal ApplyPercent(decimal price, decimal percent)
    {
        var normalized = NormalizePercent(percent);
        var discounted = price * (1m - normalized / 100m);
        if (discounted < 0m)
        {
            discounted = 0m;
        }

        return Math.Round(discounted, 2, MidpointRounding.AwayFromZero);
    }
}
