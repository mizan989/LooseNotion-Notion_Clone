"use client";

import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { addDatabaseRow } from "@/actions/databases";
import type { DatabaseColumn, DatabaseRow } from "@/types/database";

/**
 * Groups rows by the first "select" column (falls back to "Status" by name),
 * matching the TODO / DOING / DONE board from Step 4.
 */
export function BoardView({
  databaseId,
  columns,
  rows,
  onEditCell,
}: {
  databaseId: string;
  columns: DatabaseColumn[];
  rows: DatabaseRow[];
  onEditCell: (rowId: string, columnId: string, value: string | number | boolean | null) => void;
}) {
  const groupColumn =
    columns.find((c) => c.type === "select" && c.name.toLowerCase() === "status") ??
    columns.find((c) => c.type === "select");
  const titleColumn = columns.find((c) => c.type === "text") ?? columns[0];

  if (!groupColumn) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Add a &quot;Select&quot; column (e.g. Status) to use the board view.
      </div>
    );

  }

  const options = groupColumn.options ?? [];

  return (
    <div className="flex gap-4 overflow-x-auto p-4">
      {options.map((option) => {
        const columnRows = rows.filter((r) => r.values[groupColumn.id] === option.id);
        return (
          <div key={option.id} className="w-64 shrink-0 rounded-md bg-muted/40 p-2">
            <div className="mb-2 flex items-center justify-between px-1">
              <Badge style={{ backgroundColor: `${option.color}22`, color: option.color }}>
                {option.label}
              </Badge>
              <span className="text-xs text-muted-foreground">{columnRows.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {columnRows.map((row) => (
                <div key={row.id} className="rounded-md border bg-background p-2 text-sm shadow-sm">
                  {titleColumn ? (row.values[titleColumn.id] as string) || "Untitled" : "Untitled"}
                </div>
              ))}
            </div>
            <button
              onClick={async () => {
                const row = await addDatabaseRow(databaseId);
                if (row) onEditCell(row.id, groupColumn.id, option.id);
              }}
              className="mt-2 flex w-full items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
            >
              <Plus className="h-3 w-3" /> New
            </button>
          </div>
        );
      })}
    </div>
  );
}
