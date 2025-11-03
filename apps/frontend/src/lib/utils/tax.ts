import { TaxBehavior, ChannelTaxRule } from "~/types/channel";

/**
 * Calculate total amount with tax
 * @param subtotal The subtotal amount
 * @param taxRate The tax rate as a decimal (0.07 for 7%)
 * @param taxBehavior Whether tax is inclusive or exclusive
 * @returns Object with taxAmount and total
 */
export function calculateTotalWithTax(
  subtotal: number,
  taxRate: number,
  taxBehavior: TaxBehavior
): { taxAmount: number; total: number } {
  if (taxBehavior === "exclusive") {
    // Tax is added on top
    const taxAmount = subtotal * taxRate;
    return {
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: Math.round((subtotal + taxAmount) * 100) / 100,
    };
  } else {
    // Tax is already included in price - show 0 or calculate backward
    return {
      taxAmount: 0,
      total: subtotal,
    };
  }
}

/**
 * Calculate tax amount for a given subtotal
 * @param subtotal The subtotal amount
 * @param taxRate The tax rate as a decimal
 * @param taxBehavior Whether tax is inclusive or exclusive
 * @returns Tax amount
 */
export function calculateTaxAmount(
  subtotal: number,
  taxRate: number,
  taxBehavior: TaxBehavior
): number {
  if (taxBehavior === "exclusive") {
    const taxAmount = subtotal * taxRate;
    return Math.round(taxAmount * 100) / 100;
  }
  return 0;
}

/**
 * Calculate order total including tax and shipping
 * @param subtotal The subtotal amount
 * @param taxRate The tax rate as a decimal
 * @param taxBehavior Whether tax is inclusive or exclusive
 * @param shippingAmount Optional shipping amount
 * @returns Object with breakdown
 */
export function calculateOrderTotal(
  subtotal: number,
  taxRate: number,
  taxBehavior: TaxBehavior,
  shippingAmount: number = 0
): {
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  total: number;
} {
  const taxAmount = calculateTaxAmount(subtotal, taxRate, taxBehavior);
  const total = subtotal + taxAmount + shippingAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    shippingAmount: Math.round(shippingAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Check if the tax behavior is inclusive
 * @param taxBehavior The tax behavior
 * @returns boolean
 */
export function isTaxInclusive(taxBehavior: TaxBehavior): boolean {
  return taxBehavior === "inclusive";
}

/**
 * Get tax behavior label
 * @param taxBehavior The tax behavior
 * @returns Human readable label
 */
export function getTaxBehaviorLabel(taxBehavior: TaxBehavior): string {
  return taxBehavior === "inclusive"
    ? "Tax included in price"
    : "Tax added to total";
}

/**
 * Get tax behavior description
 * @param taxBehavior The tax behavior
 * @returns Description of tax behavior
 */
export function getTaxBehaviorDescription(taxBehavior: TaxBehavior): string {
  if (taxBehavior === "inclusive") {
    return "The displayed price already includes taxes";
  }
  return "Taxes will be calculated and added at checkout";
}

/**
 * Format tax rate as percentage
 * @param rate The tax rate as a decimal
 * @returns Formatted percentage string
 */
export function formatTaxRate(rate: number): string {
  return `${Math.round(rate * 10000) / 100}%`;
}

/**
 * Determine if a tax rule applies
 * @param rule The tax rule
 * @param isB2B Whether the order is B2B
 * @param orderAmount The order amount
 * @param currentDate The current date
 * @returns boolean indicating if rule applies
 */
export function doesTaxRuleApply(
  rule: ChannelTaxRule,
  isB2B: boolean,
  orderAmount: number,
  currentDate: Date = new Date()
): boolean {
  // Check active status
  if (!rule.isActive) return false;

  // Check date range
  if (rule.startDate && new Date(rule.startDate) > currentDate) return false;
  if (rule.endDate && new Date(rule.endDate) < currentDate) return false;

  // Check B2B/B2C applicability
  if (isB2B && !rule.applyToB2B) return false;
  if (!isB2B && !rule.applyToB2C) return false;

  // Check minimum order amount
  if (rule.minimumOrderAmount && orderAmount < rule.minimumOrderAmount)
    return false;

  return true;
}

/**
 * Calculate effective tax rate for display
 * For inclusive tax, calculate backward to show tax component
 * @param subtotal The subtotal amount (usually without tax)
 * @param taxRate The tax rate
 * @param taxBehavior The tax behavior
 * @returns Effective tax rate for display
 */
export function getEffectiveTaxRate(
  subtotal: number,
  taxRate: number,
  taxBehavior: TaxBehavior
): number {
  if (taxBehavior === "exclusive") {
    return taxRate;
  }
  // For inclusive, the effective rate on the subtotal is lower
  // E.g., 19% VAT inclusive on €100 = €19/€100 = 19%
  // But if we need to show it as if it were on gross: €19 / €119 ≈ 16%
  return taxRate / (1 + taxRate);
}

/**
 * Extract tax component from inclusive price
 * @param price The price (inclusive of tax)
 * @param taxRate The tax rate
 * @returns Tax amount and net amount
 */
export function extractTaxFromInclusivePrice(
  price: number,
  taxRate: number
): { tax: number; net: number } {
  const taxComponent = (price * taxRate) / (1 + taxRate);
  const net = price - taxComponent;

  return {
    tax: Math.round(taxComponent * 100) / 100,
    net: Math.round(net * 100) / 100,
  };
}

/**
 * Add tax to exclusive price
 * @param price The base price (exclusive of tax)
 * @param taxRate The tax rate
 * @returns Tax amount and gross amount
 */
export function addTaxToExclusivePrice(
  price: number,
  taxRate: number
): { tax: number; gross: number } {
  const tax = price * taxRate;
  const gross = price + tax;

  return {
    tax: Math.round(tax * 100) / 100,
    gross: Math.round(gross * 100) / 100,
  };
}

/**
 * Check if tax rule has category filter
 * @param rule The tax rule
 * @returns boolean
 */
export function hasCategoryFilter(rule: ChannelTaxRule): boolean {
  return !!rule.categoryId;
}

/**
 * Check if tax rule has regional filter
 * @param rule The tax rule
 * @returns boolean
 */
export function hasRegionalFilter(rule: ChannelTaxRule): boolean {
  return !!(rule.applicableCountryCode || rule.applicableRegionCode);
}

/**
 * Check if tax rule has B2B restriction
 * @param rule The tax rule
 * @returns boolean
 */
export function hasB2BRestriction(rule: ChannelTaxRule): boolean {
  return rule.applyToB2B !== rule.applyToB2C;
}
