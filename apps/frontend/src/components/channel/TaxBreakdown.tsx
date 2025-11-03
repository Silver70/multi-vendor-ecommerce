import { TaxBehavior } from "~/types/channel";
import {
  formatPrice,
  formatPriceByCountry,
} from "~/lib/utils/currency";
import { getTaxBehaviorLabel } from "~/lib/utils/tax";
import { Badge } from "~/components/ui/badge";
import { AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "~/components/ui/alert";

interface TaxBreakdownProps {
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  taxRuleName?: string;
  shippingAmount?: number;
  total: number;
  taxBehavior: TaxBehavior;
  currencyCode: string;
  countryCode?: string;
  className?: string;
}

/**
 * Display tax breakdown for order summary
 */
export function TaxBreakdown({
  subtotal,
  taxAmount,
  taxRate,
  taxRuleName,
  shippingAmount = 0,
  total,
  taxBehavior,
  currencyCode,
  countryCode,
  className = "",
}: TaxBreakdownProps) {
  const format = (amount: number) =>
    countryCode
      ? formatPriceByCountry(amount, currencyCode, countryCode)
      : formatPrice(amount, currencyCode);

  const isInclusive = taxBehavior === "inclusive";

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Tax behavior alert */}
      <Alert
        variant={isInclusive ? "default" : "default"}
        className="border-dashed"
      >
        <Info className="h-4 w-4" />
        <AlertDescription className="ml-2 text-sm">
          {getTaxBehaviorLabel(taxBehavior)}
          {taxRuleName && ` (${taxRuleName})`}
        </AlertDescription>
      </Alert>

      {/* Breakdown table */}
      <div className="space-y-2 rounded-lg bg-muted/50 p-4">
        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{format(subtotal)}</span>
        </div>

        {/* Shipping */}
        {shippingAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-medium">{format(shippingAmount)}</span>
          </div>
        )}

        {/* Tax */}
        <div className="flex justify-between border-t border-border pt-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {isInclusive ? "Estimated Tax" : "Tax"}
            </span>
            <Badge variant="secondary" className="text-xs">
              {(taxRate * 100).toFixed(1)}%
            </Badge>
          </div>
          <span className="font-medium">
            {isInclusive ? `(${format(taxAmount)})` : format(taxAmount)}
          </span>
        </div>

        {/* Total */}
        <div className="flex justify-between border-t border-border pt-2 font-semibold">
          <span>Total</span>
          <span className="text-base">{format(total)}</span>
        </div>
      </div>

      {/* Additional info for inclusive tax */}
      {isInclusive && (
        <p className="text-xs text-muted-foreground">
          The displayed price includes all applicable taxes. No additional tax
          will be charged at checkout.
        </p>
      )}
    </div>
  );
}

/**
 * Compact version of tax breakdown for inline displays
 */
export function TaxBreakdownCompact({
  subtotal,
  taxAmount,
  taxRate,
  total,
  taxBehavior,
  currencyCode,
  countryCode,
}: TaxBreakdownProps) {
  const format = (amount: number) =>
    countryCode
      ? formatPriceByCountry(amount, currencyCode, countryCode)
      : formatPrice(amount, currencyCode);

  const isInclusive = taxBehavior === "inclusive";

  return (
    <div className="space-y-1 text-sm">
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>{format(subtotal)}</span>
      </div>
      {taxAmount > 0 && (
        <div className="flex justify-between text-amber-600">
          <span>
            {isInclusive ? "Tax (included)" : "Tax"} ({(taxRate * 100).toFixed(1)}%)
          </span>
          <span>{isInclusive ? `(${format(taxAmount)})` : format(taxAmount)}</span>
        </div>
      )}
      <div className="flex justify-between border-t pt-1 font-semibold">
        <span>Total</span>
        <span>{format(total)}</span>
      </div>
    </div>
  );
}
