import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Bell, MessageSquare, X } from "lucide-react";
import { format } from "date-fns";

export default function ClassStartNotification({ student }) {
  const [showNotifications, setShowNotifications] = useState([]);
  const qc = useQueryClient();

  const { data: schedule = [] } = useQuery({
    queryKey: ["student-schedule", student?.grade],
    queryFn: () => base44.entities.ClassSchedule.filter({ grade: student.grade }),
    enabled: !!student?.grade,
    refetchInterval: 60000, // Check every minute
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["live-rooms"],
    queryFn: () => base44.entities.StudyRoom.filter({ status: "live" }),
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!schedule.length) return;

    const checkForStartingClasses = () => {
      const now = new Date();
      const currentTime = format(now, "HH:mm");
      const currentDay = format(now, "EEEE");

      schedule.forEach((cls) => {
        // Check if class is starting now (within 5 minute window)
        const [classHour, classMin] = cls.start_time?.split(":") || [];
        if (!classHour) return;

        const classTime = `${classHour}:${classMin}`;
        const timeDiff = Math.abs(
          new Date(`2000-01-01 ${classTime}`).getTime() -
            new Date(`2000-01-01 ${currentTime}`).getTime()
        );
        const minutesDiff = timeDiff / 60000;

        if (
          minutesDiff <= 5 &&
          minutesDiff >= 0 &&
          cls.day_of_week === currentDay
        ) {
          // Find matching room if available
          const matchingRoom = rooms.find(
            (r) =>
              r.subject_name === cls.subject_name &&
              r.grade === cls.grade &&
              r.status === "live"
          );

          // Check if notification already shown
          const notifId = `${cls.id}-${format(now, "yyyy-MM-dd")}`;
          const alreadyShown = showNotifications.some((n) => n.id === notifId);

          if (!alreadyShown) {
            setShowNotifications((prev) => [
              ...prev,
              {
                id: notifId,
                class: cls,
                room: matchingRoom,
                timestamp: now,
              },
            ]);
          }
        }
      });
    };

    checkForStartingClasses();
    const interval = setInterval(checkForStartingClasses, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [schedule, rooms, showNotifications]);

  if (showNotifications.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-4 z-50 space-y-2 max-w-sm">
      {showNotifications.map((notif) => (
        <div
          key={notif.id}
          className="bg-primary text-primary-foreground rounded-xl shadow-lg p-4 border border-primary/20 animate-in slide-in-from-bottom-4"
        >
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Class Starting Now!</p>
              <p className="text-xs opacity-90 mt-0.5">
                {notif.class.subject_name}
                {notif.class.teacher_name && ` • ${notif.class.teacher_name}`}
              </p>
              {notif.room && (
                <div className="flex items-center gap-1 mt-2 text-xs opacity-90">
                  <MessageSquare className="h-3 w-3" />
                  <span>Room chat available</span>
                </div>
              )}
            </div>
            <button
              onClick={() =>
                setShowNotifications((prev) =>
                  prev.filter((n) => n.id !== notif.id)
                )
              }
              className="opacity-70 hover:opacity-100 transition-opacity shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {notif.room && (
            <button
              className="cursor-pointer bg-stone-100 text-stone-800 hover:bg-stone-200 rounded-xl px-4 py-2 w-full mt-3 gap-2 text-xs"
              onClick={() => {
                window.location.href = `/room-view?room=${notif.room.id}&name=${student?.full_name || "Student"}`;
              }}
            >
              <MessageSquare className="h-3 w-3" />
              Join Class Chat
            </button>
          )}
        </div>
      ))}
    </div>
  );
}