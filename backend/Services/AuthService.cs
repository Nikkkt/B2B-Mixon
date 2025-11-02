using backend.Data;
using backend.DTOs;
using backend.Models;

namespace backend.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IEmailService _email;

    public AuthService(AppDbContext db, IEmailService email)
    {
        _db = db;
        _email = email;
    }

    public async Task<string> RegisterAsync(RegisterDto dto)
    {
        if (_db.Users.Any(x => x.Email == dto.Email))
            throw new Exception("User with this email already exists");

        PasswordHasher.CreatePasswordHash(dto.Password, out var hash, out var salt);

        var user = new User
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = dto.Email,
            PasswordHash = hash,
            PasswordSalt = salt,
            Company = dto.Company,
            Country = dto.Country,
            City = dto.City,
            Address = dto.Address,
            Phone = dto.Phone,
            IsConfirmed = false,
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        await _email.SendAsync(user.Email, "Welcome to ChatApp", "Please confirm your account with the code: 123456");

        return JwtTokenService.GenerateToken(user);
    }

    public async Task<string> LoginAsync(LoginDto dto)
    {
        var user = _db.Users.FirstOrDefault(x => x.Email == dto.Email);
        if (user == null || !PasswordHasher.VerifyPasswordHash(dto.Password, user.PasswordHash, user.PasswordSalt))
            throw new Exception("Invalid credentials");

        return JwtTokenService.GenerateToken(user);
    }

    public async Task<string> ResetPasswordAsync(ResetPasswordDto dto)
    {
        var user = _db.Users.FirstOrDefault(x => x.Email == dto.Email);
        if (user == null) throw new Exception("User not found");

        PasswordHasher.CreatePasswordHash(dto.NewPassword, out var hash, out var salt);
        user.PasswordHash = hash;
        user.PasswordSalt = salt;

        await _db.SaveChangesAsync();

        return "Password updated";
    }

    public async Task<bool> VerifyCodeAsync(VerifyCodeDto dto)
    {
        // TODO: implement real code verification
        return dto.Code == "123456";
    }
}