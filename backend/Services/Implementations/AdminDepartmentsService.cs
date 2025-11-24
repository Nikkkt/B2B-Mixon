using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.Data;
using backend.DTOs.AdminDepartments;
using backend.DTOs.AdminUsers;
using backend.Enums;
using backend.Models;using Microsoft.EntityFrameworkCore;

using backend.Services.Interfaces;

namespace backend.Services.Implementations;

public class AdminDepartmentsService : IAdminDepartmentsService
{
    private readonly AppDbContext _db;

    public AdminDepartmentsService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<AdminDepartmentDto> CreateDepartmentAsync(AdminDepartmentCreateRequestDto dto)
    {
        if (dto == null)
        {
            throw new ArgumentNullException(nameof(dto));
        }

        var branchMap = await LoadBranchMapAsync();
        var type = ParseType(dto.Type);

        Guid? branchId = null;
        Guid? sourceBranchId = null;

        if (type != DepartmentType.SalesDepartment)
        {
            if (dto.BranchId.HasValue)
            {
                if (!branchMap.ContainsKey(dto.BranchId.Value))
                {
                    throw new ArgumentException("Specified branch does not exist.");
                }

                branchId = dto.BranchId;
            }

            if (type == DepartmentType.Store && dto.SourceBranchId.HasValue)
            {
                if (!branchMap.ContainsKey(dto.SourceBranchId.Value))
                {
                    throw new ArgumentException("Specified source branch does not exist.");
                }

                sourceBranchId = dto.SourceBranchId;
            }
        }

        var now = DateTime.UtcNow;

        var department = new Department
        {
            Id = Guid.NewGuid(),
            Code = await GenerateDepartmentCodeAsync(type, now),
            Name = dto.Name.Trim(),
            Type = type,
            BranchId = branchId,
            SourceBranchId = sourceBranchId,
            AddedAt = now,
            UpdatedAt = now
        };

        _db.Departments.Add(department);
        await _db.SaveChangesAsync();
        
        // Now sync employees after the department is saved
        await SyncEmployeesAsync(department, dto.Employees);
        await _db.SaveChangesAsync();

        await _db.Entry(department).Reference(d => d.Branch).LoadAsync();
        await _db.Entry(department).Reference(d => d.SourceBranch).LoadAsync();
        await _db.Entry(department).Collection(d => d.Employees).LoadAsync();

        return MapDepartment(department, branchMap);
    }

    public async Task<AdminDepartmentsDashboardDto> GetDashboardAsync()
    {
        var branchMap = await LoadBranchMapAsync();

        var departments = await _db.Departments
            .AsNoTracking()
            .Include(d => d.Branch)
            .Include(d => d.SourceBranch)
            .Include(d => d.Employees)
            .OrderBy(d => d.Name)
            .ToListAsync();

        var dtos = departments
            .Select(d => MapDepartment(d, branchMap))
            .ToList();

        return new AdminDepartmentsDashboardDto
        {
            Branches = dtos.Where(d => d.Type == "branch").OrderBy(d => d.Name).ToList(),
            Stores = dtos.Where(d => d.Type == "store").OrderBy(d => d.Name).ToList(),
            SalesDepartments = dtos.Where(d => d.Type == "sales").OrderBy(d => d.Name).ToList(),
            BranchOptions = branchMap.Values.OrderBy(b => b.DisplayName).ToList()
        };
    }

    private async Task<string> GenerateDepartmentCodeAsync(DepartmentType type, DateTime now)
    {
        var prefix = type switch
        {
            DepartmentType.Branch => "BR",
            DepartmentType.Store => "ST",
            DepartmentType.SalesDepartment => "SD",
            _ => "BR"
        };

        var datePart = now.ToString("yyyyMMdd");

        var existingCodes = await _db.Departments
            .AsNoTracking()
            .Where(d => d.Code.StartsWith(prefix))
            .Select(d => d.Code)
            .ToListAsync();

        var nextIndex = 1;

        foreach (var code in existingCodes)
        {
            var parts = code.Split('-');
            if (parts.Length == 3 && parts[1].Equals(datePart, StringComparison.Ordinal))
            {
                if (int.TryParse(parts[2], out var number) && number >= nextIndex)
                {
                    nextIndex = number + 1;
                }
            }
        }

        return $"{prefix}-{datePart}-{nextIndex:D3}";
    }

    public async Task<AdminDepartmentDto> GetDepartmentAsync(Guid departmentId)
    {
        var branchMap = await LoadBranchMapAsync();

        var department = await _db.Departments
            .AsNoTracking()
            .Include(d => d.Branch)
            .Include(d => d.SourceBranch)
            .Include(d => d.Employees)
            .FirstOrDefaultAsync(d => d.Id == departmentId);

        if (department == null)
        {
            throw new KeyNotFoundException("Department not found");
        }

        return MapDepartment(department, branchMap);
    }

