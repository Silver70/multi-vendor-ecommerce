using Microsoft.EntityFrameworkCore;
using EcommerceApi.Data;
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
    var issuer = frontendApi.StartsWith("http") ? frontendApi : $"https://{frontendApi}";

    options.Authority = issuer;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = false, // Clerk doesn't use audience validation
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = issuer,
        NameClaimType = "sub", // Clerk uses "sub" for user ID
    };

    // Enable automatic retrieval of signing keys from Clerk's JWKS endpoint
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();

    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            var clerkId = context.Principal?.FindFirst("sub")?.Value;
            logger.LogInformation("[AUTH] Token validated successfully for ClerkId: {ClerkId}", clerkId);

            if (string.IsNullOrEmpty(clerkId))
            {
                context.Fail("Missing sub claim");
            }
            return Task.CompletedTask;
        },
        OnAuthenticationFailed = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogError("[AUTH] Token validation failed: {Message}", context.Exception.Message);
            logger.LogError("[AUTH] Exception: {Exception}", context.Exception.ToString());
            return Task.CompletedTask;
        },
        OnChallenge = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogWarning("[AUTH] Challenge triggered. Error: {Error}, ErrorDescription: {ErrorDescription}",
                context.Error, context.ErrorDescription);
            return Task.CompletedTask;
        }
    };
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

var app = builder.Build();

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
