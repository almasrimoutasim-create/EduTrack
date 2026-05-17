import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import VisualSchedule from "@/components/schedule/VisualSchedule";
import { Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function PortalSchedule({ student }) {
  // Fetch classes for student's grade
  const { data: allClasses = [], isLoading: loadingClasses } = useQuery({
    queryKey: ["student-schedule", student.grade],
    queryFn: () => base44.entities.ClassSchedule.filter({ grade: student.grade }),
  });

  // Fetch tasks for student's grade
  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ["student-tasks", student.grade],
    queryFn: () => base44.entities.TeacherTask.filter({ grade: student.grade }),
  });

  if (loadingClasses || loadingTasks) return (
    <p className="text-center text-sm text-muted-foreground py-8">Loading schedule...</p>
  );

  if (allClasses.length === 0) return (
    <Card className="p-10 text-center">
      <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-muted-foreground text-sm">No classes scheduled for Grade {student.grade} yet.</p>
      <p className="text-xs text-muted-foreground mt-1">Your teacher will add classes to your schedule.</p>
    </Card>
  );

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">My Schedule — Grade {student.grade}</h3>
      <VisualSchedule classes={allClasses} tasks={tasks} />
    </div>
  );
}