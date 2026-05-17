import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Trophy, Star, Medal, Crown, Award, Zap, Heart, Flame, Camera, Pencil, Check, X, Users, BookOpen,
  CreditCard, Image as ImageIcon, MessageCircle, Send, Tag } from
"lucide-react";

const AWARD_ICONS = { trophy: Trophy, star: Star, medal: Medal, crown: Crown, award: Award, zap: Zap, heart: Heart, flame: Flame };
const AWARD_COLORS = {
  gold: { bg: "bg-yellow-50", border: "border-yellow-300", icon: "text-yellow-500" },
  silver: { bg: "bg-gray-50", border: "border-gray-300", icon: "text-gray-400" },
  bronze: { bg: "bg-orange-50", border: "border-orange-300", icon: "text-orange-500" },
  blue: { bg: "bg-blue-50", border: "border-blue-300", icon: "text-blue-500" },
  green: { bg: "bg-green-50", border: "border-green-300", icon: "text-green-500" },
  purple: { bg: "bg-purple-50", border: "border-purple-300", icon: "text-purple-500" },
  red: { bg: "bg-red-50", border: "border-red-300", icon: "text-red-500" }
};

export function AwardBadge({ award, size = "md" }) {
  const IconComp = AWARD_ICONS[award.icon] || Trophy;
  const colors = AWARD_COLORS[award.color] || AWARD_COLORS.gold;
  const isSmall = size === "sm";
  return (
    <div className={`flex flex-col items-center gap-1 p-2 rounded-xl border ${colors.bg} ${colors.border} ${isSmall ? "w-16" : "w-24"}`}>
      <IconComp className={`${colors.icon} ${isSmall ? "h-5 w-5" : "h-8 w-8"}`} />
      <p className={`font-semibold text-center leading-tight ${isSmall ? "text-[10px]" : "text-xs"}`}>{award.title}</p>
    </div>);

}

