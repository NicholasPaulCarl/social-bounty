'use client';

export interface PropDefinition {
  name: string;
  type: string;
  default: string;
  required?: boolean;
  description: string;
}

interface PropsTableProps {
  props: PropDefinition[];
}

export function PropsTable({ props }: PropsTableProps) {
  if (!props.length) return null;

  return (
    <div className="overflow-x-auto mb-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface/50 text-text-muted text-xs uppercase tracking-wider">
            <th className="text-left px-4 py-2.5 font-medium">Name</th>
            <th className="text-left px-4 py-2.5 font-medium">Type</th>
            <th className="text-left px-4 py-2.5 font-medium">Default</th>
            <th className="text-left px-4 py-2.5 font-medium w-10">Req</th>
            <th className="text-left px-4 py-2.5 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {props.map((p) => (
            <tr key={p.name} className="border-b border-glass-border/30">
              <td className="px-4 py-2.5 font-mono tabular-nums text-pink-600 text-xs">{p.name}</td>
              <td className="px-4 py-2.5 font-mono tabular-nums text-slate-700 text-xs">{p.type}</td>
              <td className="px-4 py-2.5 font-mono tabular-nums text-text-muted text-xs">{p.default}</td>
              <td className="px-4 py-2.5">
                <span className={`inline-block w-2 h-2 rounded-full ${p.required ? 'bg-success-600' : 'bg-elevated'}`} />
              </td>
              <td className="px-4 py-2.5 text-text-secondary text-xs">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
