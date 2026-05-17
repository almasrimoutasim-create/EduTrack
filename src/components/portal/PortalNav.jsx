import { Home, Users, MessageCircle, Newspaper, BookOpen, GraduationCap, Calendar, Star, Bell, Video } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { key: "home", label: "Profile", icon: Home },
  { key: "calendar", label: "Calendar", icon: Calendar },
  { key: "grades", label: "Grades", icon: GraduationCap },
  { key: "liveclasses", label: "Live", icon: Video },
  { key: "books", label: "Books", icon: BookOpen },
  { key: "activity", label: "Feed", icon: Newspaper },
  { key: "studygroups", label: "Study", icon: BookOpen },
  { key: "friends", label: "Friends", icon: Users },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "chat", label: "Chat", icon: MessageCircle },
  { key: "rateteachers", label: "Rate", icon: Star },
];

export default function PortalNav({ active, onChange, unreadNotifs = 0, unreadMessages = 0 }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border flex sm:static sm:border-t-0 sm:border-b sm:border-border sm:bg-card sm:rounded-xl sm:shadow">
      {tabs.map(({ key, label, icon: Icon }) => {
        const badge = key === "notifications" ? unreadNotifs : key === "chat" ? unreadMessages : 0;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors relative",
              active === key
                ? "text-primary sm:border-b-2 sm:border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="relative">
              <Icon className="h-5 w-5" />
              {badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}