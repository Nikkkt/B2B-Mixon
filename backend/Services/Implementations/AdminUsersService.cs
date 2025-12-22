using backend.Data;
using backend.DTOs.AdminUsers;
using backend.Enums;
using backend.Models;using Microsoft.EntityFrameworkCore;

using backend.Services.Interfaces;

namespace backend.Services.Implementations;

public class AdminUsersService : IAdminUsersService
{
    private readonly AppDbContext _db;
    private readonly ILogger<AdminUsersService> _logger;

    public AdminUsersService(AppDbContext db, ILogger<AdminUsersService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<AdminUsersResponseDto> GetDashboardAsync()
    {
        var reference = await LoadReferenceDataAsync();
        var users = await _db.Users
            .AsNoTracking()
            .Include(u => u.DiscountProfile)
            .Include(u => u.SpecialDiscounts)
                .ThenInclude(sd => sd.ProductGroup)
            .Include(u => u.ProductAccesses)
                .ThenInclude(pa => pa.ProductGroup)
            .OrderBy(u => u.FirstName)
            .ThenBy(u => u.LastName)
            .ToListAsync();

        var userDtos = users.Select(u => MapUser(u, reference)).ToList();

        return new AdminUsersResponseDto
        {
            Users = userDtos,
            Branches = reference.Branches.Values.OrderBy(b => b.DisplayName).ToList(),
            Shops = reference.Shops.Values.OrderBy(s => s.DisplayName).ToList(),
            ProductGroups = reference.ProductGroupsDto,
            DiscountProfiles = reference.DiscountProfilesDto,
            Managers = reference.Managers
        };
    }

    public async Task<AdminUserDto> GetUserAsync(Guid userId)
    {
        var reference = await LoadReferenceDataAsync();
        return await GetUserInternalAsync(userId, reference);
    }

    public async Task<AdminUserDto> CreateUserAsync(AdminUserCreateRequestDto dto)
    {
        var reference = await LoadReferenceDataAsync();

        var email = NormalizeEmail(dto.Email);
        if (await _db.Users.AnyAsync(u => u.Email == email))
        {
            throw new InvalidOperationException("A user with this email already exists.");
        }

        if (dto.ShippingPointId.HasValue
            && !reference.Branches.ContainsKey(dto.ShippingPointId.Value)
            && !reference.Shops.ContainsKey(dto.ShippingPointId.Value))
        {
            throw new ArgumentException("Specified shipping point does not exist.");
        }

        if (dto.DepartmentShopId.HasValue
            && !reference.Branches.ContainsKey(dto.DepartmentShopId.Value)
            && !reference.Shops.ContainsKey(dto.DepartmentShopId.Value))
        {
            throw new ArgumentException("Specified department shop does not exist.");
        }

        if (dto.DiscountProfileId.HasValue && !reference.DiscountProfileDefaults.ContainsKey(dto.DiscountProfileId.Value))
        {
            throw new ArgumentException("Specified discount profile does not exist.");
        }

        if (dto.ManagerUserId.HasValue && !reference.ManagerMap.ContainsKey(dto.ManagerUserId.Value))
        {
            throw new ArgumentException("Specified manager does not exist or is not eligible.");
        }

        PasswordHasher.CreatePasswordHash(dto.Password, out var hash, out var salt);

        var now = DateTime.UtcNow;
        var user = new User
        {
            Email = email,
            FirstName = dto.FirstName.Trim(),
            LastName = dto.LastName.Trim(),
            Company = dto.Company?.Trim() ?? string.Empty,
            CompanyCode = dto.CompanyCode?.Trim() ?? string.Empty,
            Country = dto.Country?.Trim() ?? string.Empty,
            City = dto.City?.Trim() ?? string.Empty,
            Address = dto.Address?.Trim() ?? string.Empty,
            Phone = dto.Phone?.Trim() ?? string.Empty,
            Fax = dto.Fax?.Trim() ?? string.Empty,
            Roles = ParseRoles(dto.Roles),
            DefaultBranchId = dto.ShippingPointId,
            DepartmentShopId = dto.DepartmentShopId,
            DiscountProfileId = dto.DiscountProfileId,
            ManagerUserId = dto.ManagerUserId,
            PasswordHash = hash,
            PasswordSalt = salt,
            IsConfirmed = true,
            ConfirmedAt = now,
            CreatedAt = now,
            LastContactNote = string.IsNullOrWhiteSpace(dto.LastContact) ? null : dto.LastContact.Trim()
        };

        UpdateProductAccesses(user, dto.HasFullAccess, dto.ProductGroupAccessIds, reference);
        ApplySpecialDiscounts(user, dto.SpecialDiscounts, reference);

        await _db.Users.AddAsync(user);
        await _db.SaveChangesAsync();

        return await GetUserInternalAsync(user.Id, reference);
    }

    public async Task<AdminUserDto> UpdateUserAsync(Guid userId, AdminUserUpdateRequestDto dto)
    {
        var reference = await LoadReferenceDataAsync();

        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        // Log all tracked entities before clearing
        var allTracked = _db.ChangeTracker.Entries().ToList();
        _logger.LogInformation("Tracked entities before clear: {Count}", allTracked.Count);
        foreach (var entry in allTracked.Where(e => e.Entity is UserProductAccess))
        {
            var access = (UserProductAccess)entry.Entity;
            _logger.LogInformation("Tracked UserProductAccess: Id={Id}, UserId={UserId}, State={State}",
                access.Id, access.UserId, entry.State);
        }

        // Nuclear option: clear entire change tracker to eliminate all phantom entities
        _db.ChangeTracker.Clear();
        
        // Reload the user after clearing tracker
        user = await _db.Users.FindAsync(userId);
        if (user == null)
        {
            throw new KeyNotFoundException("User not found after tracker clear");
        }

        // Load navigation collections with AsNoTracking to get fresh data without phantom tracking
        var currentAccesses = await _db.UserProductAccesses
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .ToListAsync();

        var currentDiscounts = await _db.SpecialDiscounts
            .AsNoTracking()
            .Where(s => s.UserId == userId)
            .ToListAsync();

        // Manually attach and mark as unchanged to establish proper tracking
        user.ProductAccesses = new List<UserProductAccess>();
        foreach (var access in currentAccesses)
        {
            user.ProductAccesses.Add(access);
            _db.Entry(access).State = EntityState.Unchanged;
        }

        user.SpecialDiscounts = new List<SpecialDiscount>();
        foreach (var discount in currentDiscounts)
        {
            user.SpecialDiscounts.Add(discount);
            _db.Entry(discount).State = EntityState.Unchanged;
        }
        
        _logger.LogInformation("Loaded {AccessCount} accesses and {DiscountCount} discounts for user {UserId}",
            currentAccesses.Count, currentDiscounts.Count, userId);

        var email = NormalizeEmail(dto.Email);
        if (!string.Equals(user.Email, email, StringComparison.OrdinalIgnoreCase))
        {
            var emailConflict = await _db.Users.AnyAsync(u => u.Email == email && u.Id != userId);
            if (emailConflict)
            {
                throw new InvalidOperationException("A user with this email already exists.");
            }
            user.Email = email;
        }

        if (dto.ShippingPointId.HasValue
            && !reference.Branches.ContainsKey(dto.ShippingPointId.Value)
            && !reference.Shops.ContainsKey(dto.ShippingPointId.Value))
        {
            throw new ArgumentException("Specified shipping point does not exist.");
        }

        if (dto.DepartmentShopId.HasValue
            && !reference.Branches.ContainsKey(dto.DepartmentShopId.Value)
            && !reference.Shops.ContainsKey(dto.DepartmentShopId.Value))
        {
            throw new ArgumentException("Specified department shop does not exist.");
        }

        if (dto.DiscountProfileId.HasValue && !reference.DiscountProfileDefaults.ContainsKey(dto.DiscountProfileId.Value))
        {
            throw new ArgumentException("Specified discount profile does not exist.");
        }

        if (dto.ManagerUserId.HasValue)
        {
            if (!reference.ManagerMap.ContainsKey(dto.ManagerUserId.Value))
            {
                throw new ArgumentException("Specified manager does not exist or is not eligible.");
            }

            if (dto.ManagerUserId.Value == user.Id)
            {
                throw new ArgumentException("Користувач не може бути власним менеджером.");
            }
        }

        user.FirstName = dto.FirstName.Trim();
        user.LastName = dto.LastName.Trim();
        user.Company = dto.Company?.Trim() ?? string.Empty;
        user.CompanyCode = dto.CompanyCode?.Trim() ?? string.Empty;
        user.Country = dto.Country?.Trim() ?? string.Empty;
        user.City = dto.City?.Trim() ?? string.Empty;
        user.Address = dto.Address?.Trim() ?? string.Empty;
        user.Phone = dto.Phone?.Trim() ?? string.Empty;
        user.Fax = dto.Fax?.Trim() ?? string.Empty;
        user.Roles = ParseRoles(dto.Roles);

        user.DefaultBranchId = dto.ShippingPointId;
        user.DepartmentShopId = dto.DepartmentShopId;
        user.DiscountProfileId = dto.DiscountProfileId;
        user.LastContactNote = string.IsNullOrWhiteSpace(dto.LastContact) ? null : dto.LastContact.Trim();
        user.ManagerUserId = dto.ManagerUserId;

        if (dto.IsConfirmed && !user.IsConfirmed)
        {
            user.IsConfirmed = true;
            user.ConfirmedAt ??= DateTime.UtcNow;
        }
        else if (!dto.IsConfirmed && user.IsConfirmed)
        {
            user.IsConfirmed = false;
            user.ConfirmedAt = null;
        }

        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            PasswordHasher.CreatePasswordHash(dto.Password, out var hash, out var salt);
            user.PasswordHash = hash;
            user.PasswordSalt = salt;
            user.LastPasswordResetAt = DateTime.UtcNow;
        }

        UpdateProductAccesses(user, dto.HasFullAccess, dto.ProductGroupAccessIds, reference);
        ApplySpecialDiscounts(user, dto.SpecialDiscounts, reference);

        try
        {
            // Log entity states for debugging
            var entries = _db.ChangeTracker.Entries()
                .Where(e => e.State != EntityState.Unchanged)
                .ToList();
            
            _logger.LogInformation("Saving changes. Modified entities: {Count}", entries.Count);
            foreach (var entry in entries)
            {
                _logger.LogInformation("Entity: {EntityType}, State: {State}, Keys: {Keys}",
                    entry.Entity.GetType().Name,
                    entry.State,
                    string.Join(", ", entry.Properties.Where(p => p.Metadata.IsKey()).Select(p => $"{p.Metadata.Name}={p.CurrentValue}")));
            }

            await _db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException ex)
        {
            _logger.LogError(ex, "Concurrency error while updating user {UserId}. Entries: {@Entries}",
                userId,
                ex.Entries.Select(e => new { Type = e.Entity.GetType().Name, State = e.State }).ToList());
            throw;
        }

        return await GetUserInternalAsync(userId, reference);
    }

