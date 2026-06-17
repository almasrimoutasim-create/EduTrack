import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { fileClient } from "@/api/fileClient";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef } from "react";
import { Heart, MessageCircle, Image, Video, Send, Trash2 } from "lucide-react";

export default function PortalActivityFeed({ me }) {
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});
  const [openComments, setOpenComments] = useState({});
  const fileRef = useRef(null);

  const { data: posts = [] } = useQuery({
    queryKey: ["activity-posts"],
    queryFn: () => entities.ActivityPost.list("-created_date", 50),
    refetchInterval: 15000,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["activity-comments"],
    queryFn: () => entities.ActivityComment.list(),
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const submit = async () => {
    if (!content.trim() && !mediaFile) return;
    setUploading(true);
    let media_url = "";
    let media_type = "none";
    if (mediaFile) {
      const { file_url } = await fileClient.uploadFile({ file: mediaFile });
      media_url = file_url;
      media_type = mediaFile.type.startsWith("video") ? "video" : "image";
    }
    await entities.ActivityPost.create({
      author_name: me.full_name,
      author_email: me.student_id,
      author_role: "student",
      author_photo: me.photo_url || "",
      content: content.trim(),
      media_url,
      media_type,
      likes: 0,
      liked_by: "",
    });
    setContent(""); setMediaFile(null); setMediaPreview(null);
    setUploading(false);
    qc.invalidateQueries(["activity-posts"]);
  };

  const toggleLike = async (post) => {
    const liked = (post.liked_by || "").split(",").filter(Boolean);
    const alreadyLiked = liked.includes(me.id);
    const newLiked = alreadyLiked ? liked.filter(id => id !== me.id) : [...liked, me.id];
    await entities.ActivityPost.update(post.id, {
      likes: newLiked.length,
      liked_by: newLiked.join(","),
    });
    qc.invalidateQueries(["activity-posts"]);
  };

  const sendComment = async (postId) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    await entities.ActivityComment.create({
      post_id: postId,
      author_name: me.full_name,
      author_email: me.student_id,
      author_role: "student",
      content: text,
    });
    setCommentInputs(prev => ({ ...prev, [postId]: "" }));
    qc.invalidateQueries(["activity-comments"]);
  };

  const deletePost = async (post) => {
    await entities.ActivityPost.delete(post.id);
    qc.invalidateQueries(["activity-posts"]);
  };

  return (
    <div className="space-y-4">
      {/* Create Post */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">
              {me.full_name[0]}
            </div>
            <Textarea
              placeholder="Share something with the school..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="resize-none text-sm min-h-[70px]"
            />
          </div>
          {mediaPreview && (
            <div className="relative">
              {mediaFile?.type.startsWith("video") ? (
                <video src={mediaPreview} className="w-full rounded-lg max-h-48 object-cover" controls />
              ) : (
                <img src={mediaPreview} className="w-full rounded-lg max-h-48 object-cover" alt="" />
              )}
              <button onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs">✕</button>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button onClick={() => fileRef.current?.click()} className="text-muted-foreground hover:text-foreground">
                <Image className="h-4 w-4" />
              </button>
              <button onClick={() => fileRef.current?.click()} className="text-muted-foreground hover:text-foreground">
                <Video className="h-4 w-4" />
              </button>
              <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
            </div>
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed h-8 px-3 gap-1.5" onClick={submit} disabled={uploading || (!content.trim() && !mediaFile)}>
              <Send className="h-3.5 w-3.5" /> {uploading ? "Posting..." : "Post"}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Posts */}
      {posts.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">No posts yet. Be the first!</p>
      )}
      {posts.map(post => {
        const liked = (post.liked_by || "").split(",").filter(Boolean).includes(me.id);
        const postComments = comments.filter(c => c.post_id === post.id);
        const isOwn = post.author_email === me.student_id;

        return (
          <Card key={post.id}>
            <CardContent className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {post.author_photo ? (
                    <img src={post.author_photo} className="h-9 w-9 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                      {post.author_name[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm">{post.author_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{post.author_role} · {new Date(post.created_date).toLocaleDateString()}</p>
                  </div>
                </div>
                {isOwn && (
                  <button onClick={() => deletePost(post)} className="text-muted-foreground hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Content */}
              {post.content && <p className="text-sm">{post.content}</p>}
              {post.media_url && post.media_type === "image" && (
                <img src={post.media_url} className="w-full rounded-lg max-h-64 object-cover" alt="" />
              )}
              {post.media_url && post.media_type === "video" && (
                <video src={post.media_url} className="w-full rounded-lg max-h-64" controls />
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 pt-1">
                <button onClick={() => toggleLike(post)} className={`flex items-center gap-1.5 text-sm ${liked ? "text-red-500" : "text-muted-foreground hover:text-red-400"}`}>
                  <Heart className={`h-4 w-4 ${liked ? "fill-red-500" : ""}`} /> {post.likes || 0}
                </button>
                <button
                  onClick={() => setOpenComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <MessageCircle className="h-4 w-4" /> {postComments.length}
                </button>
              </div>

              {/* Comments */}
              {openComments[post.id] && (
                <div className="space-y-2 border-t pt-3">
                  {postComments.map(c => (
                    <div key={c.id} className="flex gap-2">
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                        {c.author_name[0]}
                      </div>
                      <div className="bg-muted rounded-xl px-3 py-1.5 text-sm flex-1">
                        <span className="font-semibold text-xs">{c.author_name} </span>
                        {c.content}
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-2">
                    <input
                      className="flex-1 text-sm border rounded-full px-3 py-1 bg-background outline-none focus:ring-1 focus:ring-ring"
                      placeholder="Write a comment..."
                      value={commentInputs[post.id] || ""}
                      onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && sendComment(post.id)}
                    />
                    <button className="cursor-pointer text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg px-3 py-2 h-8 w-8 p-0" onClick={() => sendComment(post.id)}>
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}