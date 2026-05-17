import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Image, Video, X, Loader2, Send } from "lucide-react";

export default function CreatePostCard({ user, studentProfile, onPostCreated }) {
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState("none");
  const [uploading, setUploading] = useState(false);
  const imageRef = useRef(null);
  const videoRef = useRef(null);

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaFile(file);
    setMediaType(type);
    setMediaPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType("none");
  };

  const handleSubmit = async () => {
    if (!content.trim() && !mediaFile) return;
    setUploading(true);
    let media_url = null;
    if (mediaFile) {
      const res = await base44.integrations.Core.UploadFile({ file: mediaFile });
      media_url = res.file_url;
    }
    const role = user?.role === "admin" ? "admin" : studentProfile ? "student" : "teacher";
    await base44.entities.ActivityPost.create({
      author_name: user?.full_name || "Unknown",
      author_email: user?.email,
      author_role: role,
      author_photo: studentProfile?.photo_url || null,
      content: content.trim(),
      media_url,
      media_type: mediaFile ? mediaType : "none",
      likes: 0,
      liked_by: ""
    });
    setContent("");
    clearMedia();
    setUploading(false);
    onPostCreated();
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="pt-4 space-y-3">
        <div className="flex gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
            {user?.full_name?.[0] || "?"}
          </div>
          <Textarea
            placeholder="Share something with your school community..."
            value={content}
            onChange={e => setContent(e.target.value)}
            className="resize-none min-h-[80px]"
          />
        </div>

        {mediaPreview && (
          <div className="relative rounded-xl overflow-hidden border">
            <button onClick={clearMedia} className="absolute top-2 right-2 z-10 bg-black/50 text-white rounded-full p-1 hover:bg-black/70">
              <X className="h-3.5 w-3.5" />
            </button>
            {mediaType === "image"
              ? <img src={mediaPreview} className="w-full max-h-64 object-cover" />
              : <video src={mediaPreview} controls className="w-full max-h-64 bg-black" />
            }
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-2">
            <button className="cursor-pointer text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg px-3 py-2 h-8 px-3 gap-1.5 text-muted-foreground" onClick={() => imageRef.current?.click()}>
              <Image className="h-4 w-4" /> Photo
            </button>
            <button className="cursor-pointer text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg px-3 py-2 h-8 px-3 gap-1.5 text-muted-foreground" onClick={() => videoRef.current?.click()}>
              <Video className="h-4 w-4" /> Video
            </button>
            <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e, "image")} />
            <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={e => handleFileSelect(e, "video")} />
          </div>
          <button onClick={handleSubmit} disabled={uploading || (!content.trim() && !mediaFile)} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed h-8 px-3 gap-1.5">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Post
          </button>
        </div>
      </CardContent>
    </Card>
  );
}