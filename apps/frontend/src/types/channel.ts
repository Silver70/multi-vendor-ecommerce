// ============================================================================
// Channel Types
// ============================================================================

export type TaxBehavior = "inclusive" | "exclusive";

export interface Channel {
  id: string;
  name: string;
  type: string;
  description?: string;
  isActive: boolean;
  countryCode: string;
  regionCode?: string;
  currencyCode: string;
  isB2B: boolean;
  defaultTaxRate: number;
  taxBehavior: TaxBehavior;
  taxIdentificationNumber?: string;
  externalId?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Tax Rule Types
// ============================================================================

export interface ChannelTaxRule {
  id: string;
  channelId: string;
  name: string;
  description?: string;
  taxRate: number;
  categoryId?: string;
  applicableCountryCode?: string;
  applicableRegionCode?: string;
  applyToB2B: boolean;
  applyToB2C: boolean;
  minimumOrderAmount?: number;
  taxBehavior: TaxBehavior;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaxCalculation {
  taxAmount: number;
  taxRate: number;
  ruleName?: string;
}

// ============================================================================
// Channel Product Types
// ============================================================================

export interface ChannelProduct {
  id: string;
  channelId: string;
  productId: string;
  channelName?: string;
  channelDescription?: string;
  channelPrice?: number;
  isActive: boolean;
  externalProductId?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Channel Vendor Types
// ============================================================================

export interface ChannelVendor {
  id: string;
  channelId: string;
  vendorId: string;
  isActive: boolean;
  externalVendorId?: string;
  createdAt: string;
}

// ============================================================================
// Create/Update DTOs
// ============================================================================

export interface CreateChannelDto {
  name: string;
  type: string;
  description?: string;
  isActive?: boolean;
  externalId?: string;
  countryCode: string;
  regionCode?: string;
  currencyCode: string;
  isB2B?: boolean;
  taxIdentificationNumber?: string;
  defaultTaxRate?: number;
  taxBehavior?: TaxBehavior;
}

export interface UpdateChannelDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  externalId?: string;
  countryCode?: string;
  regionCode?: string;
  currencyCode?: string;
  isB2B?: boolean;
  taxIdentificationNumber?: string;
  defaultTaxRate?: number;
  taxBehavior?: TaxBehavior;
}

export interface CreateChannelTaxRuleDto {
  name: string;
  description?: string;
  taxRate: number;
  categoryId?: string;
  applicableCountryCode?: string;
  applicableRegionCode?: string;
  applyToB2B?: boolean;
  applyToB2C?: boolean;
  minimumOrderAmount?: number;
  taxBehavior?: TaxBehavior;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface UpdateChannelTaxRuleDto {
  name?: string;
  description?: string;
  taxRate?: number;
  categoryId?: string;
  applicableCountryCode?: string;
  applicableRegionCode?: string;
  applyToB2B?: boolean;
  applyToB2C?: boolean;
  minimumOrderAmount?: number;
  taxBehavior?: TaxBehavior;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface CreateChannelProductDto {
  productId: string;
  channelName?: string;
  channelDescription?: string;
  channelPrice?: number;
  isActive?: boolean;
  externalProductId?: string;
}

export interface UpdateChannelProductDto {
  channelName?: string;
  channelDescription?: string;
  channelPrice?: number;
  isActive?: boolean;
  externalProductId?: string;
}

export interface CreateChannelVendorDto {
  vendorId: string;
  isActive?: boolean;
  externalVendorId?: string;
}
