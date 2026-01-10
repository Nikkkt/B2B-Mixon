using System.Globalization;

namespace backend.Services.Helpers;

public static class QuantityFormatter
{
    public static string Format(decimal value, int maxFractionDigits = 2)
    {
        var formatted = value.ToString(GetFormatString(maxFractionDigits), CultureInfo.InvariantCulture);
        return formatted.Replace('.', ',');
    }

    private static string GetFormatString(int maxFractionDigits)
    {
        if (maxFractionDigits <= 0)
        {
            return "0";
        }

        return "0." + new string('#', maxFractionDigits);
    }
}
