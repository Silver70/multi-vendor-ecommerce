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
