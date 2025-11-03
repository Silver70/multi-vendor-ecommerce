/**
 * Map country codes to locale strings for Intl API
 */
const COUNTRY_LOCALE_MAP: Record<string, string> = {
  US: "en-US",
  CA: "en-CA",
  GB: "en-GB",
  DE: "de-DE",
  FR: "fr-FR",
  IT: "it-IT",
  ES: "es-ES",
  AU: "en-AU",
  JP: "ja-JP",
  CN: "zh-CN",
  IN: "en-IN",
  MX: "es-MX",
  BR: "pt-BR",
  ZA: "en-ZA",
  SG: "en-SG",
  HK: "en-HK",
  NL: "nl-NL",
  BE: "nl-BE",
  CH: "de-CH",
  SE: "sv-SE",
  NO: "nb-NO",
  DK: "da-DK",
  FI: "fi-FI",
  PL: "pl-PL",
  CZ: "cs-CZ",
  AT: "de-AT",
};

/**
 * Country code to flag emoji map
 */
const COUNTRY_FLAG_MAP: Record<string, string> = {
  US: "🇺🇸",
  CA: "🇨🇦",
  GB: "🇬🇧",
  DE: "🇩🇪",
  FR: "🇫🇷",
  IT: "🇮🇹",
  ES: "🇪🇸",
  AU: "🇦🇺",
  JP: "🇯🇵",
  CN: "🇨🇳",
  IN: "🇮🇳",
  MX: "🇲🇽",
  BR: "🇧🇷",
  ZA: "🇿🇦",
  SG: "🇸🇬",
  HK: "🇭🇰",
  NL: "🇳🇱",
  BE: "🇧🇪",
  CH: "🇨🇭",
  SE: "🇸🇪",
  NO: "🇳🇴",
  DK: "🇩🇰",
  FI: "🇫🇮",
  PL: "🇵🇱",
  CZ: "🇨🇿",
  AT: "🇦🇹",
  IE: "🇮🇪",
  GR: "🇬🇷",
  PT: "🇵🇹",
  RU: "🇷🇺",
  TR: "🇹🇷",
  KR: "🇰🇷",
  TH: "🇹🇭",
  VN: "🇻🇳",
  PH: "🇵🇭",
  NZ: "🇳🇿",
};

/**
 * Country code to country name map
 */
const COUNTRY_NAME_MAP: Record<string, string> = {
  US: "United States",
  CA: "Canada",
  GB: "United Kingdom",
  DE: "Germany",
  FR: "France",
  IT: "Italy",
  ES: "Spain",
  AU: "Australia",
  JP: "Japan",
  CN: "China",
  IN: "India",
  MX: "Mexico",
  BR: "Brazil",
  ZA: "South Africa",
  SG: "Singapore",
  HK: "Hong Kong",
  NL: "Netherlands",
  BE: "Belgium",
  CH: "Switzerland",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  PL: "Poland",
  CZ: "Czech Republic",
  AT: "Austria",
  IE: "Ireland",
  GR: "Greece",
  PT: "Portugal",
  RU: "Russia",
  TR: "Turkey",
  KR: "South Korea",
  TH: "Thailand",
  VN: "Vietnam",
  PH: "Philippines",
  NZ: "New Zealand",
};

/**
 * Currency code to symbol map
 */
const CURRENCY_SYMBOL_MAP: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  INR: "₹",
  AUD: "A$",
  CAD: "C$",
  CHF: "CHF",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  PLN: "zł",
  CZK: "Kč",
  HUF: "Ft",
  RON: "lei",
  TRY: "₺",
  BRL: "R$",
  MXN: "$",
  ZAR: "R",
  SGD: "S$",
  HKD: "HK$",
  NZD: "NZ$",
  KRW: "₩",
  THB: "฿",
  MYR: "RM",
  PHP: "₱",
  VND: "₫",
  IDR: "Rp",
  BGN: "лв",
  HRK: "kn",
  RUB: "₽",
};

/**
 * Get locale from country code
 * @param countryCode ISO 3166-1 alpha-2 country code
 * @returns Locale string for Intl API
 */
export function getLocaleFromCountry(countryCode: string): string {
  return COUNTRY_LOCALE_MAP[countryCode] || "en-US";
}

/**
 * Get flag emoji for a country
 * @param countryCode ISO 3166-1 alpha-2 country code
 * @returns Flag emoji
 */
export function getCountryFlag(countryCode: string): string {
  return COUNTRY_FLAG_MAP[countryCode] || "";
}

