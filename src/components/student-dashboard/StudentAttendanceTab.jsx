import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { Card } from "@/components/ui/card";
import { ClipboardCheck } from "lucide-react";

const STATUS_STYLES = {
  present:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  absent:   "bg-red-50 text-red-700 border-red-200",
  late:     "bg-amber-50 text-amber-700 border-amber-200",
  excused:  "bg-blue-50 text-blue-700 border-blue-200",
};

const TYPE_LABELS = { gate_in: "Gate In", gate_out: "Gate Out", bus_in: "Bus In", bus_out: "Bus Out", class: "Class" };

export default function StudentAttendanceTab({ studentId }) {
  const { data: records = [], isLoading } = useQuery({
    queryKey: ["attendance", studentId],
    queryFn: () => entities.Attendance.filter({ student_id: studentId }, "-date"),
    enabled: !!studentId,
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading attendance...</div>;

  if (records.length === 0) return (
    <Card className="p-10 text-center border shadow-sm">
      <ClipboardCheck className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
      <p className="text-muted-foreground">No attendance records yet.</p>
    </Card>
  );

  return (
    <div className="space-y-2">
      {records.map(r => (
        <Card key={r.id} className="p-4 border shadow-sm flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{r.date}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[r.status] || ""}`}>
                {r.status}
              </span>
              <span className="text-xs text-muted-foreground">{TYPE_LABELS[r.type] || r.type}</span>
            </div>
            {r.subject_name && <p className="text-xs text-muted-foreground mt-0.5">{r.subject_name}</p>}
            {r.notes && <p className="text-xs text-muted-foreground italic mt-0.5">"{r.notes}"</p>}
          </div>
          {r.time && <span className="text-xs text-muted-foreground shrink-0">{r.time}</span>}
        </Card>
      ))}
    </div>
  );
}