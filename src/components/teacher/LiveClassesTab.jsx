import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Video, Plus, Play, Copy, Users, Trash2, ExternalLink, Share2 } from "lucide-react";

export default function LiveClassesTab({ teacher }) {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showShare, setShowShare] = useState(null);
  const [platformUrl, setPlatformUrl] = useState("");
  const [form, setForm] = useState({ room_name: "", subject_name: "", grade: "1", section: "أبو بكر", description: "" });
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const { data: rooms = [] } = useQuery({
    queryKey: ["teacher-rooms", teacher.id],
    queryFn: () => entities.StudyRoom.filter({ created_by_id: teacher.id }, "-created_date"),
  });

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const openGoogleMeet = () => {
    window.open("https://meet.google.com/new", "_blank");
    setShowCreate(false);
  };

  const openZoom = () => {
    window.open("https://zoom.us/", "_blank");
    setShowCreate(false);
  };

  const save = async () => {
    setSaving(true);
    const roomCode = generateRoomCode();
    const newRoom = await entities.StudyRoom.create({
      title: form.room_name,
      subject_name: form.subject_name,
      grade: form.grade,
      section: form.section,
      description: form.description,
      created_by_id: teacher.id,
      created_by_name: teacher.full_name,
      room_code: roomCode,
      status: "active",
      platform: "internal",
      participants_count: 0,
      is_recording: false,
    });

    // Notify all students in this class
    const students = await entities.Student.filter({ grade: form.grade }, "");
    const notifications = students.map(student => ({
      user_id: student.id,
      user_email: student.user_email,
      type: "class_started",
      title: `Live Class Started: ${form.room_name}`,
      message: `${teacher.full_name} started a live ${form.subject_name} class. Room Code: ${roomCode}`,
      link: `/room-view?roomId=${newRoom.id}&mode=attend`,
      is_read: false,
    }));
    
    if (notifications.length > 0) {
      await entities.PortalNotification.bulkCreate(notifications);
    }

    qc.invalidateQueries(["teacher-rooms", teacher.id]);
    setSaving(false);
    setShowCreate(false);
    setForm({ room_name: "", subject_name: "", grade: "1", section: "أبو بكر", description: "" });
    
    // Open the room
    window.open(`/room-view?roomId=${newRoom.id}&mode=teach`, "_blank");
  };

  const startClass = (room) => {
    window.open(`/room-view?roomId=${room.id}&mode=teach`, "_blank");
  };

  const deleteRoom = async (id) => {
    if (confirm("Are you sure you want to delete this class?")) {
      await entities.StudyRoom.delete(id);
      qc.invalidateQueries(["teacher-rooms", teacher.id]);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    alert("Room code copied!");
  };

  const openShareModal = (room) => {
    setShowShare(room);
    setPlatformUrl("");
  };

  const shareWithStudent = async () => {
    if (!platformUrl.trim()) {
      alert("Please enter the meeting link");
      return;
    }

    const message = `Join my class "${showShare.room_name}" (${showShare.subject_name})\n\nMeeting Link: ${platformUrl}\n\nRoom Code: ${showShare.room_code}`;
    
    // Copy to clipboard for easy sharing
    navigator.clipboard.writeText(message);
    alert("Room details copied! Share with your students.");
    setShowShare(null);
    setPlatformUrl("");
  };

  const jumpToMeeting = () => {
    if (!platformUrl.trim()) {
      alert("Please enter the meeting link");
      return;
    }
    window.open(platformUrl, "_blank");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Live Classes</h3>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed h-8 px-3 gap-1.5">
          <Plus className="h-4 w-4" /> Start Class
        </button>
      </div>

      {rooms.length === 0 ? (
        <Card className="p-8 text-center">
          <Video className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No live classes yet. Create one to get started.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {rooms.map(room => (
            <Card key={room.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{room.room_name}</h4>
                    <Badge variant={room.status === "active" ? "default" : "secondary"} className="text-xs capitalize">
                      {room.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {room.subject_name} · Grade {room.grade}
                    {room.section ? ` · ${room.section}` : ""}
                  </p>
                  {room.description && (
                    <p className="text-xs text-muted-foreground mt-1">{room.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t">
                <div className="flex-1 flex gap-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{room.participants_count || 0} in room</span>
                  </div>
                  {room.is_recording && (
                    <div className="flex items-center gap-1 text-xs text-red-600">
                      <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                      <span>Recording</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => startClass(room)}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed h-8 px-3 gap-1.5 flex-1"
                >
                  <Play className="h-4 w-4" /> Start Class
                </button>
                <button
                  onClick={() => openShareModal(room)}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-8 px-3 gap-1.5"
                  title="Share with students"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => copyCode(room.room_code)}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-8 px-3 gap-1.5"
                  title="Copy room code"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteRoom(room.id)}
                  className="cursor-pointer text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg px-3 py-2 h-8"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {room.room_code && (
                <div className="bg-muted/50 rounded p-2">
                  <p className="text-xs text-muted-foreground mb-1">Room Code:</p>
                  <p className="text-sm font-mono font-bold">{room.room_code}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Live Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-2">
              <button 
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-11 px-4 gap-2"
                onClick={openGoogleMeet}
              >
                <ExternalLink className="h-4 w-4" /> Google Meet
              </button>
              <button 
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-11 px-4 gap-2"
                onClick={openZoom}
              >
                <ExternalLink className="h-4 w-4" /> Zoom
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or create internal room</span>
              </div>
            </div>
          </div>
          <div className="space-y-3 py-2">
            <div>
              <Label>Class Name *</Label>
              <Input
                className="mt-1"
                placeholder="e.g. Mathematics Lesson"
                value={form.room_name}
                onChange={e => upd("room_name", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Subject *</Label>
                <Input
                  className="mt-1"
                  value={form.subject_name}
                  onChange={e => upd("subject_name", e.target.value)}
                />
              </div>
              <div>
                <Label>Grade</Label>
                <Select value={form.grade} onValueChange={v => upd("grade", v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["1","2","3","4","5","6","7","8","9","10","11","12"].map(g => (
                      <SelectItem key={g} value={g}>Grade {g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Class / الفصل</Label>
                <select
                  value={form.section}
                  onChange={e => upd("section", e.target.value)}
                  className="w-full h-10 rounded-xl border border-stone-200 bg-white text-xs font-bold px-3 text-stone-700 outline-none cursor-pointer mt-1"
                >
                  <option value="أبو بكر">أبو بكر (Abu Bakr)</option>
                  <option value="عمر">عمر (Omar)</option>
                  <option value="عثمان">عثمان (Othman)</option>
                  <option value="علي">علي (Ali)</option>
                  <option value="حمزة">حمزة (Hamza)</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input
                className="mt-1"
                placeholder="What will you teach?"
                value={form.description}
                onChange={e => upd("description", e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-11 px-4" onClick={() => setShowCreate(false)}>Cancel</button>
            <button onClick={save} disabled={saving || !form.room_name || !form.subject_name} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed h-11 px-4">
              {saving ? "Creating..." : "Start Class"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showShare} onOpenChange={(open) => !open && setShowShare(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Room with Students</DialogTitle>
          </DialogHeader>
          {showShare && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/50 rounded p-3">
                <p className="text-xs text-muted-foreground mb-1">Class:</p>
                <p className="text-sm font-semibold">{showShare.room_name}</p>
                <p className="text-xs text-muted-foreground mt-1">{showShare.subject_name} · Grade {showShare.grade}</p>
              </div>
              
              <div>
                <Label>Meeting Link (Zoom or Google Meet)</Label>
                <Input
                  className="mt-2"
                  placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                  value={platformUrl}
                  onChange={e => setPlatformUrl(e.target.value)}
                />
              </div>

              <div className="bg-muted/50 rounded p-3">
                <p className="text-xs text-muted-foreground mb-1">Room Code:</p>
                <p className="text-sm font-mono font-bold">{showShare.room_code}</p>
              </div>

              <div className="space-y-2">
                <button 
                  onClick={jumpToMeeting}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed w-full h-11 px-4 gap-2"
                >
                  <ExternalLink className="h-4 w-4" /> Jump to Meeting
                </button>
                <button 
                  onClick={shareWithStudent}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full h-11 px-4 gap-2"
                >
                  <Copy className="h-4 w-4" /> Copy & Share Details
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}