/**
 * Get country name from code
 * @param countryCode ISO 3166-1 alpha-2 country code
 * @returns Country name
 */
export function getCountryName(countryCode: string): string {
  return COUNTRY_NAME_MAP[countryCode] || countryCode;
}

/**
 * Get currency symbol
 * @param currencyCode ISO 4217 currency code
 * @returns Currency symbol
 */
export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCY_SYMBOL_MAP[currencyCode] || currencyCode;
}

/**
 * Format price with currency
 * @param amount The amount to format
 * @param currencyCode ISO 4217 currency code
 * @param locale Optional locale string (defaults to en-US)
 * @returns Formatted price string
 */
export function formatPrice(
  amount: number,
  currencyCode: string,
  locale: string = "en-US"
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
    }).format(amount);
  } catch (error) {
    // Fallback if locale/currency is invalid
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol}${amount.toFixed(2)}`;
  }
}

/**
 * Format price with currency based on country code
 * @param amount The amount to format
 * @param currencyCode ISO 4217 currency code
 * @param countryCode ISO 3166-1 alpha-2 country code
 * @returns Formatted price string
 */
export function formatPriceByCountry(
  amount: number,
  currencyCode: string,
  countryCode: string
): string {
  const locale = getLocaleFromCountry(countryCode);
  return formatPrice(amount, currencyCode, locale);
}

/**
 * Format number as currency
 * @param amount The amount to format
 * @param currencyCode ISO 4217 currency code
 * @param showSymbol Whether to show currency symbol
 * @returns Formatted amount
 */
export function formatCurrency(
  amount: number,
  currencyCode: string,
  showSymbol: boolean = true
): string {
  if (showSymbol) {
    return formatPrice(amount, currencyCode);
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Parse currency string to number
 * @param currencyString The formatted currency string
 * @returns The parsed number
 */
export function parseCurrency(currencyString: string): number {
  // Remove currency symbols and spaces
  const cleaned = currencyString
    .replace(/[^0-9.,]/g, "")
    .replace(/,/g, "");
  return parseFloat(cleaned) || 0;
}

/**
 * Convert amount between currencies (basic rate lookup)
 * In production, this would call an external API
 * @param amount The amount to convert
 * @param fromCurrency Source currency code
 * @param toCurrency Target currency code
 * @returns Converted amount
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  // In a real app, this would fetch from an API like exchangerate-api.com
  // For now, return the original amount if currencies are the same
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Placeholder: in production, use real exchange rates
  console.warn(
    `Currency conversion from ${fromCurrency} to ${toCurrency} not implemented`
  );
  return amount;
}

/**
 * Get list of common currencies with their info
 * @returns Array of currency objects
 */
export function getCommonCurrencies() {
  return [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
    { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
    { code: "SEK", symbol: "kr", name: "Swedish Krona" },
    { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
    { code: "DKK", symbol: "kr", name: "Danish Krone" },
  ];
}

/**
 * Get list of common countries with their info
 * @returns Array of country objects
 */
export function getCommonCountries() {
  return [
    { code: "US", name: "United States", flag: "🇺🇸" },
    { code: "CA", name: "Canada", flag: "🇨🇦" },
    { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
    { code: "DE", name: "Germany", flag: "🇩🇪" },
    { code: "FR", name: "France", flag: "🇫🇷" },
    { code: "IT", name: "Italy", flag: "🇮🇹" },
    { code: "ES", name: "Spain", flag: "🇪🇸" },
    { code: "AU", name: "Australia", flag: "🇦🇺" },
    { code: "JP", name: "Japan", flag: "🇯🇵" },
    { code: "CN", name: "China", flag: "🇨🇳" },
    { code: "IN", name: "India", flag: "🇮🇳" },
    { code: "MX", name: "Mexico", flag: "🇲🇽" },
    { code: "BR", name: "Brazil", flag: "🇧🇷" },
    { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  ];
}

/**
 * Check if currency code is valid
 * @param currencyCode The currency code to check
 * @returns boolean
 */
export function isValidCurrency(currencyCode: string): boolean {
  try {
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Format amount for API submission (remove currency symbol)
 * @param amount The amount to format
 * @returns Number as string with 2 decimal places
 */
export function formatAmountForApi(amount: number): string {
  return (Math.round(amount * 100) / 100).toFixed(2);
}

/**
 * Round currency amount to 2 decimal places
 * @param amount The amount to round
 * @returns Rounded amount
 */
export function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}
