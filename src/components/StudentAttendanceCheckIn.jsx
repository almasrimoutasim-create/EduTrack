import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import QRCodeScanner from "@/components/QRCodeScanner";
import { CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function StudentAttendanceCheckIn({ studentId, studentName }) {
  const [showDialog, setShowDialog] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [attendanceType, setAttendanceType] = useState(null);
  const [recentCheckins, setRecentCheckins] = useState([]);
  const [loading, setLoading] = useState(false);

  const attendanceTypes = {
    gate_in: { label: "School Gate Entry", color: "bg-blue-50 text-blue-700", icon: "🚪" },
    gate_out: { label: "School Gate Exit", color: "bg-slate-50 text-slate-700", icon: "🚪" },
    bus_in: { label: "Bus Boarding", color: "bg-orange-50 text-orange-700", icon: "🚌" },
    bus_out: { label: "Bus Drop-off", color: "bg-amber-50 text-amber-700", icon: "🚌" },
    class: { label: "Class Check-in", color: "bg-emerald-50 text-emerald-700", icon: "📚" }
  };

  useEffect(() => {
    if (showDialog) {
      fetchRecentCheckins();
    }
  }, [showDialog]);

  const fetchRecentCheckins = async () => {
    try {
      const records = await base44.entities.Attendance.filter(
        { student_id: studentId },
        "-created_date",
        5
      );
      setRecentCheckins(records.filter(r => {
        const recordDate = new Date(r.date);
        const today = new Date();
        return recordDate.toDateString() === today.toDateString();
      }));
    } catch (err) {
      console.error("Failed to fetch checkins:", err);
    }
  };

  const handleQRScan = async (scannedValue) => {
    if (!attendanceType) return;

    setLoading(true);
    try {
      const now = new Date();
      const timeStr = format(now, "HH:mm:ss");
      const dateStr = format(now, "yyyy-MM-dd");

      // Create attendance record
      await base44.entities.Attendance.create({
        student_id: studentId,
        student_name: studentName,
        student_card_id: scannedValue,
        date: dateStr,
        time: timeStr,
        type: attendanceType,
        status: "present",
        recorded_by: "student_self_checkin"
      });

      toast.success(`✓ ${attendanceTypes[attendanceType].label} recorded`);
      setShowScanner(false);
      fetchRecentCheckins();
    } catch (err) {
      toast.error("Failed to record attendance");
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              📍 Quick Check-in
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Select Attendance Type */}
            <div>
              <p className="text-sm font-medium mb-2">What are you doing?</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(attendanceTypes).map(([type, config]) => (
                  <button
                    key={type}
                    className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-col items-center gap-1 h-auto py-3 ${attendanceType === type ? "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20" : "border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50"}`}
                    onClick={() => {
                      setAttendanceType(type);
                      setShowScanner(true);
                    }}
                  >
                    <span className="text-lg">{config.icon}</span>
                    <span className="text-xs text-center">{config.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Check-ins */}
            <div>
              <p className="text-sm font-medium mb-2">Today's Check-ins</p>
              {recentCheckins.length === 0 ? (
                <Card className="p-3 text-center bg-muted/30">
                  <p className="text-xs text-muted-foreground">No check-ins yet</p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {recentCheckins.map((record) => (
                    <Card key={record.id} className="p-3 bg-emerald-50 border-emerald-200">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-emerald-900">
                            {attendanceTypes[record.type]?.label || record.type}
                          </p>
                          <p className="text-xs text-emerald-700 flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {record.time}
                          </p>
                        </div>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Scan your student ID QR code to check in
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Scanner Modal */}
      <QRCodeScanner 
        isOpen={showScanner} 
        onClose={() => {
          setShowScanner(false);
          setAttendanceType(null);
        }} 
        onScan={handleQRScan}
      />

      {/* Floating Check-in Button */}
      <button
        onClick={() => setShowDialog(true)}
        className="fixed bottom-6 right-6 rounded-full shadow-lg h-14 w-14 p-0 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        📍
      </button>
    </>
  );
}