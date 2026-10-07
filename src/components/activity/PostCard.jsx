import { useState } from "react";
import { entities } from "@/api/dbClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Send, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const roleBadge = { admin: "bg-primary text-primary-foreground", teacher: "bg-blue-100 text-blue-700", student: "bg-green-100 text-green-700" };

export default function PostCard({ post, currentUser, comments, onRefresh, onAuthorClick }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [liking, setLiking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const likedBy = post.liked_by ? post.liked_by.split(",").filter(Boolean) : [];
  const isLiked = likedBy.includes(currentUser?.email);

  const handleLike = async () => {
    if (liking || !currentUser?.email) return;
    setLiking(true);
    const previousLikedBy = post.liked_by;
    const previousLikes = post.likes;
    try {
      let updated;
      if (isLiked) {
        updated = likedBy.filter(e => e !== currentUser?.email).join(",");
      } else {
        updated = [...likedBy, currentUser?.email].join(",");
      }
      await entities.ActivityPost.update(post.id, { liked_by: updated, likes: updated.split(",").filter(Boolean).length });
      await onRefresh?.();
    } catch (err) {
      console.error("[PostCard] like failed:", err);
      toast.error("تعذر تسجيل الإعجاب");
      // rollback is handled by refetch; no local optimistic state kept
      void previousLikedBy; void previousLikes;
    } finally {
      setLiking(false);
    }
  };

  const handleComment = async () => {
    if (submitting) return;
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const role = currentUser?.role === "admin" ? "admin" : "student";
      await entities.ActivityComment.create({
        post_id: post.id,
        author_name: currentUser?.full_name || "Unknown",
        author_email: currentUser?.email,
        author_role: role,
        content: commentText.trim()
      });
      setCommentText("");
      await onRefresh?.();
    } catch (err) {
      console.error("[PostCard] comment failed:", err);
      toast.error(err?.message || "تعذر إرسال التعليق");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (deleting || !window.confirm("حذف هذا المنشور؟")) return;
    setDeleting(true);
    try {
      await entities.ActivityPost.delete(post.id);
      await onRefresh?.();
      toast.success("تم حذف المنشور");
    } catch (err) {
      console.error("[PostCard] delete failed:", err);
      toast.error(err?.message || "تعذر حذف المنشور");
    } finally {
      setDeleting(false);
    }
  };

  const postComments = comments.filter(c => c.post_id === post.id);
  const canDelete = currentUser?.role === "admin" || currentUser?.email === post.author_email;

  return (
    <Card className="shadow-sm">
      <CardContent className="pt-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary font-bold text-sm overflow-hidden">
              {post.author_photo
                ? <img src={post.author_photo} className="h-full w-full object-cover" />
                : post.author_name?.[0] || "?"}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => onAuthorClick?.(post.author_email)} className="text-sm font-semibold hover:underline text-left">
                  {post.author_name}
                </button>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${roleBadge[post.author_role] || roleBadge.student}`}>
                  {post.author_role}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {post.created_date ? formatDistanceToNow(new Date(post.created_date), { addSuffix: true }) : "just now"}
              </p>
            </div>
          </div>
          {canDelete && (
            <button type="button" disabled={deleting} aria-label="Delete post" className="cursor-pointer text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg px-3 py-2 h-7 w-7 p-0 flex items-center justify-center text-muted-foreground hover:text-destructive disabled:opacity-50" onClick={handleDeletePost}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Content */}
        {post.content && <p className="text-sm leading-relaxed">{post.content}</p>}

        {/* Media */}
        {post.media_url && post.media_type === "image" && (
          <img src={post.media_url} className="w-full rounded-xl object-cover max-h-80 border" />
        )}
        {post.media_url && post.media_type === "video" && (
          <video src={post.media_url} controls className="w-full rounded-xl max-h-72 bg-black" />
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1 border-t">
          <button
            type="button"
            onClick={handleLike}
            disabled={liking || !currentUser?.email}
            aria-pressed={isLiked}
            title={!currentUser?.email ? "سجل الدخول للتفاعل" : isLiked ? "إلغاء الإعجاب" : "إعجاب"}
            className={`flex items-center gap-1.5 text-sm transition-colors ${isLiked ? "text-red-500 font-medium" : "text-muted-foreground hover:text-red-500"}`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500" : ""}`} />
            {post.likes || 0}
          </button>
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            aria-expanded={showComments}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            {postComments.length} {showComments ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="space-y-2 pt-1">
            {postComments.map(c => (
              <div key={c.id} className="flex gap-2 bg-muted/40 rounded-lg px-3 py-2">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary text-xs font-bold">
                  {c.author_name?.[0] || "?"}
                </div>
                <div>
                  <p className="text-xs font-semibold">{c.author_name}</p>
                  <p className="text-xs text-muted-foreground">{c.content}</p>
                </div>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <Input
                placeholder="Write a comment..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
                className="h-8 text-xs"
              />
              <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed h-8 w-8 p-0 shrink-0" onClick={handleComment} disabled={submitting || !commentText.trim()} title={submitting ? "جاري الإرسال..." : "إرسال التعليق"}>
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}