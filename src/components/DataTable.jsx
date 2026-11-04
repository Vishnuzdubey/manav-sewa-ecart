import LoadingSkeleton from "./LoadingSkeleton.jsx";
import { Inbox } from "lucide-react";

export default function DataTable({
  columns,
  data,
  loading,
  emptyText = "No data found",
  rowKey = "id",
}) {
  if (loading) return <LoadingSkeleton rows={6} />;
  if (!data || data.length === 0) {
    return (
      <div className="card p-12 flex flex-col items-center justify-center text-center">
        <div className="h-14 w-14 rounded-full bg-surface-2 flex items-center justify-center mb-3">
          <Inbox className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      </div>
    );
  }
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-2 text-muted-foreground">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="text-left font-medium px-4 py-3 whitespace-nowrap"
                  style={{ width: c.width }}
                >
                  {c.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={row[rowKey] ?? idx}
                className="border-t border-border hover:bg-surface-2/60 transition-colors"
              >
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 align-middle">
                    {c.render ? c.render(row) : row[c.key]}
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