    private async Task<AdminUserDto> GetUserInternalAsync(Guid userId, ReferenceData reference)
    {
        var user = await _db.Users
            .AsNoTracking()
            .Include(u => u.DiscountProfile)
            .Include(u => u.SpecialDiscounts)
                .ThenInclude(sd => sd.ProductGroup)
            .Include(u => u.ProductAccesses)
                .ThenInclude(pa => pa.ProductGroup)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        return MapUser(user, reference);
    }

    private void ApplySpecialDiscounts(User user, IEnumerable<AdminUserSpecialDiscountInputDto> specials, ReferenceData reference)
    {
        var normalized = NormalizeSpecialDiscounts(specials, reference);

        var existing = user.SpecialDiscounts.ToDictionary(sd => sd.ProductGroupId, sd => sd);

        foreach (var special in existing.Values.ToList())
        {
            if (!normalized.ContainsKey(special.ProductGroupId))
            {
                _db.SpecialDiscounts.Remove(special);
                user.SpecialDiscounts.Remove(special);
            }
        }

        foreach (var pair in normalized)
        {
            if (existing.TryGetValue(pair.Key, out var special))
            {
                special.Percent = pair.Value;
                _db.Entry(special).State = EntityState.Modified;
            }
            else
            {
                var newSpecial = new SpecialDiscount
                {
                    UserId = user.Id,
                    ProductGroupId = pair.Key,
                    Percent = pair.Value,
                    CreatedAt = DateTime.UtcNow
                };

                user.SpecialDiscounts.Add(newSpecial);
                _db.Entry(newSpecial).State = EntityState.Added;
            }
        }
    }

