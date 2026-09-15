import type {CSSProperties, ReactNode} from "react";

export type DataColumn<T> = {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  value?: (row: T) => ReactNode;
  align?: "left" | "center" | "right";
  width?: CSSProperties["width"];
  className?: string;
};

export type DataTableProps<T> = {
  rows: T[];
  columns: DataColumn<T>[];
  getRowKey: (row: T) => string;
  emptyMessage?: string;
  ariaLabel: string;
  renderActions?: (row: T) => ReactNode;
  actionsLabel?: string;
};

export function DataTable<T>({
  rows,
  columns,
  getRowKey,
  emptyMessage = "No records found.",
  ariaLabel,
  renderActions,
  actionsLabel = "Actions",
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return <p className="data-table-empty">{emptyMessage}</p>;
  }

  return (
    <div className="data-table-scroll">
      <table aria-label={ariaLabel} className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                className={`data-table-${column.align ?? "left"} ${column.className ?? ""}`}
                key={column.key}
                scope="col"
                style={{width: column.width}}
              >
                {column.label}
              </th>
            ))}
            {renderActions && <th className="data-table-actions-heading" scope="col">{actionsLabel}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => (
                <td
                  className={`data-table-${column.align ?? "left"} ${column.className ?? ""}`}
                  key={column.key}
                >
                  {column.render?.(row) ?? column.value?.(row) ?? "—"}
                </td>
              ))}
              {renderActions && <td className="data-table-actions">{renderActions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
