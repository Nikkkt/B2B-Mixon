using backend.Enums;
using backend.Models;using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace backend.Services.Implementations;

public record JwtTokenResult(string Token, DateTime ExpiresAt);

public static class JwtTokenService
{
    private static readonly TimeSpan DefaultLifetime = TimeSpan.FromHours(3);

    public static JwtTokenResult GenerateToken(User user, TimeSpan? lifetime = null)
    {
        var resolvedLifetime = lifetime ?? DefaultLifetime;
        var expiresAt = DateTime.UtcNow.Add(resolvedLifetime);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Environment.GetEnvironmentVariable("JWT_KEY")!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("name", $"{user.FirstName} {user.LastName}".Trim())
        };

        foreach (var role in user.Roles ?? Array.Empty<int>())
        {
            var (roleName, roleNameLower) = ((UserRole)role) switch
            {
                UserRole.Admin => ("Admin", "admin"),
                UserRole.Manager => ("Manager", "manager"),
                UserRole.Department => ("Department", "department"),
                _ => ("User", "user")
            };

            claims.Add(new Claim(ClaimTypes.Role, roleName));
            if (!string.Equals(roleName, roleNameLower, StringComparison.Ordinal))
            {
                claims.Add(new Claim(ClaimTypes.Role, roleNameLower));
            }
        }

        var token = new JwtSecurityToken(
            issuer: Environment.GetEnvironmentVariable("JWT_ISSUER"),
            audience: Environment.GetEnvironmentVariable("JWT_AUDIENCE"),
            claims: claims,
            expires: expiresAt,
            signingCredentials: creds
        );

        var tokenValue = new JwtSecurityTokenHandler().WriteToken(token);

        return new JwtTokenResult(tokenValue, expiresAt);
    }

    public static TokenValidationParameters GetValidationParameters() => new()
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ClockSkew = TimeSpan.Zero,
        ValidIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER"),
        ValidAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE"),
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Environment.GetEnvironmentVariable("JWT_KEY")!))
    };
}
