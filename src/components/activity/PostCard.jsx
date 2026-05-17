import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Send, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const roleBadge = { admin: "bg-primary text-primary-foreground", teacher: "bg-blue-100 text-blue-700", student: "bg-green-100 text-green-700" };

export default function PostCard({ post, currentUser, comments, onRefresh, onAuthorClick }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const likedBy = post.liked_by ? post.liked_by.split(",").filter(Boolean) : [];
  const isLiked = likedBy.includes(currentUser?.email);

  const handleLike = async () => {
    let updated;
    if (isLiked) {
      updated = likedBy.filter(e => e !== currentUser?.email).join(",");
    } else {
      updated = [...likedBy, currentUser?.email].join(",");
    }
    await base44.entities.ActivityPost.update(post.id, { liked_by: updated, likes: updated.split(",").filter(Boolean).length });
    onRefresh();
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    const role = currentUser?.role === "admin" ? "admin" : "student";
    await base44.entities.ActivityComment.create({
      post_id: post.id,
      author_name: currentUser?.full_name || "Unknown",
      author_email: currentUser?.email,
      author_role: role,
      content: commentText.trim()
    });
    setCommentText("");
    setSubmitting(false);
    onRefresh();
  };

  const handleDeletePost = async () => {
    await base44.entities.ActivityPost.delete(post.id);
    onRefresh();
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
                <button onClick={() => onAuthorClick?.(post.author_email)} className="text-sm font-semibold hover:underline text-left">
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
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={handleDeletePost}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
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
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-sm transition-colors ${isLiked ? "text-red-500 font-medium" : "text-muted-foreground hover:text-red-500"}`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500" : ""}`} />
            {post.likes || 0}
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
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
                onKeyDown={e => e.key === "Enter" && handleComment()}
                className="h-8 text-xs"
              />
              <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleComment} disabled={submitting || !commentText.trim()}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}