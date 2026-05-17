import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardCheck, CreditCard, AlertTriangle } from "lucide-react";
import { AwardBadge } from "@/components/portal/StudentProfile";

export default function PortalHome({ student }) {
  const { data: awards = [] } = useQuery({
    queryKey: ["student-awards", student.id],
    queryFn: () => base44.entities.StudentAward.filter({ student_id: student.id }),
  });
  const { data: attendance = [] } = useQuery({
    queryKey: ["portal-attendance", student.id],
    queryFn: () => base44.entities.Attendance.filter({ student_id: student.id }),
  });
  const { data: fines = [] } = useQuery({
    queryKey: ["portal-fines", student.id],
    queryFn: () => base44.entities.Fine.filter({ student_id: student.id }),
  });
  const { data: purchases = [] } = useQuery({
    queryKey: ["portal-purchases", student.id],
    queryFn: () => base44.entities.Purchase.filter({ student_id: student.id }),
  });

  const pendingFines = fines.filter(f => f.status === "pending");
  const totalFines = pendingFines.reduce((s, f) => s + f.amount, 0);
  const recentAttendance = [...attendance].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Profile Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-5 flex items-center gap-4">
        {student.photo_url ? (
          <img src={student.photo_url} className="h-16 w-16 rounded-full object-cover border-2 border-white/40" alt="" />
        ) : (
          <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
            {student.full_name[0]}
          </div>
        )}
        <div>
          <p className="text-sm opacity-80">Welcome back</p>
          <h2 className="text-xl font-bold">{student.full_name}</h2>
          <p className="text-sm opacity-70">Grade {student.grade} {student.section && `· ${student.section}`}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex flex-col items-center gap-1">
            <ClipboardCheck className="h-5 w-5 text-green-600" />
            <p className="text-xl font-bold">{student.attendance_score ?? 100}%</p>
            <p className="text-xs text-muted-foreground text-center">Attendance</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center gap-1">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <p className="text-xl font-bold">{(student.card_balance ?? 0).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground text-center">Balance</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center gap-1">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <p className="text-xl font-bold">{totalFines.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground text-center">Pending Fines</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Attendance */}
      <Card>
        <CardContent className="p-4">
          <p className="font-semibold mb-3 text-sm">Recent Attendance</p>
          {recentAttendance.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No records yet</p>
          ) : (
            <div className="space-y-2">
              {recentAttendance.map(r => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{r.date}</span>
                    <span className="text-muted-foreground ml-2 capitalize">{r.type?.replace("_", " ")}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    r.status === "present" ? "bg-green-100 text-green-700" :
                    r.status === "absent" ? "bg-red-100 text-red-700" :
                    r.status === "late" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                  }`}>{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Awards showcase */}
      {awards.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="font-semibold mb-3 text-sm">🏆 My Awards</p>
            <div className="flex flex-wrap gap-2">
              {awards.map(a => <AwardBadge key={a.id} award={a} size="sm" />)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fines Summary */}
      {fines.length > 0 && (
        <Card className={fines.some(f => f.status === "pending") ? "border-amber-200" : ""}>
          <CardContent className="p-4">
            <p className="font-semibold mb-4 text-sm">Fines Summary</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-lg font-bold text-red-600">{fines.filter(f => f.status === "pending").reduce((s, f) => s + f.amount, 0).toFixed(2)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Paid</p>
                <p className="text-lg font-bold text-green-600">{fines.filter(f => f.status === "paid").reduce((s, f) => s + f.amount, 0).toFixed(2)}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Waived</p>
                <p className="text-lg font-bold text-blue-600">{fines.filter(f => f.status === "waived").reduce((s, f) => s + f.amount, 0).toFixed(2)}</p>
              </div>
            </div>
            {pendingFines.length > 0 && (
              <div className="space-y-2 pt-3 border-t">
                <p className="text-xs font-medium text-amber-700">Outstanding:</p>
                {pendingFines.map(f => (
                  <div key={f.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{f.reason}</span>
                    <span className="font-semibold text-red-600">{f.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}