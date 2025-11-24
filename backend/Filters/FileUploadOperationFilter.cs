using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace backend.Filters;

public class FileUploadOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        // Check if action has [Consumes("multipart/form-data")]
        var consumesAttribute = context.MethodInfo
            .GetCustomAttributes(true)
            .Union(context.MethodInfo.DeclaringType.GetCustomAttributes(true))
            .OfType<ConsumesAttribute>()
            .FirstOrDefault(attr => attr.ContentTypes.Contains("multipart/form-data"));

        if (consumesAttribute == null)
            return;

        // Find IFormFile parameters
        var formFileParameters = context.ApiDescription.ParameterDescriptions
            .Where(p => p.ModelMetadata?.ModelType == typeof(IFormFile) ||
                       (p.ModelMetadata?.ModelType != null && 
                        p.ModelMetadata.ModelType.IsAssignableTo(typeof(IFormFile))))
            .ToList();

        if (!formFileParameters.Any())
            return;

        // Clear existing parameters
        operation.Parameters.Clear();

        // Set request body for file upload
        operation.RequestBody = new OpenApiRequestBody
        {
            Required = true,
            Content = new Dictionary<string, OpenApiMediaType>
            {
                ["multipart/form-data"] = new OpenApiMediaType
                {
                    Schema = new OpenApiSchema
                    {
                        Type = "object",
                        Properties = formFileParameters.ToDictionary(
                            p => p.Name,
                            p => new OpenApiSchema
                            {
                                Type = "string",
                                Format = "binary"
                            }
                        ),
                        Required = formFileParameters
                            .Where(p => p.IsRequired)
                            .Select(p => p.Name)
                            .ToHashSet()
                    }
                }
            }
        };
    }
}
