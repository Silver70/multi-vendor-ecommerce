import React, { useState, useRef, useEffect } from "react";

interface CustomSelectProps {
  id?: string;
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  options: Array<{
    value: string;
    label: string;
  }>;
  disabled?: boolean;
  className?: string;
}

export const CustomSelect = React.forwardRef<
  HTMLDivElement,
  CustomSelectProps
>(
  (
    {
      id,
      value,
      onChange,
      placeholder = "Select an option",
      options,
      disabled = false,
      className = "",
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Get the label for the selected value
    const selectedLabel =
      options.find((opt) => opt.value === value)?.label || placeholder;

    // Close dropdown when clicking outside
    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      }

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }
    }, [isOpen]);

    const handleSelect = (selectedValue: string) => {
      onChange(selectedValue);
      setIsOpen(false);
    };

    return (
      <div
        ref={containerRef}
        className={`relative w-full ${className}`}
        id={id}
      >
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full px-3 py-2 text-left bg-card border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-primary focus:border-primary transition-colors ${
            disabled ? "bg-muted cursor-not-allowed opacity-50" : ""
          }`}
        >
          <div className="flex justify-between items-center">
            <span
              className={
                value ? "text-foreground" : "text-muted-foreground"
              }
            >
              {selectedLabel}
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg">
            <ul className="max-h-48 overflow-y-auto py-1">
              {options.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full text-left px-3 py-2 cursor-pointer transition-colors ${
                      value === option.value
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
);

CustomSelect.displayName = "CustomSelect";
