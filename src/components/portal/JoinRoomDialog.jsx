import { useState } from "react";
import { entities } from "@/api/dbClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";

export default function JoinRoomDialog({ isOpen, onClose, onJoinSuccess, student }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleJoin = async () => {
    if (!code.trim()) {
      setError("Please enter a room code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Find room by code
      const rooms = await entities.StudyRoom.list();
      const room = rooms.find(r => r.code && r.code.toUpperCase() === code.toUpperCase());

      if (!room) {
        setError("Room code not found. Check and try again.");
        setLoading(false);
        return;
      }

      // Navigate to the room
      window.location.href = `/room-view?room_id=${room.id}`;
      toast.success(`Joining ${room.name}...`);
      onJoinSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to join room");
      toast.error("Failed to join room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join a Room</DialogTitle>
          <DialogDescription>Enter the room code to join a study session</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Enter room code (e.g., ABC123)"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            disabled={loading}
            className="uppercase"
          />

          {error && (
            <div className="flex gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-1 h-11 px-4" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button onClick={handleJoin} disabled={loading} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex-1 h-11 px-4 gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Join Room
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}