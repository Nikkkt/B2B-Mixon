using Microsoft.AspNetCore.Http;

namespace backend.Exceptions;

public class AuthException : Exception
{
    public int StatusCode { get; }

    public AuthException(string message, int statusCode = StatusCodes.Status400BadRequest)
        : base(message)
    {
        StatusCode = statusCode;
    }
}
