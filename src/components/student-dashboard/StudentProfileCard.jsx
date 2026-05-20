import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, CreditCard, Bus, Star, XCircle, Clock, Zap } from "lucide-react";
import { displayStudentId } from "@/utils/studentIdFormatter";

const STATUS_COLOR = { active: "default", suspended: "destructive", graduated: "secondary", transferred: "outline" };

export default function StudentProfileCard({ student }) {
  const score = student.attendance_score ?? 100;
  const scoreColor = score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-red-600";
  const scoreBg = score >= 80 ? "bg-emerald-50 border-emerald-200" : score >= 60 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";

  // Format student ID with leading zeros (0001, 0002, etc.)
  const formattedStudentId = displayStudentId(student.student_id);

  return (
    <Card className="p-6 border shadow-sm">
      <div className="flex items-start gap-5">
        <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
          {student.photo_url
            ? <img src={student.photo_url} alt={student.full_name} className="h-full w-full object-cover" />
            : <User className="h-9 w-9 text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-display text-2xl font-bold">{student.full_name}</h2>
            <Badge variant={STATUS_COLOR[student.status]} className="capitalize">{student.status}</Badge>
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-mono font-bold text-primary">{formattedStudentId}</span>
            </div>
            <span className="text-xs text-muted-foreground">({student.grade && student.section ? `${student.grade}-${student.section}` : `Grade ${student.grade || '?'}`})</span>
          </div>
          <div className="flex flex-wrap gap-3 mt-2.5">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              Grade {student.grade}{student.section ? `-${student.section}` : ""}
            </div>
            {student.bus_registered && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Bus className="h-3.5 w-3.5" />
                Bus {student.bus_route || "Registered"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
        <div className={`rounded-xl p-3 border text-center ${scoreBg}`}>
          <Star className={`h-4 w-4 mx-auto mb-1 ${scoreColor}`} />
          <p className={`text-xl font-bold ${scoreColor}`}>{score}</p>
          <p className="text-xs text-muted-foreground">Attend. Score</p>
        </div>
        <div className="rounded-xl p-3 border bg-muted/30 text-center">
          <XCircle className="h-4 w-4 mx-auto mb-1 text-destructive" />
          <p className="text-xl font-bold text-destructive">{student.total_absences || 0}</p>
          <p className="text-xs text-muted-foreground">Absences</p>
        </div>
        <div className="rounded-xl p-3 border bg-muted/30 text-center">
          <Clock className="h-4 w-4 mx-auto mb-1 text-amber-600" />
          <p className="text-xl font-bold text-amber-600">{student.total_lates || 0}</p>
          <p className="text-xs text-muted-foreground">Late Arrivals</p>
        </div>
        <div className="rounded-xl p-3 border bg-emerald-50 border-emerald-200 text-center">
          <CreditCard className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
          <p className={`text-xl font-bold ${(student.card_balance || 0) < 5 ? "text-destructive" : "text-emerald-600"}`}>
            ${(student.card_balance || 0).toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">Card Balance</p>
        </div>
      </div>
    </Card>
  );
}