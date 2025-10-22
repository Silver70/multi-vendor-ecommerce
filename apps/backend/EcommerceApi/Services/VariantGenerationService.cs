using EcommerceApi.Data;
using EcommerceApi.DTOs.Product;
using EcommerceApi.Models;
using Microsoft.EntityFrameworkCore;

namespace EcommerceApi.Services
{
    public class VariantGenerationService
    {
        private readonly AppDbContext _context;

        public VariantGenerationService(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Generate SKU from product name and attribute values
        /// Format: PRODUCTNAME-VALUE1-VALUE2
        /// </summary>
        public string GenerateSku(string productName, Dictionary<string, string> attributes)
        {
            var skuParts = new List<string> { NormalizeSku(productName) };

            foreach (var value in attributes.Values)
            {
                skuParts.Add(NormalizeSku(value));
            }

            return string.Join("-", skuParts).ToUpper();
        }

        private string NormalizeSku(string input)
        {
            // Remove special characters and replace spaces with hyphens
            return new string(input
                .Replace(" ", "-")
                .Where(c => char.IsLetterOrDigit(c) || c == '-')
                .ToArray())
                .Trim('-');
        }

        /// <summary>
        /// Process attributes and create/retrieve ProductAttribute and ProductAttributeValue entities
        /// Returns mapping of attribute name + value to ProductAttributeValue ID
        /// </summary>
        public async Task<Dictionary<string, Guid>> ProcessAttributesAsync(List<ProductAttributeInputDto> attributesInput)
        {
            var attributeValueMap = new Dictionary<string, Guid>(); // Key: "AttributeName:Value", Value: AttributeValueId

            foreach (var attrInput in attributesInput)
            {
                // Check if attribute exists in global pool (without loading all values yet)
                var existingAttribute = await _context.ProductAttributes
                    .FirstOrDefaultAsync(a => a.Name.ToLower() == attrInput.Name.ToLower());

                ProductAttribute attribute;

                if (existingAttribute != null)
                {
                    // Use existing global attribute
                    attribute = existingAttribute;
                }
                else
                {
                    // Create new custom attribute
                    attribute = new ProductAttribute
                    {
                        Id = Guid.NewGuid(),
                        Name = attrInput.Name,
                        Values = new List<ProductAttributeValue>()
                    };
                    _context.ProductAttributes.Add(attribute);
                    await _context.SaveChangesAsync();
                }

                // Process values
                foreach (var valueStr in attrInput.Values)
                {
                    // Check if value exists for this attribute
                    var existingValue = await _context.ProductAttributeValues
                        .FirstOrDefaultAsync(v => v.AttributeId == attribute.Id && v.Value.ToLower() == valueStr.ToLower());

                    Guid valueId;

                    if (existingValue != null)
                    {
                        valueId = existingValue.Id;
                    }
                    else
                    {
                        // Create new value
                        var newValue = new ProductAttributeValue
                        {
                            Id = Guid.NewGuid(),
                            AttributeId = attribute.Id,
                            Value = valueStr
                        };
                        _context.ProductAttributeValues.Add(newValue);
                        await _context.SaveChangesAsync();
                        valueId = newValue.Id;
                    }

                    var key = $"{attrInput.Name}:{valueStr}";
                    attributeValueMap[key] = valueId;
                }
            }

            return attributeValueMap;
        }

        /// <summary>
        /// Create variants with their attribute relationships
        /// </summary>
        public async Task<List<ProductVariant>> CreateVariantsAsync(
            Guid productId,
            string productName,
            List<VariantInputDto> variantsInput,
            Dictionary<string, Guid> attributeValueMap)
        {
            var variants = new List<ProductVariant>();

            foreach (var variantInput in variantsInput)
            {
                // Generate SKU if not provided
                var sku = string.IsNullOrWhiteSpace(variantInput.Sku)
                    ? GenerateSku(productName, variantInput.Attributes)
                    : variantInput.Sku;

                // Check if SKU already exists
                var skuExists = await _context.ProductVariants.AnyAsync(v => v.Sku == sku);
                if (skuExists)
                {
                    throw new InvalidOperationException($"SKU '{sku}' already exists");
                }

                var variant = new ProductVariant
                {
                    Id = Guid.NewGuid(),
                    ProductId = productId,
                    Sku = sku,
                    Price = variantInput.Price,
                    Stock = variantInput.Stock,
                    CreatedAt = DateTime.UtcNow,
                    VariantAttributes = new List<VariantAttributeValue>()
                };

                // Create VariantAttributeValue relationships
                foreach (var attr in variantInput.Attributes)
                {
                    var key = $"{attr.Key}:{attr.Value}";

                    if (!attributeValueMap.TryGetValue(key, out var attributeValueId))
                    {
                        throw new InvalidOperationException(
                            $"Attribute '{attr.Key}' with value '{attr.Value}' was not found in the processed attributes");
                    }

                    variant.VariantAttributes.Add(new VariantAttributeValue
                    {
                        Id = Guid.NewGuid(),
                        VariantId = variant.Id,
                        AttributeValueId = attributeValueId
                    });
                }

                variants.Add(variant);
            }

            _context.ProductVariants.AddRange(variants);
            await _context.SaveChangesAsync();

            return variants;
        }

        /// <summary>
        /// Load variant attributes as dictionary for DTO mapping
        /// </summary>
        public async Task<Dictionary<string, string>> LoadVariantAttributesAsync(Guid variantId)
        {
            var attributes = await _context.VariantAttributeValues
                .Where(va => va.VariantId == variantId)
                .Include(va => va.AttributeValue)
                .ThenInclude(av => av.Attribute)
                .Select(va => new
                {
                    Name = va.AttributeValue.Attribute.Name,
                    Value = va.AttributeValue.Value
                })
                .ToListAsync();

            return attributes.ToDictionary(a => a.Name, a => a.Value);
        }

        /// <summary>
        /// Delete all variants and their custom attributes for a product
        /// </summary>
        public async Task DeleteProductVariantsAsync(Guid productId)
        {
            // First, identify custom attributes before deleting variants
            await DeleteProductCustomAttributesAsync(productId);

            // Get all variant IDs for this product
            var variantIds = await _context.ProductVariants
                .Where(v => v.ProductId == productId)
                .Select(v => v.Id)
                .ToListAsync();

            if (variantIds.Count == 0)
            {
                return;
            }

            // Delete VariantAttributeValue records first (they reference variants)
            var variantAttributeValues = await _context.VariantAttributeValues
                .Where(vav => variantIds.Contains(vav.VariantId))
                .ToListAsync();

            _context.VariantAttributeValues.RemoveRange(variantAttributeValues);
            await _context.SaveChangesAsync();

            // Now delete the variants themselves
            var variants = await _context.ProductVariants
                .Where(v => v.ProductId == productId)
                .ToListAsync();

            _context.ProductVariants.RemoveRange(variants);
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Delete custom attributes that are only used by this product
        /// A custom attribute is one that is only referenced by variants of this product
        /// </summary>
        private async Task DeleteProductCustomAttributesAsync(Guid productId)
        {
            // Get all ProductAttributeValue IDs that are used by this product's variants
            var attributeValueIdsUsedByProduct = await _context.VariantAttributeValues
                .Where(vav => vav.Variant.ProductId == productId)
                .Select(vav => vav.AttributeValueId)
                .Distinct()
                .ToListAsync();

            if (attributeValueIdsUsedByProduct.Count == 0)
            {
                return;
            }

            // Get the unique AttributeIds from these values
            var attributeIdsUsedByProduct = await _context.ProductAttributeValues
                .Where(pav => attributeValueIdsUsedByProduct.Contains(pav.Id))
                .Select(pav => pav.AttributeId)
                .Distinct()
                .ToListAsync();

            if (attributeIdsUsedByProduct.Count == 0)
            {
                return;
            }

            // For each attribute, check if it's used by other products
            foreach (var attributeId in attributeIdsUsedByProduct)
            {
                // Count how many other products use this attribute
                var usedByOtherProducts = await _context.VariantAttributeValues
                    .Where(vav => vav.AttributeValue.AttributeId == attributeId &&
                                  vav.Variant.ProductId != productId)
                    .AnyAsync();

                // If not used by other products, it's a custom attribute - delete it
                if (!usedByOtherProducts)
                {
                    var attributeToDelete = await _context.ProductAttributes
                        .Include(a => a.Values)
                        .FirstOrDefaultAsync(a => a.Id == attributeId);

                    if (attributeToDelete != null)
                    {
                        _context.ProductAttributes.Remove(attributeToDelete);
                    }
                }
            }

            await _context.SaveChangesAsync();
        }
    }
}