    public async Task<AdminDepartmentDto> UpdateDepartmentAsync(Guid departmentId, AdminDepartmentUpdateRequestDto dto)
    {
        var branchMap = await LoadBranchMapAsync();

        var department = await _db.Departments
            .FirstOrDefaultAsync(d => d.Id == departmentId);

        if (department == null)
        {
            throw new KeyNotFoundException("Department not found");
        }
        
        // Load employees separately to avoid tracking issues
        await _db.Entry(department).Collection(d => d.Employees).LoadAsync();

        var type = ParseType(dto.Type);
        department.Name = dto.Name.Trim();
        department.Type = type;

        if (type == DepartmentType.SalesDepartment)
        {
            department.BranchId = null;
            department.SourceBranchId = null;
        }
        else
        {
            if (dto.BranchId.HasValue)
            {
                if (!branchMap.ContainsKey(dto.BranchId.Value))
                {
                    throw new ArgumentException("Specified branch does not exist.");
                }

                department.BranchId = dto.BranchId;
            }

            if (type == DepartmentType.Store)
            {
                if (dto.SourceBranchId.HasValue)
                {
                    if (!branchMap.ContainsKey(dto.SourceBranchId.Value))
                    {
                        throw new ArgumentException("Specified source branch does not exist.");
                    }

                    department.SourceBranchId = dto.SourceBranchId;
                }
            }
            else
            {
                department.SourceBranchId = null;
            }
        }

        await SyncEmployeesAsync(department, dto.Employees);
        department.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        await _db.Entry(department).Reference(d => d.Branch).LoadAsync();
        await _db.Entry(department).Reference(d => d.SourceBranch).LoadAsync();
        await _db.Entry(department).Collection(d => d.Employees).LoadAsync();

        return MapDepartment(department, branchMap);
    }

    public async Task DeleteDepartmentAsync(Guid departmentId)
    {
        var department = await _db.Departments
            .FirstOrDefaultAsync(d => d.Id == departmentId);

        if (department == null)
        {
            throw new KeyNotFoundException("Department not found");
        }

        // Delete all employees first
        var employees = await _db.DepartmentEmployees
            .Where(e => e.DepartmentId == departmentId)
            .ToListAsync();
        
        _db.DepartmentEmployees.RemoveRange(employees);
        
        // Delete the department
        _db.Departments.Remove(department);
        
        await _db.SaveChangesAsync();
    }

    private async Task SyncEmployeesAsync(Department department, IEnumerable<AdminDepartmentEmployeeUpdateDto> employees)
    {
        // Delete all existing employees for this department
        var existingEmployees = await _db.DepartmentEmployees
            .Where(e => e.DepartmentId == department.Id)
            .ToListAsync();
        
        _db.DepartmentEmployees.RemoveRange(existingEmployees);
        
        // Add the new employees
        var incoming = (employees ?? Enumerable.Empty<AdminDepartmentEmployeeUpdateDto>())
            .Where(e => !string.IsNullOrWhiteSpace(e.Name))
            .ToList();

        foreach (var emp in incoming)
        {
            var newEmployee = new DepartmentEmployee
            {
                Id = Guid.NewGuid(),
                DepartmentId = department.Id,
                Name = emp.Name.Trim(),
                Note = string.IsNullOrWhiteSpace(emp.Note) ? null : emp.Note.Trim()
            };
            _db.DepartmentEmployees.Add(newEmployee);
        }
    }

    private async Task<Dictionary<Guid, AdminBranchDto>> LoadBranchMapAsync()
    {
        var branches = await _db.Branches
            .AsNoTracking()
            .OrderBy(b => b.Code)
            .ThenBy(b => b.Name)
            .ToListAsync();

        return branches.ToDictionary(
            b => b.Id,
            b => new AdminBranchDto
            {
                Id = b.Id,
                Code = b.Code,
                Name = b.Name,
                DisplayName = BuildBranchDisplayName(b)
            });
    }

    private static AdminDepartmentDto MapDepartment(Department department, IReadOnlyDictionary<Guid, AdminBranchDto> branchMap)
    {
        var type = department.Type;
        var typeKey = type switch
        {
            DepartmentType.Branch => "branch",
            DepartmentType.Store => "store",
            DepartmentType.SalesDepartment => "sales",
            _ => "branch"
        };

        var typeLabel = type switch
        {
            DepartmentType.Branch => "Філіал",
            DepartmentType.Store => "Магазин",
            DepartmentType.SalesDepartment => "Відділ продажу",
            _ => "Філіал"
        };

        var branchName = department.BranchId.HasValue && branchMap.TryGetValue(department.BranchId.Value, out var branchDto)
            ? branchDto.DisplayName
            : null;

        var sourceBranchName = department.SourceBranchId.HasValue && branchMap.TryGetValue(department.SourceBranchId.Value, out var sourceDto)
            ? sourceDto.DisplayName
            : null;

        var employees = department.Employees
            .OrderBy(e => e.Name)
            .Select(e => new AdminDepartmentEmployeeDto
            {
                Id = e.Id,
                Name = e.Name,
                Note = e.Note
            })
            .ToList();

        return new AdminDepartmentDto
        {
            Id = department.Id,
            Code = department.Code,
            Name = department.Name,
            Type = typeKey,
            TypeLabel = typeLabel,
            BranchId = department.BranchId,
            BranchName = branchName,
            ShippingPoint = branchName,
            SourceBranchId = department.SourceBranchId,
            SourceBranch = sourceBranchName,
            AddedAt = department.AddedAt,
            UpdatedAt = department.UpdatedAt,
            Employees = employees,
            AssignedClients = new List<AdminDepartmentClientDto>()
        };
    }

    private static DepartmentType ParseType(string value)
    {
        return value?.Trim().ToLowerInvariant() switch
        {
            "store" => DepartmentType.Store,
            "sales" or "salesdepartment" => DepartmentType.SalesDepartment,
            _ => DepartmentType.Branch
        };
    }

    private static string BuildBranchDisplayName(Branch branch)
    {
        var name = string.IsNullOrWhiteSpace(branch.Name) ? branch.Code : branch.Name;
        return string.IsNullOrWhiteSpace(branch.Code) ? name : $"{branch.Code} - {name}";
    }
}

