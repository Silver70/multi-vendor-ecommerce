import * as React from "react";
import { Search, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { GlobalAttribute } from "~/lib/queries";

interface AttributeBrowserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attributes: GlobalAttribute[];
  selectedAttributeNames: string[];
  onSelectAttribute: (attribute: GlobalAttribute) => void;
  isLoading?: boolean;
}

export function AttributeBrowserModal({
  open,
  onOpenChange,
  attributes,
  selectedAttributeNames,
  onSelectAttribute,
  isLoading = false,
}: AttributeBrowserModalProps) {
  const [searchTerm, setSearchTerm] = React.useState("");

  // Filter attributes based on search term and already selected ones
  const filteredAttributes = React.useMemo(() => {
    return attributes.filter((attr) => {
      const matchesSearch = attr.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const isAlreadySelected = selectedAttributeNames.some(
        (name) => name.toLowerCase() === attr.name.toLowerCase()
      );
      return matchesSearch && !isAlreadySelected;
    });
  }, [attributes, searchTerm, selectedAttributeNames]);

  const handleResetSearch = () => {
    setSearchTerm("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Browse All Attributes</DialogTitle>
          <DialogDescription>
            Search and select from all available global attributes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search attributes by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={handleResetSearch}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Results Counter */}
          {!isLoading && (
            <div className="text-sm text-muted-foreground">
              Showing {filteredAttributes.length} of {attributes.length}{" "}
              attributes
            </div>
          )}

          {/* Attributes List */}
          <div className="max-h-[400px] overflow-y-auto pr-4 border rounded-lg">
            {isLoading ? (
              <div className="flex items-center justify-center h-full p-8">
                <p className="text-muted-foreground">Loading attributes...</p>
              </div>
            ) : filteredAttributes.length === 0 ? (
              <div className="flex items-center justify-center h-full p-8">
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "No attributes found matching your search"
                    : "All available attributes have been selected"}
                </p>
              </div>
            ) : (
              <div className="space-y-2 p-3">
                {filteredAttributes.map((attribute) => (
                  <div
                    key={attribute.id}
                    className="flex items-start justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm mb-2">
                        {attribute.name}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {attribute.values.slice(0, 5).map((value) => (
                          <Badge
                            key={value.id}
                            variant="secondary"
                            className="text-xs"
                          >
                            {value.value}
                          </Badge>
                        ))}
                        {attribute.values.length > 5 && (
                          <Badge
                            variant="outline"
                            className="text-xs"
                          >
                            +{attribute.values.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectAttribute(attribute)}
                      className="ml-2 flex-shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
