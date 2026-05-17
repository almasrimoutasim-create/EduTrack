import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, User, Bus, Calendar } from "lucide-react";

export default function ProfileModal({ email, open, onClose }) {
  const { data: students = [] } = useQuery({
    queryKey: ["profile-student", email],
    queryFn: () => base44.entities.Student.filter({ user_email: email }),
    enabled: open && !!email
  });

  const student = students[0];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Student Profile</DialogTitle>
        </DialogHeader>
        {!student ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No student profile linked.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                {student.photo_url
                  ? <img src={student.photo_url} className="h-full w-full object-cover" />
                  : student.full_name?.[0]}
              </div>
              <div>
                <h2 className="font-bold text-lg">{student.full_name}</h2>
                <p className="text-muted-foreground text-sm">ID: {student.student_id}</p>
                <Badge variant={student.status === "active" ? "default" : "secondary"} className="text-xs mt-1 capitalize">
                  {student.status}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Grade</p>
                  <p className="text-sm font-semibold">Grade {student.grade} {student.section}</p>
                </div>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Attendance</p>
                  <p className="text-sm font-semibold">{student.attendance_score ?? 100}%</p>
                </div>
              </div>
              {student.bus_registered && (
                <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-2 col-span-2">
                  <Bus className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Bus Route</p>
                    <p className="text-sm font-semibold">{student.bus_route || "Registered"}</p>
                  </div>
                </div>
              )}
            </div>
            {student.parent_name && (
              <div className="text-xs text-muted-foreground border-t pt-3">
                Parent/Guardian: <span className="font-medium text-foreground">{student.parent_name}</span>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}