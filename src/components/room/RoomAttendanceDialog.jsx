import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, CreditCard, Search, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const STATUS_COLORS = {
  present: "bg-emerald-50 text-emerald-700 border-emerald-200",
  absent:  "bg-red-50 text-red-700 border-red-200",
  late:    "bg-amber-50 text-amber-700 border-amber-200",
};

export default function RoomAttendanceDialog({ room, open, onClose }) {
  const [cardInput, setCardInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const inputRef = useRef(null);
  const qc = useQueryClient();

  const today = new Date().toISOString().split("T")[0];

  // Fetch today's attendance for this room
  const { data: attendanceList = [] } = useQuery({
    queryKey: ["room-attendance", room?.id, today],
    queryFn: () => base44.entities.Attendance.filter({
      subject_name: room?.room_code,
      date: today,
      type: "class",
    }),
    enabled: open && !!room,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const handleScan = async () => {
    const cardId = cardInput.trim().toUpperCase();
    if (!cardId) return;
    setScanning(true);

    // Look up student by card ID
    const students = await base44.entities.Student.filter({ student_id: cardId });
    // Also try matching student_id as card number
    let student = students[0];

    // If not found by student_id, try by card_balance field isn't card id — let's check if student exists
    if (!student) {
      toast.error(`No student found for card ID: ${cardId}`);
      setCardInput("");
      setScanning(false);
      inputRef.current?.focus();
      return;
    }

    // Check if already marked
    const alreadyMarked = attendanceList.find(a => a.student_card_id === cardId || a.student_id === student.id);
    if (alreadyMarked) {
      toast.warning(`${student.full_name} is already marked as ${alreadyMarked.status}`);
      setCardInput("");
      setScanning(false);
      inputRef.current?.focus();
      return;
    }

    // Mark as present
    await base44.entities.Attendance.create({
      student_id: student.id,
      student_name: student.full_name,
      student_card_id: cardId,
      date: today,
      type: "class",
      subject_name: room.room_code,
      status: "present",
      time: format(new Date(), "HH:mm"),
      notes: `Room: ${room.title}`,
      recorded_by: "card_scan",
    });

    qc.invalidateQueries({ queryKey: ["room-attendance", room.id, today] });
    toast.success(`✓ ${student.full_name} marked present`);
    setCardInput("");
    setScanning(false);
    inputRef.current?.focus();
  };

  const handleMarkManual = async (studentId, studentName, cardId, status) => {
    await base44.entities.Attendance.create({
      student_id: studentId,
      student_name: studentName,
      student_card_id: cardId || "",
      date: today,
      type: "class",
      subject_name: room.room_code,
      status,
      time: format(new Date(), "HH:mm"),
      notes: `Room: ${room.title}`,
      recorded_by: "manual",
    });
    qc.invalidateQueries({ queryKey: ["room-attendance", room.id, today] });
    toast.success(`${studentName} marked as ${status}`);
  };

  const presentCount = attendanceList.filter(a => a.status === "present").length;
  const lateCount = attendanceList.filter(a => a.status === "late").length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Room Attendance
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{room?.title} · {room?.room_code} · {today}</p>
        </DialogHeader>

        {/* Stats */}
        <div className="flex gap-3 shrink-0">
          <div className="flex-1 bg-emerald-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-emerald-700">{presentCount}</p>
            <p className="text-xs text-emerald-600">Present</p>
          </div>
          <div className="flex-1 bg-amber-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-700">{lateCount}</p>
            <p className="text-xs text-amber-600">Late</p>
          </div>
          <div className="flex-1 bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-slate-700">{attendanceList.length}</p>
            <p className="text-xs text-slate-600">Total</p>
          </div>
        </div>

        {/* Card Scanner */}
        <div className="shrink-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5" /> Scan / Enter Student Card ID
          </p>
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Scan card or type student ID..."
              value={cardInput}
              onChange={e => setCardInput(e.target.value.toUpperCase())}
              onKeyDown={e => { if (e.key === "Enter") handleScan(); }}
              className="font-mono font-bold tracking-widest text-lg"
              disabled={scanning}
              autoComplete="off"
            />
            <Button onClick={handleScan} disabled={scanning || !cardInput.trim()} className="gap-1.5">
              <Search className="h-4 w-4" /> Mark
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Press Enter or click Mark after scanning</p>
        </div>

        {/* Attendance Log */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Logged Today ({attendanceList.length})</p>
          {attendanceList.length === 0 ? (
            <Card className="p-6 text-center border shadow-sm">
              <UserCheck className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No attendance recorded yet</p>
              <p className="text-xs text-muted-foreground">Scan a student card to begin</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {attendanceList.map((record) => (
                <div key={record.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{record.student_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {record.student_card_id && (
                        <span className="text-xs text-muted-foreground font-mono">{record.student_card_id}</span>
                      )}
                      {record.time && (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />{record.time}
                        </span>
                      )}
                      {record.recorded_by === "card_scan" ? (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <CreditCard className="h-3 w-3" /> Card
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Manual</span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[record.status] || ""}`}>
                    {record.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}