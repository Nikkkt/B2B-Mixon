using System.Net;
using System.Net.Mail;

using backend.Services.Interfaces;

namespace backend.Services.Implementations;

public class EmailService : IEmailService
{
    public async Task SendAsync(string to, string subject, string body)
    {
        using var client = new SmtpClient(Environment.GetEnvironmentVariable("EMAIL_HOST"), int.Parse(Environment.GetEnvironmentVariable("EMAIL_PORT")!))
        {
            Credentials = new NetworkCredential(Environment.GetEnvironmentVariable("EMAIL_USER"), Environment.GetEnvironmentVariable("EMAIL_PASS")),
            EnableSsl = true
        };

        var mail = new MailMessage(Environment.GetEnvironmentVariable("EMAIL_USER"), to, subject, body);
        await client.SendMailAsync(mail);
    }
}

