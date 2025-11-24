using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace backend.Data;

public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        var connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION")
            ?? "Host=ep-cool-water-a93pyl7o-pooler.gwc.azure.neon.tech; Database=neondb; Username=neondb_owner; Password=npg_mJxEBju50YTv; SSL Mode=VerifyFull; Channel Binding=Require;";

        optionsBuilder.UseNpgsql(connectionString);

        return new AppDbContext(optionsBuilder.Options);
    }
}
