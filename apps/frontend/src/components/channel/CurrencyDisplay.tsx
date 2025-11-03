import {
  formatPrice,
  formatPriceByCountry,
  getCurrencySymbol,
} from "~/lib/utils/currency";

interface CurrencyDisplayProps {
  amount: number;
  currencyCode: string;
  countryCode?: string;
  showSymbol?: boolean;
  showCode?: boolean;
  locale?: string;
  className?: string;
  variant?: "default" | "compact" | "minimal";
  tooltip?: string;
}

/**
 * Format and display a price with currency formatting
 */
export function CurrencyDisplay({
  amount,
  currencyCode,
  countryCode,
  showSymbol = true,
  showCode = false,
  locale,
  className = "",
  variant = "default",
  tooltip,
}: CurrencyDisplayProps) {
  let formatted: string;

  if (locale) {
    formatted = formatPrice(amount, currencyCode, locale);
  } else if (countryCode) {
    formatted = formatPriceByCountry(amount, currencyCode, countryCode);
  } else {
    formatted = formatPrice(amount, currencyCode);
  }

  const symbol = getCurrencySymbol(currencyCode);

  let display: string;

  switch (variant) {
    case "minimal":
      // Just the number with symbol
      display = `${showSymbol ? symbol : ""}${amount.toFixed(2)}`;
      break;
    case "compact":
      // Formatted without extra spacing
      display = formatted;
      break;
    case "default":
    default:
      // Full formatted version
      display = formatted;
      if (showCode && !currencyCode.includes(currencyCode)) {
        display += ` ${currencyCode}`;
      }
  }

  const title = tooltip || `${amount.toFixed(2)} ${currencyCode}`;

  return (
    <span
      className={`inline-block ${className}`}
      title={title}
      data-currency={currencyCode}
    >
      {display}
    </span>
  );
}

/**
 * Display price with code badge
 */
export function PriceWithCurrency({
  amount,
  currencyCode,
  countryCode,
  className = "",
}: Omit<CurrencyDisplayProps, "variant" | "showSymbol" | "showCode">) {
  const formatted = countryCode
    ? formatPriceByCountry(amount, currencyCode, countryCode)
    : formatPrice(amount, currencyCode);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-lg font-semibold">{formatted}</span>
      <span className="inline-block rounded bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
        {currencyCode}
      </span>
    </div>
  );
}

/**
 * Display currency comparison for multiple amounts
 */
export function CurrencyComparison({
  amounts,
  currencyCode,
  countryCode,
  className = "",
}: {
  amounts: { label: string; amount: number }[];
  currencyCode: string;
  countryCode?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      {amounts.map(({ label, amount }) => (
        <div
          key={label}
          className="flex justify-between text-sm"
        >
          <span className="text-muted-foreground">{label}</span>
          <CurrencyDisplay
            amount={amount}
            currencyCode={currencyCode}
            countryCode={countryCode}
            variant="compact"
          />
        </div>
      ))}
    </div>
  );
}
