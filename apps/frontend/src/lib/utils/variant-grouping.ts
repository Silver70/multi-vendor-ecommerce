import { ProductVariant } from "~/types/product";

export interface VariantGroup {
  groupValue: string;
  groupAttribute: string;
  variants: ProductVariant[];
}

export interface GroupedVariants {
  groupAttribute: string;
  groups: VariantGroup[];
}

// For edit page variant inputs
export interface VariantInputWithIndex {
  index: number;
  variant: any; // VariantInput type
}

export interface EditPageVariantGroup {
  groupValue: string;
  groupAttribute: string;
  variantsWithIndices: VariantInputWithIndex[];
}

export interface EditPageGroupedVariants {
  groupAttribute: string;
  groups: EditPageVariantGroup[];
}

/**
 * Groups variants by their primary attribute (first attribute in the attributes object)
 * For example, if variants have attributes {Color: "Red", Size: "M"},
 * they will be grouped by Color
 */
export function groupVariantsByFirstAttribute(
  variants: ProductVariant[]
): GroupedVariants | null {
  if (!variants || variants.length === 0) {
    return null;
  }

  // Get the first attribute name from the first variant
  const firstVariant = variants[0];
  const attributeNames = Object.keys(firstVariant.attributes || {});

  if (attributeNames.length === 0) {
    return null;
  }

  const groupAttribute = attributeNames[0];

  // Group variants by the first attribute value
  const groupMap = new Map<string, ProductVariant[]>();

  variants.forEach((variant) => {
    const groupValue =
      variant.attributes?.[groupAttribute] || "Unknown";

    if (!groupMap.has(groupValue)) {
      groupMap.set(groupValue, []);
    }
    groupMap.get(groupValue)!.push(variant);
  });

  // Convert map to array of groups, maintaining insertion order
  const groups: VariantGroup[] = Array.from(groupMap.entries()).map(
    ([groupValue, variantsList]) => ({
      groupValue,
      groupAttribute,
      variants: variantsList,
    })
  );

  return {
    groupAttribute,
    groups,
  };
}

/**
 * Gets all unique attribute names from a set of variants
 * Useful for understanding the structure of variants
 */
export function getAttributeNames(variants: ProductVariant[]): string[] {
  const attributeSet = new Set<string>();

  variants.forEach((variant) => {
    Object.keys(variant.attributes || {}).forEach((attr) => {
      attributeSet.add(attr);
    });
  });

  return Array.from(attributeSet);
}

/**
 * Checks if variants have multiple attributes
 * Returns true if variants have more than one attribute dimension
 */
export function hasMultipleAttributes(variants: ProductVariant[]): boolean {
  if (!variants || variants.length === 0) {
    return false;
  }

  const attributeNames = getAttributeNames(variants);
  return attributeNames.length > 1;
}

/**
 * Groups variant inputs for the edit page while preserving array indices
 * This is critical because the edit page uses indices for update/delete operations
 *
 * Returns grouped variants with their original indices so:
 * - updateVariant(index, ...) still works
 * - removeVariant(index) removes the correct variant
 * - Form submission processes correct variants
 *
 * Example:
 * Input: [
 *   {index: 0, variant: {sku: "X-RED-S", attributes: {Color: "Red", Size: "S"}}},
 *   {index: 1, variant: {sku: "X-RED-M", attributes: {Color: "Red", Size: "M"}}},
 *   {index: 2, variant: {sku: "X-BLUE-S", attributes: {Color: "Blue", Size: "S"}}}
 * ]
 *
 * Output: Grouped by Color with original indices preserved
 */
export function groupEditPageVariants(
  variants: any[] // VariantInput[]
): EditPageGroupedVariants | null {
  if (!variants || variants.length === 0) {
    return null;
  }

  // Get the first attribute name from the first variant
  const firstVariant = variants[0];
  const attributeNames = Object.keys(firstVariant.attributes || {});

  if (attributeNames.length === 0) {
    return null;
  }

  const groupAttribute = attributeNames[0];

  // Group variants by the first attribute value, preserving indices
  const groupMap = new Map<string, VariantInputWithIndex[]>();

  variants.forEach((variant, index) => {
    const groupValue =
      variant.attributes?.[groupAttribute] || "Unknown";

    if (!groupMap.has(groupValue)) {
      groupMap.set(groupValue, []);
    }
    groupMap.get(groupValue)!.push({
      index,
      variant,
    });
  });

  // Convert map to array of groups, maintaining insertion order
  const groups: EditPageVariantGroup[] = Array.from(groupMap.entries()).map(
    ([groupValue, variantsWithIndices]) => ({
      groupValue,
      groupAttribute,
      variantsWithIndices,
    })
  );

  return {
    groupAttribute,
    groups,
  };
}
