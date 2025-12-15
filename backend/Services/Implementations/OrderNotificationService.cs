using backend.Data;
using backend.Enums;
using backend.Models;using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Net;
using System.Net.Mail;

using backend.Services.Interfaces;

namespace backend.Services.Implementations;

public class OrderNotificationService : IOrderNotificationService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly ILogger<OrderNotificationService> _logger;
    private readonly IEmailService _emailService;

    public OrderNotificationService(
        AppDbContext db, 
        IConfiguration configuration,
        ILogger<OrderNotificationService> logger,
        IEmailService emailService)
    {
        _db = db;
        _configuration = configuration;
        _logger = logger;
        _emailService = emailService;
    }

    public async Task SendOrderNotificationsAsync(Guid orderId)
    {
        try
        {
            var order = await _db.Orders
                .Include(o => o.CreatedByUser)
                    .ThenInclude(u => u!.ManagerUser) // Include user's manager
                .Include(o => o.CreatedByUser)
                    .ThenInclude(u => u!.DepartmentShop) // Include user's department
                .Include(o => o.ShippingDepartment)
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null)
            {
                _logger.LogWarning($"Order {orderId} not found for notification");
                return;
            }

            // Send notifications sequentially to avoid DbContext concurrency issues
            await SendUserNotificationAsync(order); // Send to user who created order
            await SendUserManagerNotificationAsync(order); // Send to user's manager (optional)
            await SendDepartmentWorkersNotificationAsync(order); // Send to all shipping point workers
        }
        catch (Exception ex)
        {
            // Log but don't throw - notification failures should not block order creation
            _logger.LogError(ex, $"Error sending notifications for order {orderId}");
        }
    }

    private async Task SendUserNotificationAsync(Order order)
    {
        try
        {
            var userEmail = order.CreatedByUser?.Email;

            if (string.IsNullOrWhiteSpace(userEmail))
            {
                _logger.LogWarning($"No user email found for order {order.OrderNumber}");
                await LogNotificationAsync(order.Id, NotificationRecipientType.Customer, 
                    userEmail ?? string.Empty, false, "No email address found");
                return;
            }

            var subject = $"Підтвердження замовлення #{order.OrderNumber}";
            var body = GenerateCustomerEmailBody(order);

            await SendEmailAsync(userEmail, subject, body);
            await LogNotificationAsync(order.Id, NotificationRecipientType.Customer, 
                userEmail, true, null);

            _logger.LogInformation($"User notification sent for order {order.OrderNumber} to {userEmail}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Failed to send user notification for order {order.OrderNumber}");
            await LogNotificationAsync(order.Id, NotificationRecipientType.Customer, 
                order.CreatedByUser?.Email ?? string.Empty, false, ex.Message);
        }
    }

    private async Task SendUserManagerNotificationAsync(Order order)
    {
        try
        {
            var userManager = order.CreatedByUser?.ManagerUser;
            
            // If user has no manager, skip this notification (not an error)
            if (userManager == null || string.IsNullOrWhiteSpace(userManager.Email))
            {
                _logger.LogInformation($"User has no manager assigned for order {order.OrderNumber}, skipping manager notification");
                return;
            }

            var subject = $"Нове замовлення #{order.OrderNumber} від співробітника";
            var body = GenerateManagerEmailBody(order);

            await SendEmailAsync(userManager.Email, subject, body);
            await LogNotificationAsync(order.Id, NotificationRecipientType.Manager, 
                userManager.Email, true, null);

            _logger.LogInformation($"User manager notification sent for order {order.OrderNumber} to {userManager.Email}");
        }
        catch (Exception ex)
        {
            // Manager notification failure should not block other notifications
            _logger.LogWarning(ex, $"Failed to send user manager notification for order {order.OrderNumber} (non-critical)");
        }
    }

    private async Task SendDepartmentWorkersNotificationAsync(Order order)
    {
        try
        {
            var shippingDepartmentId = order.ShippingDepartmentId
                ?? order.CreatedByUser?.DefaultBranchId
                ?? order.CreatedByUser?.DepartmentShopId;

            if (shippingDepartmentId == null)
            {
                _logger.LogWarning($"No shipping department assigned for order {order.OrderNumber}");
                return;
            }

            // Get all workers (users) assigned to the same shipping point (branch)
            var departmentWorkers = await _db.Users
                .Where(u => u.DefaultBranchId == shippingDepartmentId &&
                           !string.IsNullOrWhiteSpace(u.Email) &&
                           u.IsConfirmed &&
                           u.Roles != null && u.Roles.Contains(3))
                .ToListAsync();

            if (!departmentWorkers.Any())
            {
                _logger.LogWarning($"No workers found for shipping department {shippingDepartmentId} for order {order.OrderNumber}");
                return;
            }

            var subject = $"Нове замовлення #{order.OrderNumber} для обробки";
            var body = GenerateShippingPointEmailBody(order);

            // Send email to each worker in the department
            foreach (var worker in departmentWorkers)
            {
                try
                {
                    await SendEmailAsync(worker.Email, subject, body);
                    await LogNotificationAsync(order.Id, NotificationRecipientType.ShippingPoint, 
                        worker.Email, true, null);
                    
                    _logger.LogInformation($"Department worker notification sent for order {order.OrderNumber} to {worker.Email}");
                }
                catch (Exception workerEx)
                {
                    _logger.LogError(workerEx, $"Failed to send notification to worker {worker.Email} for order {order.OrderNumber}");
                    await LogNotificationAsync(order.Id, NotificationRecipientType.ShippingPoint, 
                        worker.Email, false, workerEx.Message);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Failed to send department workers notification for order {order.OrderNumber}");
        }
    }

    private async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        // Delegate to shared email service (supports SendGrid or SMTP via env/config)
        await _emailService.SendAsync(toEmail, subject, body);
    }

    private string GenerateCustomerEmailBody(Order order)
    {
        var itemsHtml = string.Join("", order.Items.Select(item => $@"
            <tr>
                <td style='padding: 10px; border-bottom: 1px solid #eee;'>{item.ProductCodeSnapshot}</td>
                <td style='padding: 10px; border-bottom: 1px solid #eee;'>{item.ProductNameSnapshot}</td>
                <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: right;'>{item.Quantity:F2}</td>
                <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: right;'>{item.PriceWithDiscountSnapshot:F2} грн</td>
                <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: right;'>{item.LineTotal:F2} грн</td>
            </tr>
        "));

        return $@"
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        </head>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;'>
            <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;'>
                <h1 style='color: white; margin: 0;'>Дякуємо за замовлення!</h1>
            </div>
            
            <div style='background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;'>
                <p>Вітаємо!</p>
                <p>Ваше замовлення <strong>#{order.OrderNumber}</strong> успішно прийнято та передано в обробку.</p>
                
                <div style='background: white; padding: 20px; border-radius: 8px; margin: 20px 0;'>
                    <h2 style='color: #667eea; margin-top: 0;'>Деталі замовлення</h2>
                    <p><strong>Дата:</strong> {order.CreatedAt:dd.MM.yyyy HH:mm}</p>
                    <p><strong>Тип замовлення:</strong> {order.OrderType}</p>
                    <p><strong>Форма оплати:</strong> {order.PaymentMethod}</p>
                    {(!string.IsNullOrWhiteSpace(order.Comment) ? $"<p><strong>Коментар:</strong> {order.Comment}</p>" : "")}
                </div>

                <h3>Склад замовлення:</h3>
                <table style='width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;'>
                    <thead>
                        <tr style='background: #667eea; color: white;'>
                            <th style='padding: 10px; text-align: left;'>Код</th>
                            <th style='padding: 10px; text-align: left;'>Найменування</th>
                            <th style='padding: 10px; text-align: right;'>К-сть</th>
                            <th style='padding: 10px; text-align: right;'>Ціна</th>
                            <th style='padding: 10px; text-align: right;'>Сума</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itemsHtml}
                    </tbody>
                    <tfoot>
                        <tr style='background: #f0f0f0; font-weight: bold;'>
                            <td colspan='4' style='padding: 15px; text-align: right;'>Загальна вартість:</td>
                            <td style='padding: 15px; text-align: right; color: #667eea; font-size: 1.2em;'>{order.TotalDiscountedPrice:F2} грн</td>
                        </tr>
                    </tfoot>
                </table>

                <div style='margin-top: 30px; padding: 20px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;'>
                    <p style='margin: 0;'><strong>Увага!</strong> Ми зв'яжемося з вами найближчим часом для підтвердження деталей доставки.</p>
                </div>

                <p style='margin-top: 30px; color: #666;'>З повагою,<br>Команда Mixon B2B</p>
            </div>
        </body>
        </html>
        ";
    }

    private string GenerateManagerEmailBody(Order order)
    {
        return $@"
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
        </head>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                <h2 style='color: #2c5aa0;'>Нове замовлення від клієнта</h2>
                
                <div style='background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;'>
                    <h3>Інформація про замовлення</h3>
                    <p><strong>Номер замовлення:</strong> {order.OrderNumber}</p>
                    <p><strong>Дата:</strong> {order.CreatedAt:dd.MM.yyyy HH:mm}</p>
                    <p><strong>Клієнт:</strong> {order.CreatedByUser?.Company ?? "N/A"}</p>
                    <p><strong>Співробітник:</strong> {order.CreatedByUser?.FirstName} {order.CreatedByUser?.LastName}</p>
                    <p><strong>Тип замовлення:</strong> {order.OrderType}</p>
                    <p><strong>Форма оплати:</strong> {order.PaymentMethod}</p>
                    <p><strong>Загальна сума:</strong> {order.TotalDiscountedPrice:F2} грн</p>
                    <p><strong>Кількість позицій:</strong> {order.Items.Count}</p>
                    {(!string.IsNullOrWhiteSpace(order.Comment) ? $"<p><strong>Коментар клієнта:</strong> {order.Comment}</p>" : "")}
                </div>

                <p style='color: #666;'>Будь ласка, зв'яжіться з клієнтом для уточнення деталей доставки.</p>
                
                <hr style='border: none; border-top: 1px solid #ddd; margin: 30px 0;'>
                <p style='color: #999; font-size: 0.9em;'>Це автоматичне повідомлення від системи Mixon B2B</p>
            </div>
        </body>
        </html>
        ";
    }

    private string GenerateShippingPointEmailBody(Order order)
    {
        var itemsHtml = string.Join("", order.Items.Select(item => $@"
            <tr>
                <td style='padding: 8px; border-bottom: 1px solid #ddd;'>{item.ProductCodeSnapshot}</td>
                <td style='padding: 8px; border-bottom: 1px solid #ddd;'>{item.ProductNameSnapshot}</td>
                <td style='padding: 8px; border-bottom: 1px solid #ddd; text-align: right;'>{item.Quantity:F2}</td>
                <td style='padding: 8px; border-bottom: 1px solid #ddd; text-align: right;'>{item.WeightSnapshot * item.Quantity:F3} кг</td>
                <td style='padding: 8px; border-bottom: 1px solid #ddd; text-align: right;'>{item.VolumeSnapshot * item.Quantity:F3} м³</td>
            </tr>
        "));

        return $@"
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
        </head>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                <h2 style='color: #d9534f;'>Нове замовлення для обробки</h2>
                
                <div style='background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;'>
                    <p style='margin: 0;'><strong>Увага!</strong> Замовлення потребує підготовки до відправки.</p>
                </div>

                <div style='background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;'>
                    <h3>Деталі замовлення</h3>
                    <p><strong>Номер:</strong> {order.OrderNumber}</p>
                    <p><strong>Дата:</strong> {order.CreatedAt:dd.MM.yyyy HH:mm}</p>
                    <p><strong>Клієнт:</strong> {order.CreatedByUser?.Company ?? "N/A"}</p>
                    <p><strong>Співробітник:</strong> {order.CreatedByUser?.FirstName} {order.CreatedByUser?.LastName}</p>
                    <p><strong>Email:</strong> {order.CreatedByUser?.Email}</p>
                    <p><strong>Тип:</strong> {order.OrderType}</p>
                    <p><strong>Загальна вага:</strong> {order.TotalWeight:F3} кг</p>
                    <p><strong>Загальний об'єм:</strong> {order.TotalVolume:F3} м³</p>
                </div>

                <h3>Товари до відправки:</h3>
                <table style='width: 100%; border-collapse: collapse; background: white;'>
                    <thead>
                        <tr style='background: #f0f0f0;'>
                            <th style='padding: 10px; text-align: left; border-bottom: 2px solid #ddd;'>Код</th>
                            <th style='padding: 10px; text-align: left; border-bottom: 2px solid #ddd;'>Найменування</th>
                            <th style='padding: 10px; text-align: right; border-bottom: 2px solid #ddd;'>К-сть</th>
                            <th style='padding: 10px; text-align: right; border-bottom: 2px solid #ddd;'>Вага</th>
                            <th style='padding: 10px; text-align: right; border-bottom: 2px solid #ddd;'>Об'єм</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itemsHtml}
                    </tbody>
                </table>

                <hr style='border: none; border-top: 1px solid #ddd; margin: 30px 0;'>
                <p style='color: #999; font-size: 0.9em;'>Це автоматичне повідомлення від системи Mixon B2B</p>
            </div>
        </body>
        </html>
        ";
    }

    private async Task LogNotificationAsync(
        Guid orderId, 
        NotificationRecipientType recipientType, 
        string recipientEmail, 
        bool success, 
        string? errorMessage)
    {
        var log = new OrderNotificationLog
        {
            OrderId = orderId,
            RecipientType = recipientType,
            RecipientEmail = recipientEmail,
            SentAt = DateTime.UtcNow,
            Success = success,
            ErrorMessage = errorMessage
        };

        _db.OrderNotificationLogs.Add(log);
        await _db.SaveChangesAsync();
    }
}

