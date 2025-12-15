using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Net.Mail;
using System.Net.Sockets;
using backend.Exceptions;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace backend.Services.Implementations;

public class EmailService : IEmailService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<EmailService> _logger;
    private readonly string? _sendGridApiKey;
    private readonly string? _fromEmail;
    private readonly string _fromName;

    public EmailService(HttpClient httpClient, ILogger<EmailService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _sendGridApiKey = Environment.GetEnvironmentVariable("SENDGRID_API_KEY");
        _fromEmail = Environment.GetEnvironmentVariable("SENDGRID_FROM_EMAIL")
            ?? Environment.GetEnvironmentVariable("Email__FromEmail")
            ?? Environment.GetEnvironmentVariable("EMAIL_USER");
        _fromName = Environment.GetEnvironmentVariable("SENDGRID_FROM_NAME")
            ?? Environment.GetEnvironmentVariable("Email__FromName")
            ?? "Mixon B2B";
    }

    public async Task SendAsync(string to, string subject, string body)
    {
        try
        {
            if (!string.IsNullOrWhiteSpace(_sendGridApiKey))
            {
                _logger.LogInformation("EmailService: sending via SendGrid to {To}", to);
                await SendViaSendGridAsync(to, subject, body);
                return;
            }

            // If no SendGrid API key, require SMTP to be configured; otherwise fail fast
            var host = Environment.GetEnvironmentVariable("EMAIL_HOST");
            if (string.IsNullOrWhiteSpace(host))
            {
                _logger.LogError("EmailService: no SENDGRID_API_KEY and no EMAIL_HOST configured. Cannot send email.");
                throw new AuthException("Email service is not configured.", StatusCodes.Status503ServiceUnavailable);
            }

            _logger.LogInformation("EmailService: sending via SMTP to {To}", to);
            await SendViaSmtpAsync(to, subject, body);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "EmailService: failed to send email to {To} via configured provider", to);
            throw;
        }
    }

    private async Task SendViaSendGridAsync(string to, string subject, string body)
    {
        if (string.IsNullOrWhiteSpace(_fromEmail))
        {
            _logger.LogError("SendGrid configuration is incomplete: FromEmail missing.");
            throw new AuthException("Email service is not configured.", StatusCodes.Status503ServiceUnavailable);
        }

        var payload = new
        {
            personalizations = new[]
            {
                new { to = new[] { new { email = to } } }
            },
            from = new { email = _fromEmail, name = _fromName },
            subject,
            content = new[]
            {
                // Prefer HTML so templates render nicely; include text fallback
                new { type = "text/html", value = body },
                new { type = "text/plain", value = StripHtml(body) }
            }
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.sendgrid.com/v3/mail/send")
        {
            Content = JsonContent.Create(payload)
        };

        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _sendGridApiKey);

        var response = await _httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            var details = await response.Content.ReadAsStringAsync();
            _logger.LogError("SendGrid email failed with {StatusCode}: {Body}", response.StatusCode, details);
            throw new AuthException("Unable to send email at this time. Please try again later.", StatusCodes.Status503ServiceUnavailable);
        }

        _logger.LogInformation("SendGrid email sent to {To} with status {StatusCode}", to, response.StatusCode);
    }

    private async Task SendViaSmtpAsync(string to, string subject, string body)
    {
        var host = Environment.GetEnvironmentVariable("EMAIL_HOST");
        var portValue = Environment.GetEnvironmentVariable("EMAIL_PORT");
        var username = Environment.GetEnvironmentVariable("EMAIL_USER");
        var password = Environment.GetEnvironmentVariable("EMAIL_PASS");

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(portValue) || string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            _logger.LogError("SMTP configuration is incomplete. Host: {Host}, Port: {Port}, User: {User}", host, portValue, username);
            throw new AuthException("Email service is not configured.", StatusCodes.Status503ServiceUnavailable);
        }

        try
        {
            using var client = new SmtpClient(host, int.Parse(portValue))
            {
                Credentials = new NetworkCredential(username, password),
                EnableSsl = true
            };

            var mail = new MailMessage
            {
                From = new MailAddress(username),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };
            mail.To.Add(to);

            // Add plain-text alternate view for clients that block HTML
            var plain = AlternateView.CreateAlternateViewFromString(StripHtml(body), null, "text/plain");
            mail.AlternateViews.Add(plain);

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

    private static string StripHtml(string html)
    {
        if (string.IsNullOrWhiteSpace(html))
        {
            return string.Empty;
        }

        var array = new char[html.Length];
        var arrayIndex = 0;
        var inside = false;

        foreach (var ch in html)
        {
            switch (ch)
            {
                case '<':
                    inside = true;
                    continue;
                case '>':
                    inside = false;
                    continue;
                default:
                    if (!inside)
                    {
                        array[arrayIndex++] = ch;
                    }
                    break;
            }
        }

        return new string(array, 0, arrayIndex);
    }
}
