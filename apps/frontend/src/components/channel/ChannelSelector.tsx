import { useQuery } from "@tanstack/react-query";
import { Channel } from "~/types/channel";
import { channelQueries } from "~/lib/queries/channels";
import { getCountryFlag, getCountryName } from "~/lib/utils/currency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface ChannelSelectorProps {
  selectedChannelId?: string;
  onChannelChange?: (channel: Channel) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Channel selector dropdown component for navigation
 * Fetches all channels and allows user to select one
 */
export function ChannelSelectorComponent({
  selectedChannelId,
  onChannelChange,
  className = "",
  placeholder = "Select channel...",
  disabled = false,
}: ChannelSelectorProps) {
  const { data: channels, isLoading } = useQuery(
    channelQueries.getAll()
  );

  const [value, setValue] = useState<string>(
    selectedChannelId || ""
  );

  useEffect(() => {
    if (selectedChannelId) {
      setValue(selectedChannelId);
    }
  }, [selectedChannelId]);

  const selectedChannel = channels?.find((c) => c.id === value);

  const handleChange = (channelId: string) => {
    setValue(channelId);
    const channel = channels?.find((c) => c.id === channelId);
    if (channel && onChannelChange) {
      onChannelChange(channel);
    }

    // Persist selection to localStorage
    localStorage.setItem("selectedChannelId", channelId);
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading channels...</span>
      </div>
    );
  }

  if (!channels || channels.length === 0) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        No channels available
      </div>
    );
  }

  return (
    <Select
      value={value}
      onValueChange={handleChange}
      disabled={disabled || isLoading}
    >
      <SelectTrigger className={`w-48 ${className}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {channels.map((channel) => {
          const flag = getCountryFlag(channel.countryCode);
          const countryName = getCountryName(channel.countryCode);

          return (
            <SelectItem key={channel.id} value={channel.id}>
              <div className="flex items-center gap-2">
                {flag && <span>{flag}</span>}
                <span>{channel.name}</span>
                <span className="text-muted-foreground">
                  {channel.currencyCode}
                </span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

/**
 * Compact channel selector for quick switching
 */
export function CompactChannelSelector({
  selectedChannelId,
  onChannelChange,
  className = "",
}: Omit<ChannelSelectorProps, "placeholder">) {
  const { data: channels, isLoading } = useQuery(
    channelQueries.getAll()
  );

  if (isLoading || !channels) {
    return null;
  }

  const selected = channels.find((c) => c.id === selectedChannelId);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {channels.map((channel) => {
        const flag = getCountryFlag(channel.countryCode);
        const isSelected = channel.id === selectedChannelId;

        return (
          <button
            key={channel.id}
            onClick={() => onChannelChange?.(channel)}
            className={`relative rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
              isSelected
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
            title={`${channel.name} - ${channel.currencyCode}`}
          >
            {flag && <span className="mr-1">{flag}</span>}
            {channel.currencyCode}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Channel selector with warning for cart clearing
 */
export function ChannelSelectorWithWarning({
  selectedChannelId,
  onChannelChange,
  hasCartItems = false,
  className = "",
}: ChannelSelectorProps & { hasCartItems?: boolean }) {
  const { data: channels, isLoading } = useQuery(
    channelQueries.getAll()
  );

  const handleChange = (channel: Channel) => {
    if (hasCartItems) {
      const confirmed = window.confirm(
        `Switching channels will clear your cart. Are you sure you want to change to ${channel.name}?`
      );

      if (!confirmed) return;
    }

    onChannelChange?.(channel);
    localStorage.setItem("selectedChannelId", channel.id);
  };

  if (isLoading || !channels) {
    return null;
  }

  return (
    <ChannelSelectorComponent
      selectedChannelId={selectedChannelId}
      onChannelChange={handleChange}
      className={className}
    />
  );
}

/**
 * Initialize channel from localStorage on app load
 */
export function useInitializeChannel(): Channel | null {
  const { data: channels } = useQuery(channelQueries.getAll());

  const savedChannelId = localStorage.getItem("selectedChannelId");

  if (!channels) return null;

  if (savedChannelId) {
    const saved = channels.find((c) => c.id === savedChannelId);
    if (saved) return saved;
  }

  // Return first active channel as default
  return channels.find((c) => c.isActive) || channels[0] || null;
}
