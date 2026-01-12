using backend.Data;
using backend.Filters;
using backend.Seeding;
using backend.Services.Interfaces;
using backend.Services.Implementations;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using DotNetEnv;
using System;
using System.Linq;

// Load .env before the host builds configuration so values are available to providers
Env.Load();

var builder = WebApplication.CreateBuilder(args);

var corsOrigins = Environment.GetEnvironmentVariable("CORS_ORIGINS")?
    .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    .Select(origin => origin.Trim().Trim('"', '\'').TrimEnd('/'))
    .Where(origin => !string.IsNullOrWhiteSpace(origin))
    .ToArray();

// DB
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(Environment.GetEnvironmentVariable("DB_CONNECTION")));

// Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddHttpClient<IEmailService, EmailService>(client =>
{
    client.BaseAddress = new Uri("https://api.sendgrid.com/v3/");
});
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IAdminUsersService, AdminUsersService>();
builder.Services.AddScoped<IAdminDepartmentsService, AdminDepartmentsService>();
builder.Services.AddScoped<IAdminDirectionsService, AdminDirectionsService>();
builder.Services.AddScoped<IAdminProductGroupsService, AdminProductGroupsService>();
builder.Services.AddScoped<IOrdersCatalogService, OrdersCatalogService>();
builder.Services.AddScoped<IAvailabilityService, AvailabilityService>();
builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IOrderNotificationService, OrderNotificationService>();
builder.Services.AddScoped<IUserDiscountService, UserDiscountService>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        var origins = corsOrigins?.Length > 0
            ? corsOrigins.Append("https://b2b.mixon.ua").Distinct(StringComparer.OrdinalIgnoreCase).ToArray()
            : new[] { "https://b2b.mixon.ua" };

        policy.WithOrigins(origins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// JWT
builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = JwtTokenService.GetValidationParameters();
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Swagger + JWT support
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ChatApp API", Version = "v1" });
    c.CustomSchemaIds(type => type.FullName?.Replace('.', '_'));
    
    // Support for file uploads in Swagger
    c.OperationFilter<FileUploadOperationFilter>();
    
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header. Example: 'Bearer {token}'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            }, new string[] {}
        }
    });
});

var app = builder.Build();

if (args.Contains("--seed-discounts", StringComparer.OrdinalIgnoreCase))
{
    using var scope = app.Services.CreateScope();
    await DiscountProfileSeeder.SeedAsync(scope.ServiceProvider);
    Console.WriteLine("Discount profiles seeded successfully.");
    return;
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "ChatApp API v1");
        options.DefaultModelsExpandDepth(-1);
    });
}

app.UseRouting();
app.UseCors("FrontendPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();