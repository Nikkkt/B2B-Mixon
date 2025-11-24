namespace backend.Services.Interfaces;

public interface IOrderNotificationService
{
    Task SendOrderNotificationsAsync(Guid orderId);
}
