using System.Net;
using System.Net.Mail;
using System.Net.Sockets;
using backend.Exceptions;
using backend.Services.Interfaces;
using Microsoft.Extensions.Logging;

namespace backend.Services.Implementations;

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;

    public EmailService(ILogger<EmailService> logger)
    {
        _logger = logger;
    }

    public async Task SendAsync(string to, string subject, string body)
    {
        var host = Environment.GetEnvironmentVariable("EMAIL_HOST");
        var portValue = Environment.GetEnvironmentVariable("EMAIL_PORT");
        var username = Environment.GetEnvironmentVariable("EMAIL_USER");
        var password = Environment.GetEnvironmentVariable("EMAIL_PASS");

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(portValue) || string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            _logger.LogError("Email configuration is incomplete. Host: {Host}, Port: {Port}, User: {User}", host, portValue, username);
            throw new AuthException("Email service is not configured.", StatusCodes.Status503ServiceUnavailable);
        }

        try
        {
            using var client = new SmtpClient(host, int.Parse(portValue))
            {
                Credentials = new NetworkCredential(username, password),
                EnableSsl = true
            };

            var mail = new MailMessage(username, to, subject, body);
            await client.SendMailAsync(mail);
        }
        catch (SmtpException ex) when (ex.InnerException is SocketException socketEx && socketEx.SocketErrorCode == SocketError.NetworkUnreachable)
        {
            _logger.LogError(ex, "Outbound SMTP network is unreachable. Check hosting provider restrictions.");
            throw new AuthException("Email delivery is temporarily unavailable. Please try again later.", StatusCodes.Status503ServiceUnavailable);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email via SMTP.");
            throw new AuthException("Unable to send email at this time. Please try again later.", StatusCodes.Status503ServiceUnavailable);
        }
    }
}
