import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Video, Search, BookOpen, Clock, MessageSquare, Radio } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

const PLATFORM_CONFIG = {
  zoom:            { label: "Zoom",         color: "bg-blue-50 text-blue-700" },
  google_meet:     { label: "Google Meet",  color: "bg-green-50 text-green-700" },
  microsoft_teams: { label: "Teams",        color: "bg-indigo-50 text-indigo-700" },
  other:           { label: "Online",       color: "bg-gray-50 text-gray-700" },
};

function RoomCard({ room }) {
  const plt = PLATFORM_CONFIG[room.platform] || PLATFORM_CONFIG.other;
  const isLive = room.status === "live";
  return (
    <Card className={`p-5 border shadow-sm ${isLive ? "border-red-200 bg-red-50/20" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {isLive && (
              <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                <Radio className="h-3 w-3 animate-pulse" /> LIVE
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${plt.color}`}>{plt.label}</span>
            {room.grade && <Badge variant="secondary" className="text-xs">Grade {room.grade}</Badge>}
          </div>
          <h3 className="font-semibold text-base">{room.title}</h3>
          {room.subject_name && <p className="text-sm text-muted-foreground">{room.subject_name}</p>}
          {room.teacher_name && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <BookOpen className="h-3 w-3" /> {room.teacher_name}
            </p>
          )}
          {room.scheduled_at && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3" />
              {format(new Date(room.scheduled_at), "EEE, MMM d · HH:mm")} · {room.duration_minutes}min
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="font-mono text-lg font-bold tracking-widest text-primary">{room.room_code}</span>
          <Link to={`/room-view?room=${room.id}`}>
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed h-8 px-3 gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" /> {isLive ? "Join" : "Open"}
            </button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

export default function StudentRoomsTab({ studentGrade }) {
  const [codeInput, setCodeInput] = useState("");
  const [searchedRoom, setSearchedRoom] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const { data: rooms = [] } = useQuery({
    queryKey: ["study-rooms"],
    queryFn: () => base44.entities.StudyRoom.list("-created_date"),
  });

  const available = rooms.filter(r =>
    (r.status === "live" || r.status === "upcoming") &&
    (!r.target_grades || !r.target_grades.trim() || r.target_grades.includes(studentGrade))
  );

  const handleSearch = () => {
    const code = codeInput.trim().toUpperCase();
    const found = rooms.find(r => r.room_code === code);
    if (found) { setSearchedRoom(found); setNotFound(false); }
    else { setSearchedRoom(null); setNotFound(true); }
  };

  return (
    <div className="space-y-5">
      <Card className="p-4 border shadow-sm">
        <p className="text-sm font-medium mb-3">Join by Room Code</p>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. AB1C2D"
            value={codeInput}
            onChange={e => { setCodeInput(e.target.value.toUpperCase()); setNotFound(false); setSearchedRoom(null); }}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            className="font-mono font-bold tracking-widest uppercase"
            maxLength={8}
          />
          <button onClick={handleSearch} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed h-11 px-4 gap-2 shrink-0"><Search className="h-4 w-4" /> Find</button>
        </div>
        {notFound && <p className="text-sm text-destructive mt-2">No room found with that code.</p>}
        {searchedRoom && (
          <div className="mt-4">
            <p className="text-xs text-emerald-600 font-semibold mb-2">✓ Room found!</p>
            <RoomCard room={searchedRoom} />
          </div>
        )}
      </Card>

      {available.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Active & Upcoming Sessions</h3>
          <div className="space-y-3">
            {available.map(r => <RoomCard key={r.id} room={r} />)}
          </div>
        </div>
      ) : (
        <Card className="p-10 text-center border shadow-sm">
          <Video className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground">No active sessions right now.</p>
        </Card>
      )}
    </div>
  );
}