import { Search } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

import { Input } from "@/components/ui/input";

/**
 * Single-line list toolbar — search + filters + bulk actions.
 * When selectedCount > 0, the bulk-action slot (bulkActions) appears.
 */
export function FilterBar({
  search,
  onSearch,
  searchPlaceholder = "Search",
  filters,
  selectedCount = 0,
  bulkActions,
}: {
  search: string;
  onSearch: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  selectedCount?: number;
  bulkActions?: ReactNode;
}) {
  const [draft, setDraft] = useState(search);

  // Sync with external resets.
  useEffect(() => setDraft(search), [search]);

  // 300ms debounce.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (draft !== search) onSearch(draft);
    }, 300);
    return () => clearTimeout(timer);
  }, [draft, search, onSearch]);

  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <div className="relative w-60">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-muted" />
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={searchPlaceholder} className="pl-7" aria-label="Search" />
      </div>
      {filters}
      {selectedCount > 0 && (
        <div className="ml-auto flex items-center gap-2 rounded border border-accent/30 bg-accent/5 px-2 py-1">
          <span className="text-caption font-medium text-accent">{selectedCount} selected</span>
          {bulkActions}
        </div>
      )}
    </div>
  );
}
