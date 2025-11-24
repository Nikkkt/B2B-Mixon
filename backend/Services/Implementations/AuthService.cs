using System.Security.Cryptography;
using backend.Data;
using backend.DTOs.Auth;
using backend.DTOs.Profile;
using backend.DTOs.User;
using backend.Enums;
using backend.Exceptions;
using backend.Models;using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

using backend.Services.Interfaces;

namespace backend.Services.Implementations;

public class AuthService : IAuthService
{
    private const int CodeLength = 6;
    private static readonly TimeSpan VerificationExpiry = TimeSpan.FromMinutes(15);
    private static readonly TimeSpan PasswordResetExpiry = TimeSpan.FromMinutes(15);

    private readonly AppDbContext _db;
    private readonly IEmailService _email;

    public AuthService(AppDbContext db, IEmailService email)
    {
        _db = db;
        _email = email;
    }

    public async Task<AuthResultDto> RegisterAsync(RegisterDto dto)
    {
        var email = NormalizeEmail(dto.Email);
        var existingUser = await _db.Users.Include(u => u.AuthCodes)
            .FirstOrDefaultAsync(x => x.Email == email);

        if (existingUser != null)
        {
            if (existingUser.IsConfirmed)
            {
                throw new AuthException(
                    "Account already exists. Please sign in instead.",
                    StatusCodes.Status409Conflict);
            }

            var code = await CreateAndDispatchCodeAsync(existingUser, AuthCodePurpose.EmailVerification, VerificationExpiry);

            return new AuthResultDto
            {
                Success = true,
                Message = $"Account already registered but not verified. New verification code sent to {MaskEmail(email)}.",
                User = MapUser(existingUser)
            };
        }

        PasswordHasher.CreatePasswordHash(dto.Password, out var hash, out var salt);

        var user = new User
        {
            FirstName = dto.FirstName.Trim(),
            LastName = dto.LastName.Trim(),
            Email = email,
            PasswordHash = hash,
            PasswordSalt = salt,
            Company = dto.Company,
            Country = dto.Country,
            City = dto.City,
            Address = dto.Address,
            Phone = dto.Phone,
            Roles = ParseRoles(dto.Roles),
            IsConfirmed = false,
            CreatedAt = DateTime.UtcNow
        };

        await _db.Users.AddAsync(user);
        await _db.SaveChangesAsync();

        var verificationCode = await CreateAndDispatchCodeAsync(user, AuthCodePurpose.EmailVerification, VerificationExpiry);

        return new AuthResultDto
        {
            Success = true,
            Message = $"Verification code sent to {MaskEmail(email)}",
            User = MapUser(user)
        };
    }

    public async Task<AuthResultDto> ResendVerificationCodeAsync(string email)
    {
        var normalized = NormalizeEmail(email);
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == normalized);

        if (user == null)
        {
            throw new AuthException("Account with this email was not found.");
        }

        if (user.IsConfirmed)
        {
            throw new AuthException("Account already verified. Please sign in.");
        }

        var code = await CreateAndDispatchCodeAsync(user, AuthCodePurpose.EmailVerification, VerificationExpiry);

