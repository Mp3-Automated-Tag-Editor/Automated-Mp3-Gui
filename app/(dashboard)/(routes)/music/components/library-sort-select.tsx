"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortOption = { value: string; label: string };

type LibrarySortSelectProps = {
  value: string;
  options: SortOption[];
  onValueChange: (value: string) => void;
  className?: string;
};

export function LibrarySortSelect({
  value,
  options,
  onValueChange,
  className,
}: LibrarySortSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className ?? "h-9 w-[10.5rem]"}>
        <SelectValue placeholder="Sort" />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
