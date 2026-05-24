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
      <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-[#F9FAFB] rounded-full flex items-center justify-center">
          <Package className="w-8 h-8 text-[#9CA3AF]" />
        </div>
        <h3 className="text-lg font-semibold text-[#1A1F2E] mb-2">Sin resultados</h3>
        <p className="text-sm text-[#4A5260]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[16px] border border-[#E5E7EB] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white border-b border-[#E5E7EB]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-sm font-semibold text-[#4A5260]"
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
                className={rowIndex % 2 === 0 ? "bg-white" : "bg-[#F9FAFB]"}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 text-sm text-[#1A1F2E]"
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
