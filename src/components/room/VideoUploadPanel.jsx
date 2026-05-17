import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Video, Trash2, Loader2 } from "lucide-react";

export default function VideoUploadPanel({ roomId, videos = [], onVideoAdded, onVideoDeleted }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);



  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.RoomVideo.create({ room_id: roomId, video_url: file_url, title: file.name, type: "uploaded" });
    onVideoAdded();
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading..." : "Upload Video"}
        </Button>
        <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileUpload} />
      </div>

      {/* Saved Videos List */}
      {videos.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Saved Videos ({videos.length})</p>
          {videos.map(v => (
            <Card key={v.id} className="p-3 border">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Video className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{v.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{v.type}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onVideoDeleted(v.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <video src={v.video_url} controls className="w-full rounded-lg max-h-40 bg-black" />
            </Card>
          ))}
        </div>
      )}

      {videos.length === 0 && !uploading && (
        <div className="text-center py-6 text-muted-foreground">
          <Video className="h-10 w-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm">No videos yet. Upload one.</p>
        </div>
      )}
    </div>
  );
}