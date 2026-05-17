import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, LogOut, QrCode } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import JoinRoomDialog from "./JoinRoomDialog";

export default function PortalLiveClasses({ student }) {
  const [joinedClass, setJoinedClass] = useState(null);
  const [joinedAt, setJoinedAt] = useState(null);
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  const { data: schedules = [] } = useQuery({
    queryKey: ["student-schedule", student?.grade],
    queryFn: () => base44.entities.ClassSchedule.filter({ grade: student.grade }),
    enabled: !!student?.grade,
  });

  // Get today's day of week
  const getDayOfWeek = () => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[new Date().getDay()];
  };

  // Get current time in HH:MM format
  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  };

  // Filter classes for today
  const todayClasses = schedules.filter(s => s.day_of_week === getDayOfWeek());

  // Check if class is currently live (within time window)
  const isLiveNow = (schedule) => {
    const current = getCurrentTime();
    return current >= schedule.start_time && current <= schedule.end_time;
  };

  const handleJoin = (schedule) => {
    setJoinedClass(schedule);
    setJoinedAt(new Date().toLocaleTimeString());
  };

  const handleLeave = () => {
    setJoinedClass(null);
    setJoinedAt(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Live Classes</h2>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowJoinDialog(true)}
          className="gap-1.5"
        >
          <QrCode className="h-4 w-4" />
          <span className="hidden sm:inline">Join by Code</span>
          <span className="sm:hidden">Code</span>
        </Button>
      </div>

      {todayClasses.length === 0 ? (
        <Card className="p-8 text-center">
          <Video className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No classes scheduled for today.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {todayClasses.map(schedule => {
            const live = isLiveNow(schedule);
            return (
              <Card key={schedule.id} className={live ? "border-green-200 bg-green-50/30" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-sm">{schedule.subject_name}</h3>
                      <p className="text-xs text-muted-foreground">{schedule.teacher_name}</p>
                    </div>
                    {live && <Badge className="bg-green-600">LIVE NOW</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <p className="text-muted-foreground">Time</p>
                      <p className="font-medium">{schedule.start_time} - {schedule.end_time}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Room</p>
                      <p className="font-medium">{schedule.room || "TBA"}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => handleJoin(schedule)}
                  >
                    <Video className="h-3 w-3 mr-1.5" />
                    {live ? "Join Class" : "View Class Details"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Join Class Dialog */}
      <Dialog open={!!joinedClass} onOpenChange={(open) => !open && handleLeave()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-4 w-4 text-green-600" />
              {joinedClass?.subject_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Teacher</p>
              <p className="font-semibold">{joinedClass?.teacher_name}</p>
            </div>
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Joined at</p>
              <p className="font-semibold">{joinedAt}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-xs text-blue-700 text-center">
                📹 Live video feed would be displayed here. This is a placeholder for the video conference interface.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={handleLeave}
            >
              <LogOut className="h-3 w-3 mr-1.5" />
              Leave Class
            </Button>
          </div>
          <DialogClose />
        </DialogContent>
      </Dialog>

      {/* Join Room by Code Dialog */}
      <JoinRoomDialog
        isOpen={showJoinDialog}
        onClose={() => setShowJoinDialog(false)}
        onJoinSuccess={() => setShowJoinDialog(false)}
        student={student}
      />
    </div>
  );
}