/**
 * FK autocomplete Combobox — server search (300ms debounce) + infinite scroll.
 * Uses the backend /<api>/r/{model}/autocomplete/ endpoint (page_size 20 fixed, {results, has_more}).
 */

import { useInfiniteQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface FkComboboxProps {
  model: string; // target model key (e.g. "blog.Category")
  value: number | string | null;
  onChange: (value: number | string | null) => void;
  initialLabel?: string | null; // show the {fk}_label preselected in edit forms
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  invalid?: boolean;
}

export function FkCombobox({ model, value, onChange, initialLabel, placeholder = "Search to select", disabled, allowClear = true, invalid }: FkComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selectedLabel, setSelectedLabel] = useState<string | null>(initialLabel ?? null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => setSelectedLabel(initialLabel ?? null), [initialLabel]);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const query = useInfiniteQuery({
    queryKey: [model, "autocomplete", debounced],
    queryFn: ({ pageParam }) => adminApi.autocomplete(model, debounced, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last, pages) => (last.has_more ? pages.length + 1 : undefined),
    enabled: open,
  });

  const items = query.data?.pages.flatMap((p) => p.results) ?? [];

  // Infinite scroll — fetch the next page near the bottom of the list.
  function handleScroll() {
    const el = listRef.current;
    if (!el || !query.hasNextPage || query.isFetchingNextPage) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) void query.fetchNextPage();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-invalid={invalid}
          className={cn(
            "flex h-input w-full items-center justify-between gap-1 rounded border border-border bg-surface px-cell-x text-body",
            "focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:bg-app disabled:text-fg-muted",
            invalid && "border-danger",
            !value && "text-fg-muted",
          )}
        >
          <span className="truncate">{value !== null && value !== undefined ? (selectedLabel ?? `#${value}`) : placeholder}</span>
          <span className="flex shrink-0 items-center gap-0.5">
            {allowClear && value !== null && value !== undefined && !disabled && (
              <X
                className="h-3.5 w-3.5 text-fg-muted hover:text-fg-default"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                  setSelectedLabel(null);
                }}
              />
            )}
            <ChevronsUpDown className="h-3.5 w-3.5 text-fg-muted" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <div className="border-b border-border p-1">
          <Input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Type to search..." className="border-none focus:border-none" />
        </div>
        <div ref={listRef} onScroll={handleScroll} className="scrollbar-thin max-h-56 overflow-y-auto p-1">
          {query.isLoading ? (
            <p className="px-2 py-3 text-caption text-fg-muted">Loading...</p>
          ) : items.length === 0 ? (
            <p className="px-2 py-3 text-caption text-fg-muted">No results.</p>
          ) : (
            items.map((item) => (
              <button
                key={item.value}
                type="button"
                className={cn("flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-body hover:bg-app", item.value === value && "bg-accent/5 text-accent")}
                onClick={() => {
                  onChange(item.value);
                  setSelectedLabel(item.label);
                  setOpen(false);
                }}
              >
                <span className="truncate">{item.label}</span>
                {item.value === value && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            ))
          )}
          {query.isFetchingNextPage && <p className="px-2 py-1 text-caption text-fg-muted">Loading more...</p>}
        </div>
      </PopoverContent>
    </Popover>
  );
}
