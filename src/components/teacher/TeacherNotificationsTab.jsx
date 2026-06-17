import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, AlertTriangle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function TeacherNotificationsTab({ teacher }) {
  const qc = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["teacher-notifications", teacher.id],
    queryFn: () =>
      entities.PortalNotification.filter({ recipient_id: teacher.id }, "-created_date", 50),
    refetchInterval: 30000,
  });

  const unread = notifications.filter(n => !n.is_read);

  const markAllRead = async () => {
    await Promise.all(unread.map(n => entities.PortalNotification.update(n.id, { is_read: true })));
    qc.invalidateQueries(["teacher-notifications", teacher.id]);
  };

  const markRead = async (n) => {
    if (n.is_read) return;
    await entities.PortalNotification.update(n.id, { is_read: true });
    qc.invalidateQueries(["teacher-notifications", teacher.id]);
  };

  const isAbsenceAlert = (msg) => /absent|late|missing/i.test(msg);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Attendance Alerts</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Notifications when students in your class are absent or late</p>
        </div>
        {unread.length > 0 && (
          <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-8 px-3 gap-1.5" onClick={markAllRead}>
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </button>
        )}
      </div>

      {/* Summary */}
      {unread.length > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 font-medium">
            {unread.length} unread alert{unread.length !== 1 ? "s" : ""}
          </p>
          <Badge className="ml-auto bg-amber-500 text-white border-0 text-xs">{unread.length}</Badge>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-10">
          <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <div className="text-center py-14">
          <Bell className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No alerts yet</p>
          <p className="text-xs text-muted-foreground mt-1">You'll be notified here when a student in your class is absent or late</p>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map(n => (
          <Card
            key={n.id}
            className={`cursor-pointer transition-colors ${!n.is_read ? "border-amber-200 bg-amber-50/40" : ""}`}
            onClick={() => markRead(n)}
          >
            <CardContent className="p-3 flex items-start gap-3">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isAbsenceAlert(n.message) ? "bg-red-100" : "bg-primary/10"}`}>
                {isAbsenceAlert(n.message)
                  ? <AlertTriangle className="h-4 w-4 text-red-600" />
                  : <Bell className="h-4 w-4 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.is_read ? "font-semibold" : "font-normal"}`}>{n.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(n.created_date), { addSuffix: true })}
                  </span>
                </div>
              </div>
              {!n.is_read && <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}