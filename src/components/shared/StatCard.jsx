import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const colorMap = {
  blue:   { bg: "bg-blue-50",    icon: "text-blue-600",   border: "border-blue-100" },
  gold:   { bg: "bg-amber-50",   icon: "text-amber-600",  border: "border-amber-100" },
  green:  { bg: "bg-emerald-50", icon: "text-emerald-600",border: "border-emerald-100" },
  red:    { bg: "bg-red-50",     icon: "text-red-600",    border: "border-red-100" },
  purple: { bg: "bg-purple-50",  icon: "text-purple-600", border: "border-purple-100" },
  indigo: { bg: "bg-indigo-50",  icon: "text-indigo-600", border: "border-indigo-100" },
};

export default function StatCard({ title, value, icon: Icon = null, color = "blue", sub = null, className = "" }) {
  const c = colorMap[color] || colorMap.blue;
  return (
    <Card className={cn("p-4 border-none bg-white shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group", className)}>
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300", c.icon.replace('text-', 'from-').replace('-600', '-500'), 'to-transparent')} />
      <div className="flex items-start justify-between relative z-10">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-widest truncate mb-1">{title}</p>
          <p className="text-2xl font-black text-stone-900">{value}</p>
          {sub && <p className="text-[10px] font-semibold text-stone-400 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ms-3 transition-transform duration-300 group-hover:scale-110", c.bg)}>
            <Icon className={cn("h-5 w-5", c.icon)} />
          </div>
        )}
      </div>
    </Card>
  );
}