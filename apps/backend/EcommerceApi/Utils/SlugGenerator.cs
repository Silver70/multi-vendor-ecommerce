using System.Text;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using EcommerceApi.Data;

namespace EcommerceApi.Utils
{
    public class SlugGenerator
    {
        private readonly AppDbContext _context;

        public SlugGenerator(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Generates a unique slug for a product based on category, vendor, and product name
        /// </summary>
        public async Task<string> GenerateUniqueSlugAsync(string productName, string? categoryName, string? vendorName)
        {
            // Build the base slug components
            var slugParts = new List<string>();

            if (!string.IsNullOrWhiteSpace(categoryName))
            {
                slugParts.Add(ToSlugPart(categoryName));
            }

            if (!string.IsNullOrWhiteSpace(vendorName))
            {
                slugParts.Add(ToSlugPart(vendorName));
            }

            slugParts.Add(ToSlugPart(productName));

            var baseSlug = string.Join("-", slugParts);

            // Check if slug is unique
            var slug = baseSlug;
            var counter = 2;

            while (await _context.Products.AnyAsync(p => p.Slug == slug))
            {
                slug = $"{baseSlug}-{counter}";
                counter++;
            }

            return slug;
        }

        /// <summary>
        /// Converts a string into a URL-friendly slug part
        /// </summary>
        private static string ToSlugPart(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return string.Empty;

            // Convert to lowercase
            text = text.ToLowerInvariant();

            // Remove accents and special characters
            text = RemoveAccents(text);

            // Replace spaces and invalid characters with hyphens
            text = Regex.Replace(text, @"[^a-z0-9\s-]", "");
            text = Regex.Replace(text, @"\s+", "-");
            text = Regex.Replace(text, @"-+", "-");

            // Trim hyphens from start and end
            text = text.Trim('-');

            // Limit length to reasonable size (50 chars per part)
            if (text.Length > 50)
            {
                text = text.Substring(0, 50).Trim('-');
            }

            return text;
        }

        /// <summary>
        /// Removes accents from characters
        /// </summary>
        private static string RemoveAccents(string text)
        {
            var normalizedString = text.Normalize(NormalizationForm.FormD);
            var stringBuilder = new StringBuilder();

            foreach (var c in normalizedString)
            {
                var unicodeCategory = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c);
                if (unicodeCategory != System.Globalization.UnicodeCategory.NonSpacingMark)
                {
                    stringBuilder.Append(c);
                }
            }

            return stringBuilder.ToString().Normalize(NormalizationForm.FormC);
        }
    }
}