    private void UpdateProductAccesses(User user, bool hasFullAccess, IEnumerable<Guid> productGroupAccessIds, ReferenceData reference)
    {
        // Validate requested product groups first
        var distinctIds = (productGroupAccessIds ?? Enumerable.Empty<Guid>()).Distinct().ToList();
        foreach (var productGroupId in distinctIds)
        {
            if (!reference.ProductGroups.ContainsKey(productGroupId))
            {
                throw new ArgumentException($"Product group '{productGroupId}' does not exist.");
            }
        }

        // Build desired state: what should exist after the update
        var desiredKeys = new HashSet<string>();
        if (hasFullAccess)
        {
            desiredKeys.Add("full_access");
        }
        else
        {
            foreach (var groupId in distinctIds)
            {
                desiredKeys.Add($"group_{groupId}");
            }
        }

        // Build current state: map of what currently exists
        var existingMap = new Dictionary<string, UserProductAccess>();
        foreach (var access in user.ProductAccesses.ToList())
        {
            var key = access.IsFullAccess ? "full_access" : $"group_{access.ProductGroupId}";
            existingMap[key] = access;
        }

        // Remove accesses that should no longer exist
        foreach (var kvp in existingMap)
        {
            if (!desiredKeys.Contains(kvp.Key))
            {
                _db.UserProductAccesses.Remove(kvp.Value);
                user.ProductAccesses.Remove(kvp.Value);
            }
        }

        // Add new accesses that don't exist yet (never modify existing ones)
        if (hasFullAccess && !existingMap.ContainsKey("full_access"))
        {
            var newAccess = new UserProductAccess
            {
                UserId = user.Id,
                IsFullAccess = true,
                CreatedAt = DateTime.UtcNow
            };
            user.ProductAccesses.Add(newAccess);
            _db.Entry(newAccess).State = EntityState.Added;
        }
        else if (!hasFullAccess)
        {
            foreach (var groupId in distinctIds)
            {
                var key = $"group_{groupId}";
                if (!existingMap.ContainsKey(key))
                {
                    var newAccess = new UserProductAccess
                    {
                        UserId = user.Id,
                        ProductGroupId = groupId,
                        IsFullAccess = false,
                        CreatedAt = DateTime.UtcNow
                    };
                    user.ProductAccesses.Add(newAccess);
                    _db.Entry(newAccess).State = EntityState.Added;
                }
            }
        }
    }