export default function StudentProfile({ student, me, onBack }) {
  const qc = useQueryClient();
  const isOwnProfile = me && me.id === student.id;
  const [tab, setTab] = useState("posts"); // posts | tagged | friends | groups
  const [editingBio, setEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState(student.bio || "");
  const [saving, setSaving] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});
  const [openComments, setOpenComments] = useState({});
  const coverRef = useRef(null);
  const photoRef = useRef(null);

  // Current student (may be refreshed after photo update)
  const [localStudent, setLocalStudent] = useState(student);

  const { data: awards = [] } = useQuery({
    queryKey: ["student-awards", student.id],
    queryFn: () => base44.entities.StudentAward.filter({ student_id: student.id })
  });
  const { data: grades = [] } = useQuery({
    queryKey: ["student-grades-profile", student.id],
    queryFn: () => base44.entities.StudentGrade.filter({ student_id: student.id })
  });
  const { data: allPosts = [] } = useQuery({
    queryKey: ["activity-posts"],
    queryFn: () => base44.entities.ActivityPost.list("-created_date", 100),
    refetchInterval: 20000
  });
  const { data: comments = [] } = useQuery({
    queryKey: ["activity-comments"],
    queryFn: () => base44.entities.ActivityComment.list()
  });
  const { data: allStudents = [] } = useQuery({
    queryKey: ["all-students"],
    queryFn: () => base44.entities.Student.list()
  });
  const { data: allGroups = [] } = useQuery({
    queryKey: ["portal-groups"],
    queryFn: () => base44.entities.PortalGroup.list()
  });
  const { data: requests = [] } = useQuery({
    queryKey: ["friend-requests", me?.id],
    queryFn: () => base44.entities.FriendRequest.list(),
    enabled: !!me
  });

  // My posts (by student_id as author_email)
  const myPosts = allPosts.filter((p) => p.author_email === student.student_id);
  // Tagged posts (content mentions student name)
  const taggedPosts = allPosts.filter((p) =>
  p.author_email !== student.student_id &&
  (p.content || "").toLowerCase().includes(student.full_name.toLowerCase())
  );

  // Friends
  const accepted = requests.filter((r) =>
  (r.from_id === student.id || r.to_id === student.id) && r.status === "accepted"
  );
  const friendIds = accepted.map((r) => r.from_id === student.id ? r.to_id : r.from_id);
  const friends = allStudents.filter((s) => friendIds.includes(s.id));

  // Groups
  const myGroups = allGroups.filter((g) =>
  g.created_by_id === student.id ||
  (g.member_ids || "").split(",").map((s) => s.trim()).includes(student.id)
  );

  const avgScore = grades.length > 0 ?
  Math.round(grades.reduce((s, g) => s + g.score / (g.max_score || 100) * 100, 0) / grades.length) :
  null;

  const uploadPhoto = async (file, field) => {
    if (!file) return;
    setSaving(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const updated = await base44.entities.Student.update(student.id, { [field]: file_url });
    setLocalStudent((prev) => ({ ...prev, [field]: file_url }));
    qc.invalidateQueries(["all-students"]);
    setSaving(false);
  };

  const saveBio = async () => {
    setSaving(true);
    await base44.entities.Student.update(student.id, { bio: bioValue });
    setLocalStudent((prev) => ({ ...prev, bio: bioValue }));
    setEditingBio(false);
    setSaving(false);
  };

  const toggleLike = async (post) => {
    if (!me) return;
    const liked = (post.liked_by || "").split(",").filter(Boolean);
    const alreadyLiked = liked.includes(me.id);
    const newLiked = alreadyLiked ? liked.filter((id) => id !== me.id) : [...liked, me.id];
    await base44.entities.ActivityPost.update(post.id, { likes: newLiked.length, liked_by: newLiked.join(",") });
    qc.invalidateQueries(["activity-posts"]);
  };

  const sendComment = async (postId) => {
    if (!me) return;
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    await base44.entities.ActivityComment.create({
      post_id: postId, author_name: me.full_name,
      author_email: me.student_id, author_role: "student", content: text
    });
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    qc.invalidateQueries(["activity-comments"]);
  };

  const displayStudent = localStudent;

  const PostCard = ({ post }) => {
    const liked = me && (post.liked_by || "").split(",").filter(Boolean).includes(me.id);
    const postComments = comments.filter((c) => c.post_id === post.id);
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            {post.author_photo ?
            <img src={post.author_photo} className="h-9 w-9 rounded-full object-cover" alt="" /> :

            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                {post.author_name?.[0]}
              </div>
            }
            <div>
              <p className="font-semibold text-sm">{post.author_name}</p>
              <p className="text-xs text-muted-foreground">{new Date(post.created_date).toLocaleDateString()}</p>
            </div>
          </div>
          {post.content && <p className="text-sm">{post.content}</p>}
          {post.media_url && post.media_type === "image" &&
          <img src={post.media_url} className="w-full rounded-lg max-h-64 object-cover" alt="" />
          }
          {post.media_url && post.media_type === "video" &&
          <video src={post.media_url} className="w-full rounded-lg max-h-64" controls />
          }
          <div className="flex items-center gap-4 pt-1">
            <button onClick={() => toggleLike(post)} className={`flex items-center gap-1.5 text-sm ${liked ? "text-red-500" : "text-muted-foreground hover:text-red-400"}`}>
              <Heart className={`h-4 w-4 ${liked ? "fill-red-500" : ""}`} /> {post.likes || 0}
            </button>
            <button onClick={() => setOpenComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <MessageCircle className="h-4 w-4" /> {postComments.length}
            </button>
          </div>
          {openComments[post.id] &&
          <div className="space-y-2 border-t pt-3">
              {postComments.map((c) =>
            <div key={c.id} className="flex gap-2">
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">{c.author_name[0]}</div>
                  <div className="bg-muted rounded-xl px-3 py-1.5 text-sm flex-1"><span className="font-semibold text-xs">{c.author_name} </span>{c.content}</div>
                </div>
            )}
              {me &&
            <div className="flex gap-2 mt-2">
                  <input className="flex-1 text-sm border rounded-full px-3 py-1 bg-background outline-none focus:ring-1 focus:ring-ring"
              placeholder="Write a comment..."
              value={commentInputs[post.id] || ""}
              onChange={(e) => setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && sendComment(post.id)} />
              
                  <button className="cursor-pointer text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg px-3 py-2 h-8 w-8 p-0" onClick={() => sendComment(post.id)}>
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
            }
            </div>
          }
        </CardContent>
      </Card>);

  };

  return (
    <div className="space-y-0 pb-6">
      {/* Back button */}
      {onBack &&
      <div className="flex items-center gap-2 pb-2">
          <button className="cursor-pointer text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg px-3 py-2 h-10 w-10 p-0 flex items-center justify-center" onClick={onBack}><ArrowLeft className="h-4 w-4" /></button>
          <span className="text-sm font-medium text-muted-foreground">Back</span>
        </div>
      }

      {/* Cover Photo with centered avatar */}
      <div className="relative mb-4">
        {/* Cover */}
        <div
          className="h-44 w-full rounded-2xl bg-gradient-to-br from-primary to-primary/60"
          style={displayStudent.cover_photo_url ? { backgroundImage: `url(${displayStudent.cover_photo_url})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
        />

        {/* Cover change button — own profile */}
        {isOwnProfile && (
          <>
            <button
              onClick={() => coverRef.current?.click()}
              className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors z-10"
              title="Change cover photo"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input ref={coverRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => uploadPhoto(e.target.files[0], "cover_photo_url")} />
          </>
        )}

        {/* Avatar — centered horizontally in the middle of the cover */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10">
          <div className="relative">
            {displayStudent.photo_url ? (
              <img src={displayStudent.photo_url} className="h-24 w-24 rounded-full object-cover border-4 border-background shadow-xl" alt="" />
            ) : (
              <div className="h-24 w-24 rounded-full bg-primary/20 border-4 border-background shadow-xl flex items-center justify-center text-4xl font-bold text-primary">
                {displayStudent.full_name[0]}
              </div>
            )}
            {isOwnProfile && (
              <>
                <button
                  onClick={() => photoRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg border-2 border-background"
                  title="Change profile picture"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
                <input ref={photoRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => uploadPhoto(e.target.files[0], "photo_url")} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Name / Bio section — centered below avatar */}
      <div className="px-1 pb-4 space-y-1">
        <div className="flex flex-col items-start gap-0.5">
          <h2 className="text-xl font-bold">{displayStudent.full_name}</h2>
          <p className="text-sm text-muted-foreground">
            Grade {displayStudent.grade}{displayStudent.section ? ` · ${displayStudent.section}` : ""}
            {displayStudent.student_id ? ` · ID: ${displayStudent.student_id}` : ""}
          </p>
          {saving && <span className="text-xs text-muted-foreground">Saving...</span>}
        </div>

        {/* Bio */}
        {isOwnProfile && editingBio ? (
          <div className="flex gap-2 items-start mt-2">
            <Textarea
              value={bioValue}
              onChange={(e) => setBioValue(e.target.value)}
              placeholder="Write something about yourself..."
              className="resize-none text-sm min-h-[60px] text-left"
            />
            <div className="flex flex-col gap-1">
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed h-8 w-8 p-0" onClick={saveBio}><Check className="h-4 w-4" /></button>
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-8 w-8 p-0" onClick={() => { setEditingBio(false); setBioValue(displayStudent.bio || ""); }}><X className="h-4 w-4" /></button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-start gap-2 mt-1">
            <p className="text-sm text-muted-foreground italic">
              {displayStudent.bio || (isOwnProfile ? "Add a bio..." : "")}
            </p>
            {isOwnProfile && (
              <button onClick={() => setEditingBio(true)} className="text-muted-foreground hover:text-foreground">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
        { label: "Attendance", value: `${displayStudent.attendance_score ?? 100}%` },
        { label: "Awards", value: awards.length },
        { label: "Friends", value: friends.length },
        ...(avgScore !== null ? [{ label: "Avg Grade", value: `${avgScore}%` }] : [{ label: "Posts", value: myPosts.length }])].
        map((stat) =>
        <div key={stat.label} className="bg-muted/50 rounded-xl p-2 text-center">
            <p className="font-bold text-base">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        )}
      </div>

      {/* Wallet (own profile only) */}
      {isOwnProfile &&
      <Card className="mb-4 border-blue-200 bg-blue-50/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">School Card Balance</p>
              <p className="text-2xl font-bold text-blue-700">{(displayStudent.card_balance ?? 0).toFixed(2)} <span className="text-sm font-normal">AED</span></p>
            </div>
          </CardContent>
        </Card>
      }

      {/* Awards */}
      {awards.length > 0 &&
      <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <p className="font-semibold text-sm">Awards & Trophies</p>
              <Badge variant="secondary">{awards.length}</Badge>
            </div>
            <div className="flex flex-wrap gap-3">
              {awards.map((award) => <AwardBadge key={award.id} award={award} />)}
            </div>
          </CardContent>
        </Card>
      }

      {/* Tabs: Posts / Tagged / Friends / Groups */}
      <div className="flex border-b mb-4">
        {[
        { key: "posts", label: "Posts", icon: ImageIcon, count: myPosts.length },
        { key: "tagged", label: "Tagged", icon: Tag, count: taggedPosts.length },
        { key: "friends", label: "Friends", icon: Users, count: friends.length },
        { key: "groups", label: "Groups", icon: BookOpen, count: myGroups.length }].
        map((t) =>
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          className={`flex-1 flex flex-col items-center py-2.5 text-xs font-medium gap-0.5 border-b-2 transition-colors ${
          tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`
          }>
          
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.count > 0 && <span className="text-[10px]">({t.count})</span>}
          </button>
        )}
      </div>

      {/* Tab content */}
      {tab === "posts" &&
      <div className="space-y-3">
          {myPosts.length === 0 ?
        <p className="text-center text-sm text-muted-foreground py-8">No posts yet</p> :
        myPosts.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      }

      {tab === "tagged" &&
      <div className="space-y-3">
          {taggedPosts.length === 0 ?
        <p className="text-center text-sm text-muted-foreground py-8">No tagged posts</p> :
        taggedPosts.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      }

      {tab === "friends" &&
      <div className="grid grid-cols-2 gap-3">
          {friends.length === 0 ?
        <p className="col-span-2 text-center text-sm text-muted-foreground py-8">No friends yet</p> :
        friends.map((f) =>
        <Card key={f.id} className="overflow-hidden">
              <CardContent className="p-3 flex items-center gap-2">
                {f.photo_url ?
            <img src={f.photo_url} className="h-10 w-10 rounded-full object-cover shrink-0" alt="" /> :

            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">{f.full_name[0]}</div>
            }
                <div className="overflow-hidden">
                  <p className="font-semibold text-sm truncate">{f.full_name}</p>
                  <p className="text-xs text-muted-foreground">Grade {f.grade}</p>
                </div>
              </CardContent>
            </Card>
        )}
        </div>
      }

      {tab === "groups" &&
      <div className="space-y-2">
          {myGroups.length === 0 ?
        <p className="text-center text-sm text-muted-foreground py-8">Not in any groups yet</p> :
        myGroups.map((g) =>
        <Card key={g.id}>
              <CardContent className="p-3 flex items-center gap-3">
                {g.cover_url ?
            <img src={g.cover_url} className="h-10 w-10 rounded-lg object-cover shrink-0" alt="" /> :

            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
            }
                <div>
                  <p className="font-semibold text-sm">{g.name}</p>
                  <p className="text-xs text-muted-foreground">{g.description || "Group"}</p>
                </div>
              </CardContent>
            </Card>
        )}
        </div>
      }
    </div>);

}