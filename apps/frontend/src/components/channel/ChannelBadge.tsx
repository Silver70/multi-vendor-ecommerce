import { Channel } from "~/types/channel";
import { getCountryFlag, getCountryName } from "~/lib/utils/currency";
import { Badge } from "~/components/ui/badge";
import { Globe } from "lucide-react";

interface ChannelBadgeProps {
  channel: Channel;
  showCurrency?: boolean;
  showCountry?: boolean;
  showFlag?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  variant?: "default" | "secondary" | "outline";
}

/**
 * Display channel information as a badge
 */
export function ChannelBadge({
  channel,
  showCurrency = true,
  showCountry = true,
  showFlag = true,
  size = "md",
  className = "",
  variant = "default",
}: ChannelBadgeProps) {
  const flag = getCountryFlag(channel.countryCode);
  const countryName = getCountryName(channel.countryCode);

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  const parts: string[] = [];

  if (showFlag && flag) {
    parts.push(flag);
  }

  parts.push(channel.name);

  if (showCountry) {
    parts.push(countryName);
  }

  if (showCurrency) {
    parts.push(channel.currencyCode);
  }

  const display = parts.join(" • ");

  return (
    <Badge
      variant={variant}
      className={`${sizeClasses[size]} ${className}`}
      title={`Channel: ${channel.name} (${channel.type})`}
    >
      {display}
    </Badge>
  );
}

/**
 * Display channel info in card format
 */
export function ChannelCard({
  channel,
  className = "",
}: {
  channel: Channel;
  className?: string;
}) {
  const flag = getCountryFlag(channel.countryCode);
  const countryName = getCountryName(channel.countryCode);

  return (
    <div
      className={`rounded-lg border border-border p-4 ${className}`}
      data-channel-id={channel.id}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {flag && <span className="text-2xl">{flag}</span>}
          <div>
            <h3 className="font-semibold leading-tight">{channel.name}</h3>
            <p className="text-sm text-muted-foreground">{countryName}</p>
          </div>
        </div>
        {!channel.isActive && (
          <Badge variant="secondary" className="ml-2">
            Inactive
          </Badge>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">Type</p>
          <p className="font-medium capitalize">{channel.type}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Currency</p>
          <p className="font-medium">{channel.currencyCode}</p>
        </div>
        {channel.regionCode && (
          <div>
            <p className="text-muted-foreground">Region</p>
            <p className="font-medium">{channel.regionCode}</p>
          </div>
        )}
        <div>
          <p className="text-muted-foreground">Tax Rate</p>
          <p className="font-medium">
            {(channel.defaultTaxRate * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {channel.description && (
        <p className="mt-3 text-sm text-muted-foreground">
          {channel.description}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {channel.isB2B && (
          <Badge variant="outline" className="text-xs">
            B2B
          </Badge>
        )}
        <Badge
          variant="outline"
          className="text-xs"
        >
          {channel.taxBehavior === "inclusive"
            ? "Tax Inclusive"
            : "Tax Exclusive"}
        </Badge>
      </div>
    </div>
  );
}

/**
 * Mini channel selector with flags
 */
export function ChannelSelector({
  channels,
  selectedId,
  onSelect,
  className = "",
}: {
  channels: Channel[];
  selectedId?: string;
  onSelect: (channelId: string) => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {channels.map((channel) => {
        const flag = getCountryFlag(channel.countryCode);
        const isSelected = selectedId === channel.id;

        return (
          <button
            key={channel.id}
            onClick={() => onSelect(channel.id)}
            className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${
              isSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:border-primary/50"
            }`}
            title={channel.name}
          >
            {flag && <span className="mr-2">{flag}</span>}
            {channel.currencyCode}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Channel info display for header
 */
export function ChannelInfo({
  channel,
  className = "",
}: {
  channel: Channel | null;
  className?: string;
}) {
  if (!channel) {
    return (
      <div className={`flex items-center gap-2 text-muted-foreground ${className}`}>
        <Globe className="h-4 w-4" />
        <span className="text-sm">No channel selected</span>
      </div>
    );
  }

  const flag = getCountryFlag(channel.countryCode);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {flag && <span className="text-lg">{flag}</span>}
      <div className="flex flex-col">
        <span className="text-sm font-medium">{channel.name}</span>
        <span className="text-xs text-muted-foreground">{channel.currencyCode}</span>
      </div>
    </div>
  );
}
