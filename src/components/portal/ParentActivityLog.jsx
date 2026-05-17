import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, DollarSign } from "lucide-react";

export default function ParentActivityLog({ student, privacyMode }) {
  const [activeTab, setActiveTab] = useState("attendance");

  // Fetch attendance records
  const { data: attendance = [] } = useQuery({
    queryKey: ["parent-attendance", student.id],
    queryFn: () => base44.entities.Attendance.filter({ student_id: student.id }, "-date"),
  });

  // Fetch paid fines
  const { data: fines = [] } = useQuery({
    queryKey: ["parent-fines-history", student.id],
    queryFn: () => base44.entities.Fine.filter({ student_id: student.id }, "-created_date"),
  });

  const paidFines = fines.filter(f => f.status === "paid");
  const attendanceStats = {
    present: attendance.filter(a => a.status === "present").length,
    absent: attendance.filter(a => a.status === "absent").length,
    late: attendance.filter(a => a.status === "late").length,
    excused: attendance.filter(a => a.status === "excused").length,
  };

  const statusColorMap = {
    present: "bg-emerald-100 text-emerald-700",
    absent: "bg-red-100 text-red-700",
    late: "bg-amber-100 text-amber-700",
    excused: "bg-blue-100 text-blue-700",
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="attendance" className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          Attendance
        </TabsTrigger>
        <TabsTrigger value="payments" className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Payments
        </TabsTrigger>
      </TabsList>

      <TabsContent value="attendance" className="space-y-4">
        {/* Attendance Stats */}
        <div className="grid grid-cols-4 gap-2">
          <Card className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Present</p>
            <p className="text-xl font-bold text-emerald-600">{attendanceStats.present}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Absent</p>
            <p className="text-xl font-bold text-red-600">{attendanceStats.absent}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Late</p>
            <p className="text-xl font-bold text-amber-600">{attendanceStats.late}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Excused</p>
            <p className="text-xl font-bold text-blue-600">{attendanceStats.excused}</p>
          </Card>
        </div>

        {/* Attendance List */}
        {attendance.length === 0 ? (
          <Card className="p-8 text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground">No attendance records found</p>
          </Card>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {attendance.map(record => (
              <Card key={record.id} className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{record.date}</p>
                      <Badge variant="outline" className="text-xs capitalize">{record.type.replace(/_/g, ' ')}</Badge>
                    </div>
                    {record.subject_name && (
                      <p className="text-xs text-muted-foreground">{record.subject_name}</p>
                    )}
                    {record.notes && (
                      <p className="text-xs text-muted-foreground italic mt-1">{record.notes}</p>
                    )}
                  </div>
                  <Badge className={`${statusColorMap[record.status]} capitalize text-xs shrink-0`}>
                    {record.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="payments" className="space-y-4">
        {/* Payment Summary */}
        {paidFines.length > 0 && (
          <Card className="p-4 bg-emerald-50 border border-emerald-200">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-200/50 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900">Payment History</p>
                <p className="text-emerald-700 text-sm mt-1">
                  {paidFines.length} fine{paidFines.length !== 1 ? 's' : ''} paid — Total: <span className="font-bold">{privacyMode ? "••••" : `$${paidFines.reduce((s, f) => s + (f.amount || 0), 0).toFixed(2)}`}</span>
                </p>
              </div>
            </div>
          </Card>
        )}

        {paidFines.length === 0 ? (
          <Card className="p-8 text-center">
            <DollarSign className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground">No paid fines found</p>
          </Card>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {paidFines.map(fine => (
              <Card key={fine.id} className="p-3 bg-emerald-50/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{fine.reason}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs capitalize">{fine.category}</Badge>
                      <p className="text-xs text-muted-foreground">{fine.date}</p>
                    </div>
                    {fine.notes && (
                      <p className="text-xs text-muted-foreground italic mt-2">{fine.notes}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-emerald-600">${fine.amount?.toFixed(2)}</p>
                    <p className="text-xs text-emerald-600 mt-1">✓ Paid</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}