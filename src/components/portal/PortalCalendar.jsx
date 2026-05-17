import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Video, LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";

export default function PortalCalendar({ student }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [joinedClass, setJoinedClass] = useState(null);
  const [joinedAt, setJoinedAt] = useState(null);

  const { data: schedules = [] } = useQuery({
    queryKey: ["student-schedule", student?.grade],
    queryFn: () => base44.entities.ClassSchedule.filter({ grade: student.grade }),
    enabled: !!student?.grade,
  });

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Get calendar days
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get classes for a specific day
  const getClassesForDay = (date) => {
    const dayName = dayNames[date.getDay()];
    return schedules.filter(s => s.day_of_week === dayName);
  };

  // Check if a class is live now
  const isLiveNow = (schedule) => {
    const now = new Date();
    const current = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return current >= schedule.start_time && current <= schedule.end_time;
  };

  const classesOnSelectedDay = getClassesForDay(selectedDate);
  const today = new Date();
  const isToday = isSameDay(selectedDate, today);

  const handleJoin = (schedule) => {
    setJoinedClass(schedule);
    setJoinedAt(new Date().toLocaleTimeString());
  };

  const handleLeave = () => {
    setJoinedClass(null);
    setJoinedAt(null);
  };

  // Pad calendar with empty days
  const firstDayOfWeek = monthStart.getDay();
  const paddedDays = [
    ...Array(firstDayOfWeek).fill(null),
    ...calendarDays
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Schedule Calendar</h2>
      </div>

      <Card>
        <CardContent className="p-4">
          {/* Month/Year Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{format(selectedDate, "MMMM yyyy")}</h3>
            <div className="flex gap-2">
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-8 px-3"
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
              >
                ←
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-8 px-3"
                onClick={() => setSelectedDate(new Date())}
              >
                Today
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-8 px-3"
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
              >
                →
              </button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {days.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground p-2">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {paddedDays.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="p-2" />;
              
              const dayClasses = getClassesForDay(day);
              const isSelected = isSameDay(day, selectedDate);
              const isCurrent = isSameDay(day, today);
              const hasClasses = dayClasses.length > 0;
              const hasLiveClass = dayClasses.some(isLiveNow);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`p-2 rounded-lg text-sm border transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : isCurrent
                      ? "border-primary/50 bg-primary/10"
                      : "border-border hover:bg-accent"
                  } ${hasClasses ? "font-semibold" : ""}`}
                >
                  <div>{format(day, "d")}</div>
                  {hasClasses && (
                    <div className="flex gap-0.5 mt-1 justify-center">
                      {dayClasses.slice(0, 2).map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 w-1.5 rounded-full ${
                            hasLiveClass ? "bg-green-500" : "bg-blue-500"
                          }`}
                        />
                      ))}
                      {dayClasses.length > 2 && <span className="text-[10px]">+{dayClasses.length - 2}</span>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Schedule */}
      {classesOnSelectedDay.length > 0 ? (
        <div>
          <h3 className="font-semibold text-sm mb-3">
            {isToday ? "Today's Classes" : format(selectedDate, "EEEE, MMMM d")}
          </h3>
          <div className="space-y-3">
            {classesOnSelectedDay.map(schedule => {
              const live = isLiveNow(schedule);
              return (
                <Card key={schedule.id} className={live ? "border-green-200 bg-green-50/30" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-sm">{schedule.subject_name}</h4>
                        <p className="text-xs text-muted-foreground">{schedule.teacher_name}</p>
                      </div>
                      {live && <Badge className="bg-green-600">LIVE</Badge>}
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
                    <button
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed h-8 px-3 w-full text-xs"
                      onClick={() => handleJoin(schedule)}
                    >
                      <Video className="h-3 w-3 mr-1.5" />
                      {live ? "Join Class" : "Class Details"}
                    </button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground text-sm">
            No classes on {isToday ? "today" : format(selectedDate, "EEEE, MMMM d")}
          </p>
        </Card>
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
            <button
              className="cursor-pointer bg-rose-500 text-white hover:bg-rose-600 rounded-xl px-4 py-2 w-full"
              onClick={handleLeave}
            >
              <LogOut className="h-3 w-3 mr-1.5" />
              Leave Class
            </button>
          </div>
          <DialogClose />
        </DialogContent>
      </Dialog>
    </div>
  );
}