        return new AuthResultDto
        {
            Success = true,
            Message = $"Verification code resent to {MaskEmail(normalized)}"
        };
    }

    public async Task<AuthResultDto> VerifyEmailAsync(VerifyCodeDto dto)
    {
        var email = NormalizeEmail(dto.Email);
        var code = await GetActiveCodeAsync(email, dto.Code, AuthCodePurpose.EmailVerification);

        if (code == null)
        {
            throw new AuthException("Invalid or expired verification code.");
        }

        code.ConsumedAt = DateTime.UtcNow;
        code.User.IsConfirmed = true;
        code.User.ConfirmedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        var token = JwtTokenService.GenerateToken(code.User);

        return new AuthResultDto
        {
            Success = true,
            Message = "Email successfully verified.",
            Token = token.Token,
            TokenExpiresAt = token.ExpiresAt,
            User = MapUser(code.User)
        };
    }

    public async Task<AuthResultDto> LoginAsync(LoginDto dto)
    {
        var email = NormalizeEmail(dto.Email);
        var user = await _db.Users
            .Include(u => u.DepartmentShop)
            .Include(u => u.DefaultBranch)
            .Include(u => u.DiscountProfile)
            .FirstOrDefaultAsync(x => x.Email == email);

        if (user == null)
        {
            throw new AuthException("Invalid email or password.", StatusCodes.Status401Unauthorized);
        }

        if (!PasswordHasher.VerifyPasswordHash(dto.Password, user.PasswordHash, user.PasswordSalt))
        {
            throw new AuthException("Invalid email or password.", StatusCodes.Status401Unauthorized);
        }

        if (!user.IsConfirmed)
        {
            throw new AuthException("Please verify your email before signing in.", StatusCodes.Status403Forbidden);
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var token = JwtTokenService.GenerateToken(user);

        return new AuthResultDto
        {
            Success = true,
            Message = "Login successful.",
            Token = token.Token,
            TokenExpiresAt = token.ExpiresAt,
            User = MapUser(user)
        };
    }

    public async Task<AuthResultDto> RequestPasswordResetAsync(ResetPasswordRequestDto dto)
    {
        var email = NormalizeEmail(dto.Email);
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == email);

        if (user == null)
        {
            // Do not reveal account existence to mitigate enumeration
            return new AuthResultDto
            {
                Success = true,
                Message = "If the email exists, a reset code has been sent."
            };
        }

        var code = await CreateAndDispatchCodeAsync(user, AuthCodePurpose.PasswordReset, PasswordResetExpiry);

        return new AuthResultDto
        {
            Success = true,
            Message = $"Password reset code sent to {MaskEmail(email)}"
        };
    }

    public async Task<AuthResultDto> VerifyPasswordResetCodeAsync(ResetPasswordVerifyDto dto)
    {
        var email = NormalizeEmail(dto.Email);
        var code = await GetActiveCodeAsync(email, dto.Code, AuthCodePurpose.PasswordReset);

        if (code == null)
        {
            throw new AuthException("Invalid or expired reset code.");
        }

        return new AuthResultDto
        {
            Success = true,
            Message = "Reset code is valid."
        };
    }

    public async Task<AuthResultDto> ResetPasswordAsync(ResetPasswordDto dto)
    {
        var email = NormalizeEmail(dto.Email);
        var code = await GetActiveCodeAsync(email, dto.Code, AuthCodePurpose.PasswordReset);

        if (code == null)
        {
            throw new AuthException("Invalid or expired reset code.");
        }

        PasswordHasher.CreatePasswordHash(dto.NewPassword, out var hash, out var salt);
        var user = code.User;
        user.PasswordHash = hash;
        user.PasswordSalt = salt;
        user.LastPasswordResetAt = DateTime.UtcNow;

        code.ConsumedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return new AuthResultDto
        {
            Success = true,
            Message = "Password successfully updated."
        };
    }

    public async Task<ProfileResponseDto> GetProfileAsync(Guid userId)
    {
        var user = await _db.Users
            .AsNoTracking()
            .Include(u => u.DepartmentShop)
            .Include(u => u.DefaultBranch)
            .Include(u => u.DiscountProfile)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            throw new InvalidOperationException("User not found.");
        }

        return MapProfile(user);
    }

    public async Task<ProfileResponseDto> UpdateProfileAsync(Guid userId, ProfileUpdateRequestDto dto)
    {
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == userId);

        if (user == null)
        {
            throw new AuthException("User not found.", StatusCodes.Status404NotFound);
        }

        var normalizedEmail = NormalizeEmail(dto.Email);
        if (!string.Equals(user.Email, normalizedEmail, StringComparison.OrdinalIgnoreCase))
        {
            var emailExists = await _db.Users.AnyAsync(x => x.Email == normalizedEmail && x.Id != userId);
            if (emailExists)
            {
                throw new AuthException("Email is already in use.", StatusCodes.Status409Conflict);
            }

            user.Email = normalizedEmail;
        }

        user.FirstName = dto.FirstName.Trim();
        user.LastName = dto.LastName.Trim();
        user.Phone = dto.Phone?.Trim() ?? "";
        user.Company = dto.Company?.Trim() ?? "";
        user.CompanyCode = dto.CompanyCode?.Trim() ?? "";
        user.Country = dto.Country?.Trim() ?? "";
        user.City = dto.City?.Trim() ?? "";
        user.Address = dto.Address?.Trim() ?? "";
        user.Fax = dto.Fax?.Trim() ?? "";
        if (!string.IsNullOrWhiteSpace(dto.Language))
        {
            user.InterfaceLanguage = dto.Language.Trim();
        }

        user.AvatarUrl = dto.AvatarUrl?.Trim() ?? "";
        user.DefaultBranchId = dto.DefaultBranchId;
        user.DiscountProfileId = dto.DiscountProfileId;

        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            PasswordHasher.CreatePasswordHash(dto.Password, out var hash, out var salt);
            user.PasswordHash = hash;
            user.PasswordSalt = salt;
            user.LastPasswordResetAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();

        return MapProfile(user);
    }

    private async Task<AuthCode> CreateAndDispatchCodeAsync(User user, AuthCodePurpose purpose, TimeSpan lifetime)
    {
        var activeCodes = await _db.AuthCodes
            .Where(c => c.UserId == user.Id && c.Purpose == purpose && c.ConsumedAt == null)
            .ToListAsync();

        foreach (var existing in activeCodes)
        {
            existing.ConsumedAt = DateTime.UtcNow;
        }

        var codeValue = GenerateNumericCode(CodeLength);

        var authCode = new AuthCode
        {
            UserId = user.Id,
            Code = codeValue,
            Purpose = purpose,
            ExpiresAt = DateTime.UtcNow.Add(lifetime)
        };

        await _db.AuthCodes.AddAsync(authCode);
        await _db.SaveChangesAsync();

        var subject = purpose switch
        {
            AuthCodePurpose.EmailVerification => "Your Mixon verification code",
            AuthCodePurpose.PasswordReset => "Your Mixon password reset code",
            _ => "Mixon security code"
        };

        var body = $"Your code is {codeValue}. It will expire in {(int)lifetime.TotalMinutes} minutes.";
        await _email.SendAsync(user.Email, subject, body);

        return authCode;
    }

    private async Task<AuthCode?> GetActiveCodeAsync(string email, string codeValue, AuthCodePurpose purpose)
    {
        var normalized = NormalizeEmail(email);

        var code = await _db.AuthCodes
            .Include(c => c.User)
            .Where(c => c.User.Email == normalized && c.Code == codeValue && c.Purpose == purpose)
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync();

        if (code == null)
        {
            return null;
        }

        if (code.ConsumedAt != null || DateTime.UtcNow > code.ExpiresAt)
        {
            return null;
        }

        return code;
    }

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    private static string BuildDepartmentDisplayName(Department department)
    {
        var name = string.IsNullOrWhiteSpace(department.Name) ? department.Code : department.Name;
        return string.IsNullOrWhiteSpace(department.Code) ? name : $"{department.Code} - {name}";
    }

    private static string GenerateNumericCode(int digits)
    {
        var max = (int)Math.Pow(10, digits);
        var value = RandomNumberGenerator.GetInt32(0, max);
        return value.ToString($"D{digits}");
    }

    private static string MaskEmail(string email)
    {
        var atIndex = email.IndexOf('@');
        if (atIndex <= 1)
        {
            return email;
        }

        var prefix = email[..1];
        var suffix = email[(atIndex - 1)..];
        return prefix + new string('*', Math.Max(1, atIndex - 2)) + suffix;
    }

    private static UserDto MapUser(User user) => new()
    {
        Id = user.Id,
        FirstName = user.FirstName,
        LastName = user.LastName,
        Email = user.Email,
        Company = user.Company,
        CompanyCode = user.CompanyCode,
        Country = user.Country,
        City = user.City,
        Address = user.Address,
        Phone = user.Phone,
        Fax = user.Fax,
        Language = user.InterfaceLanguage,
        AvatarUrl = user.AvatarUrl,
        DefaultBranchId = user.DefaultBranchId,
        DepartmentShopId = user.DepartmentShopId,
        DepartmentShopName = user.DepartmentShop != null ? BuildDepartmentDisplayName(user.DepartmentShop) : null,
        DiscountProfileId = user.DiscountProfileId,
        DiscountProfileCode = user.DiscountProfile?.Code,
        IsConfirmed = user.IsConfirmed,
        CreatedAt = user.CreatedAt,
        ConfirmedAt = user.ConfirmedAt,
        LastLoginAt = user.LastLoginAt,
        Roles = ConvertRolesToStrings(user.Roles)
    };

    private static ProfileResponseDto MapProfile(User user) => new()
    {
        Id = user.Id,
        FirstName = user.FirstName,
        LastName = user.LastName,
        Email = user.Email,
        Phone = user.Phone,
        Company = user.Company,
        CompanyCode = user.CompanyCode,
        Country = user.Country,
        City = user.City,
        Address = user.Address,
        Fax = user.Fax,
        Language = user.InterfaceLanguage,
        AvatarUrl = user.AvatarUrl,
        DefaultBranchId = user.DefaultBranchId,
        DepartmentShopId = user.DepartmentShopId,
        DepartmentShopName = user.DepartmentShop != null ? BuildDepartmentDisplayName(user.DepartmentShop) : null,
        DiscountProfileId = user.DiscountProfileId,
        DiscountProfileCode = user.DiscountProfile?.Code,
        Roles = ConvertRolesToStrings(user.Roles),
        CreatedAt = user.CreatedAt,
        LastLoginAt = user.LastLoginAt
    };

    private static int[] ParseRoles(IEnumerable<string> values)
    {
        var normalized = (values ?? Array.Empty<string>())
            .Select(v => (v ?? string.Empty).Trim().ToLowerInvariant())
            .Where(v => !string.IsNullOrWhiteSpace(v))
            .Distinct()
            .ToList();

        if (normalized.Count == 0)
        {
            return new[] { (int)UserRole.Customer };
        }

        var result = new List<int>(normalized.Count);
        foreach (var value in normalized)
        {
            var role = value switch
            {
                "admin" => UserRole.Admin,
                "manager" => UserRole.Manager,
                "department" => UserRole.Department,
                "customer" => UserRole.Customer,
                "user" => UserRole.Customer,
                _ => throw new ArgumentException($"Unsupported role '{value}'")
            };

            result.Add((int)role);
        }

        return result.ToArray();
    }

    private static List<string> ConvertRolesToStrings(IEnumerable<int> roles)
    {
        var result = new List<string>();

        foreach (var value in roles ?? Array.Empty<int>())
        {
            var name = ((UserRole)value) switch
            {
                UserRole.Admin => "admin",
                UserRole.Manager => "manager",
                UserRole.Department => "department",
                _ => "user"
            };

            if (!result.Contains(name))
            {
                result.Add(name);
            }
        }

        if (result.Count == 0)
        {
            result.Add("user");
        }

        return result;
    }
}

