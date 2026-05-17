import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

const STATUS_STYLES = {
  pending: "destructive",
  paid:    "secondary",
  waived:  "outline",
};

export default function StudentFinesTab({ studentId }) {
  const { data: fines = [], isLoading } = useQuery({
    queryKey: ["fines", studentId],
    queryFn: () => base44.entities.Fine.filter({ student_id: studentId }, "-date"),
    enabled: !!studentId,
  });

  const total = fines.filter(f => f.status === "pending").reduce((s, f) => s + (f.amount || 0), 0);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading fines...</div>;

  if (fines.length === 0) return (
    <Card className="p-10 text-center border shadow-sm">
      <AlertTriangle className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
      <p className="text-muted-foreground">No fines on record.</p>
    </Card>
  );

  return (
    <div className="space-y-3">
      {total > 0 && (
        <Card className="p-4 border border-red-200 bg-red-50 flex items-center justify-between">
          <span className="font-semibold text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Outstanding Balance
          </span>
          <span className="text-xl font-bold text-red-700">${total.toFixed(2)}</span>
        </Card>
      )}
      {fines.map(f => (
        <Card key={f.id} className="p-4 border shadow-sm flex items-center justify-between gap-3">
          <div>
            <p className="font-medium text-sm">{f.reason}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant={STATUS_STYLES[f.status]} className="text-xs capitalize">{f.status}</Badge>
              <span className="text-xs text-muted-foreground capitalize">{f.category}</span>
              {f.date && <span className="text-xs text-muted-foreground">{f.date}</span>}
            </div>
          </div>
          <span className={`text-lg font-bold shrink-0 ${f.status === "pending" ? "text-destructive" : "text-muted-foreground"}`}>
            ${(f.amount || 0).toFixed(2)}
          </span>
        </Card>
      ))}
    </div>
  );
}