    private static AdminUserDto MapUser(User user, ReferenceData reference)
    {
        var displayName = string.Join(" ", new[] { user.FirstName, user.LastName }
            .Where(part => !string.IsNullOrWhiteSpace(part)));
        var isRecentlyCreated = user.CreatedAt >= DateTime.UtcNow.AddHours(-48);

        var location = string.Join(", ", new[] { user.Country, user.City }
            .Where(part => !string.IsNullOrWhiteSpace(part)));

        var roleStrings = ConvertRolesToStrings(user.Roles);

        AdminManagerOptionDto? managerInfo = null;
        if (user.ManagerUserId.HasValue && reference.ManagerMap.TryGetValue(user.ManagerUserId.Value, out var lookup))
        {
            managerInfo = lookup;
        }
        else if (user.ManagerUser != null)
        {
            var nameParts = new[] { user.ManagerUser.FirstName, user.ManagerUser.LastName }
                .Where(part => !string.IsNullOrWhiteSpace(part));
            var managerDisplayName = string.Join(" ", nameParts);
            if (string.IsNullOrWhiteSpace(managerDisplayName))
            {
                managerDisplayName = user.ManagerUser.Email;
            }

            managerInfo = new AdminManagerOptionDto
            {
                Id = user.ManagerUser.Id,
                DisplayName = managerDisplayName,
                Email = user.ManagerUser.Email,
                Roles = ConvertRolesToStrings(user.ManagerUser.Roles)
            };
        }

        var defaultDiscounts = user.DiscountProfileId.HasValue && reference.DiscountProfileDefaults.TryGetValue(user.DiscountProfileId.Value, out var defaults)
            ? defaults.Select(d => new AdminUserDefaultDiscountDto
            {
                ProductGroupId = d.ProductGroupId,
                ProductGroupNumber = d.ProductGroupNumber,
                ProductGroupName = d.ProductGroupName,
                Percent = d.Percent
            }).ToList()
            : new List<AdminUserDefaultDiscountDto>();

        var specialDiscounts = user.SpecialDiscounts
            .Select(sd =>
            {
                reference.ProductGroups.TryGetValue(sd.ProductGroupId, out var productGroup);
                return new AdminUserSpecialDiscountDto
                {
                    Id = sd.Id,
                    ProductGroupId = sd.ProductGroupId,
                    ProductGroupNumber = productGroup?.GroupNumber ?? sd.ProductGroup?.GroupNumber ?? string.Empty,
                    ProductGroupName = productGroup?.GroupName ?? sd.ProductGroup?.GroupName ?? string.Empty,
                    Percent = sd.Percent,
                    CreatedAt = sd.CreatedAt
                };
            })
            .OrderBy(sd => sd.ProductGroupNumber)
            .ToList();

        var hasFullAccess = user.ProductAccesses.Any(pa => pa.IsFullAccess);
        var productGroupAccessIds = user.ProductAccesses
            .Where(pa => !pa.IsFullAccess && pa.ProductGroupId.HasValue)
            .Select(pa => pa.ProductGroupId!.Value)
            .Distinct()
            .ToList();

        return new AdminUserDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            DisplayName = string.IsNullOrWhiteSpace(displayName) ? user.Email : displayName,
            Email = user.Email,
            Company = string.IsNullOrWhiteSpace(user.Company) ? null : user.Company,
            CompanyCode = string.IsNullOrWhiteSpace(user.CompanyCode) ? null : user.CompanyCode,
            Country = string.IsNullOrWhiteSpace(user.Country) ? null : user.Country,
            City = string.IsNullOrWhiteSpace(user.City) ? null : user.City,
            Address = string.IsNullOrWhiteSpace(user.Address) ? null : user.Address,
            Location = string.IsNullOrWhiteSpace(location) ? null : location,
            Phone = string.IsNullOrWhiteSpace(user.Phone) ? null : user.Phone,
            Fax = string.IsNullOrWhiteSpace(user.Fax) ? null : user.Fax,
            Roles = roleStrings,
            ShippingPointId = user.DefaultBranchId,
            ShippingPointName = user.DefaultBranchId.HasValue
                && (reference.Branches.TryGetValue(user.DefaultBranchId.Value, out var shippingPointDto)
                    || reference.Shops.TryGetValue(user.DefaultBranchId.Value, out shippingPointDto))
                ? shippingPointDto.DisplayName
                : null,
            DepartmentShopId = user.DepartmentShopId,
            DepartmentShopName = user.DepartmentShopId.HasValue
                && (reference.Branches.TryGetValue(user.DepartmentShopId.Value, out var shopDto)
                    || reference.Shops.TryGetValue(user.DepartmentShopId.Value, out shopDto))
                ? shopDto.DisplayName
                : null,
            DiscountProfileId = user.DiscountProfileId,
            DiscountProfileCode = user.DiscountProfile?.Code,
            ManagerUserId = managerInfo?.Id ?? user.ManagerUserId,
            ManagerDisplayName = managerInfo?.DisplayName,
            ManagerEmail = managerInfo?.Email,
            DefaultDiscounts = defaultDiscounts,
            SpecialDiscounts = specialDiscounts,
            HasFullAccess = hasFullAccess,
            ProductGroupAccessIds = productGroupAccessIds,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt,
            ConfirmedAt = user.ConfirmedAt,
            LastContact = user.LastContactNote,
            IsConfirmed = user.IsConfirmed,
            IsNew = isRecentlyCreated
        };
    }

    private static Dictionary<Guid, decimal> NormalizeSpecialDiscounts(IEnumerable<AdminUserSpecialDiscountInputDto> specials, ReferenceData reference)
    {
        var normalized = (specials ?? Enumerable.Empty<AdminUserSpecialDiscountInputDto>())
            .GroupBy(x => x.ProductGroupId)
            .ToDictionary(g => g.Key, g => g.Last().Percent);

        foreach (var key in normalized.Keys.ToList())
        {
            if (!reference.ProductGroups.ContainsKey(key))
            {
                throw new ArgumentException($"Product group '{key}' does not exist.");
            }

            var percent = normalized[key];
            if (percent < 0 || percent > 100)
            {
                throw new ArgumentException("Discount percent must be between 0 and 100.");
            }
        }

        return normalized;
    }

    private async Task<ReferenceData> LoadReferenceDataAsync()
    {
        var allDepartments = await _db.Departments
            .AsNoTracking()
            .Where(d => d.Type == DepartmentType.Branch
                        || d.Type == DepartmentType.Store
                        || d.Type == DepartmentType.SalesDepartment)
            .OrderBy(d => d.Type)
            .ThenBy(b => b.Code)
            .ThenBy(b => b.Name)
            .ToListAsync();

        var branches = allDepartments.Where(d => d.Type == DepartmentType.Branch).ToList();
        var shops = allDepartments.Where(d => d.Type == DepartmentType.Store).ToList();

        var productGroups = await _db.ProductGroups
            .AsNoTracking()
            .OrderBy(pg => pg.GroupNumber)
            .ToListAsync();

        var discountProfiles = await _db.DiscountProfiles
            .AsNoTracking()
            .Include(dp => dp.GroupDiscounts)
                .ThenInclude(gd => gd.ProductGroup)
            .OrderBy(dp => dp.Name)
            .ToListAsync();

        var managerUsers = await _db.Users
            .AsNoTracking()
            .Where(u => u.Roles.Contains((int)UserRole.Manager) || u.Roles.Contains((int)UserRole.Admin))
            .OrderBy(u => u.FirstName)
            .ThenBy(u => u.LastName)
            .ThenBy(u => u.Email)
            .ToListAsync();

        var branchDtos = branches.ToDictionary(
            b => b.Id,
            b => new AdminBranchDto
            {
                Id = b.Id,
                Code = b.Code,
                Name = b.Name,
                DisplayName = BuildBranchDisplayName(b)
            });

        var shopDtos = shops.ToDictionary(
            s => s.Id,
            s => new AdminBranchDto
            {
                Id = s.Id,
                Code = s.Code,
                Name = s.Name,
                DisplayName = BuildBranchDisplayName(s)
            });

        var productGroupDtos = productGroups
            .Select(pg => new AdminProductGroupDto
            {
                Id = pg.Id,
                GroupNumber = pg.GroupNumber,
                Name = pg.GroupName,
                DisplayName = $"{pg.GroupNumber} - {pg.GroupName}"
            })
            .ToList();

        var productGroupMap = productGroups.ToDictionary(pg => pg.Id);

        var discountProfileDefaults = discountProfiles.ToDictionary(
            dp => dp.Id,
            dp => dp.GroupDiscounts
                .Select(gd =>
                {
                    var productGroup = gd.ProductGroup;
                    if (productGroup == null && productGroupMap.TryGetValue(gd.ProductGroupId, out var pgLookup))
                    {
                        productGroup = pgLookup;
                    }

                    return new AdminUserDefaultDiscountDto
                    {
                        ProductGroupId = gd.ProductGroupId,
                        ProductGroupNumber = productGroup?.GroupNumber ?? string.Empty,
                        ProductGroupName = productGroup?.GroupName ?? string.Empty,
                        Percent = gd.Percent
                    };
                })
                .OrderBy(d => d.ProductGroupNumber)
                .ToList());

        var discountProfileDtos = discountProfiles
            .Select(dp => new AdminDiscountProfileDto
            {
                Id = dp.Id,
                Code = dp.Code,
                Name = dp.Name,
                Description = dp.Description,
                DefaultDiscounts = discountProfileDefaults.TryGetValue(dp.Id, out var defaults)
                    ? defaults.Select(d => new AdminUserDefaultDiscountDto
                    {
                        ProductGroupId = d.ProductGroupId,
                        ProductGroupNumber = d.ProductGroupNumber,
                        ProductGroupName = d.ProductGroupName,
                        Percent = d.Percent
                    }).ToList()
                    : new List<AdminUserDefaultDiscountDto>()
            })
            .ToList();

        var managerOptions = managerUsers
            .Select(u =>
            {
                var name = string.Join(" ", new[] { u.FirstName, u.LastName }
                    .Where(part => !string.IsNullOrWhiteSpace(part)));
                var displayName = string.IsNullOrWhiteSpace(name) ? u.Email : name;

                return new AdminManagerOptionDto
                {
                    Id = u.Id,
                    DisplayName = displayName,
                    Email = u.Email,
                    Roles = ConvertRolesToStrings(u.Roles)
                };
            })
            .OrderBy(option => option.DisplayName)
            .ToList();

        var managerMap = managerOptions.ToDictionary(option => option.Id);

        return new ReferenceData(branchDtos, shopDtos, productGroupMap, productGroupDtos, discountProfileDefaults, discountProfileDtos, managerOptions, managerMap);
    }

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
            var role = (UserRole)value;
            var roleName = role switch
            {
                UserRole.Admin => "admin",
                UserRole.Manager => "manager",
                UserRole.Department => "department",
                _ => "user"
            };

            if (!result.Contains(roleName))
            {
                result.Add(roleName);
            }
        }

        if (result.Count == 0)
        {
            result.Add("user");
        }

        return result;
    }

    private static string NormalizeEmail(string value) => value.Trim().ToLowerInvariant();

    private static string BuildBranchDisplayName(Department department)
    {
        var name = string.IsNullOrWhiteSpace(department.Name) ? department.Code : department.Name;
        return string.IsNullOrWhiteSpace(department.Code) ? name : $"{department.Code} - {name}";
    }

    private sealed record ReferenceData(
        IReadOnlyDictionary<Guid, AdminBranchDto> Branches,
        IReadOnlyDictionary<Guid, AdminBranchDto> Shops,
        IReadOnlyDictionary<Guid, ProductGroup> ProductGroups,
        List<AdminProductGroupDto> ProductGroupsDto,
        IReadOnlyDictionary<Guid, List<AdminUserDefaultDiscountDto>> DiscountProfileDefaults,
        List<AdminDiscountProfileDto> DiscountProfilesDto,
        List<AdminManagerOptionDto> Managers,
        IReadOnlyDictionary<Guid, AdminManagerOptionDto> ManagerMap
    );
}

