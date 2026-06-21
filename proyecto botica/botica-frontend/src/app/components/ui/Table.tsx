import { ReactNode } from "react";
import { Package } from "lucide-react";

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => ReactNode;
}

interface TableProps {
  columns: Column[];
  data: any[];
  emptyMessage?: string;
}

export function Table({ columns, data, emptyMessage = "No hay datos para mostrar" }: TableProps) {
  if (data.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-line p-12 text-center shadow-soft">
        <div className="w-16 h-16 mx-auto mb-4 bg-[#F1F5F9] rounded-full flex items-center justify-center">
          <Package className="w-8 h-8 text-faint" />
        </div>
        <h3 className="text-lg font-semibold text-ink-2 mb-2">Sin resultados</h3>
        <p className="text-sm text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl border border-line overflow-hidden shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#F8FAFC] border-b border-line">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wide"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`border-b border-line-2 last:border-0 transition-colors hover:bg-[#F8FAFC] ${
                  rowIndex % 2 === 0 ? "bg-surface" : "bg-[#FCFDFE]"
                }`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 text-sm text-text"
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
