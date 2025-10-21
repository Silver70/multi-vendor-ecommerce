using Microsoft.EntityFrameworkCore;
using EcommerceApi.Data;
using EcommerceApi.Utils;
using EcommerceApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Configure Clerk JWT authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    var clerkConfig = builder.Configuration.GetSection("Clerk");
    var frontendApi = clerkConfig["FrontendApi"] ?? throw new Exception("Clerk:FrontendApi configuration is required");

    // Extract instance name from frontend API (format: clerk.{instance}.{domain})
    // For Clerk, the issuer will be something like: https://clerk.{instance}.lcl.dev or https://clerk.{instance}.com
    var issuer = "https://better-sturgeon-87.clerk.accounts.dev";

    options.Authority = issuer;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false, // Disable issuer validation for custom JWT templates
        ValidateAudience = false, // Clerk doesn't use audience validation
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        NameClaimType = "sub", // Clerk uses "sub" for user ID
    };

    // Enable automatic retrieval of signing keys from Clerk's JWKS endpoint
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();

});

builder.Services.AddAuthorization();

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:3000") // frontend origin
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // important for cookies
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register SlugGenerator and VariantGenerationService
builder.Services.AddScoped<SlugGenerator>();
builder.Services.AddScoped<VariantGenerationService>();

var app = builder.Build();

// Seed database if in development mode and SEED_DATABASE environment variable is set
// TODO: Re-enable database seeding after updating DatabaseSeeder for new schema
// if (app.Environment.IsDevelopment())
// {
//     var seedDatabase = builder.Configuration.GetValue<bool>("SeedDatabase");
//     if (seedDatabase)
//     {
//         using var scope = app.Services.CreateScope();
//         var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

//         try
//         {
//             // Use async seeding for better performance
//             await DatabaseSeeder.SeedDatabaseAsync(dbContext);
//         }
//         catch (Exception ex)
//         {
//             var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
//             logger.LogError(ex, "An error occurred while seeding the database.");
//         }
//     }
// }

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Only use HTTPS redirection in production
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
