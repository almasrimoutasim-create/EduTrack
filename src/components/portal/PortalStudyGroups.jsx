import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Plus, Send, Users, Lock, Globe, Image, Paperclip, Trash2, BookOpen, UserMinus, ChevronDown, ChevronUp, MessageCircle,
} from "lucide-react";
import GroupChat from "./GroupChat";

// ── helpers ──────────────────────────────────────────────────────────────────
const isMember = (group, id) =>
  (group.member_ids || "").split(",").filter(Boolean).includes(id) ||
  group.creator_id === id;

const memberCount = (group) =>
  new Set([
    ...(group.member_ids || "").split(",").filter(Boolean),
    group.creator_id,
  ]).size;

// ── Sub-components ────────────────────────────────────────────────────────────
function GroupCard({ group, me, onOpen, onJoin }) {
  const joined = isMember(group, me.id);
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => joined && onOpen(group)}>
      <CardContent className="p-4 flex items-start gap-3">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          {group.cover_url
            ? <img src={group.cover_url} className="h-12 w-12 rounded-xl object-cover" alt="" />
            : <BookOpen className="h-6 w-6 text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-sm truncate">{group.name}</p>
            {group.is_private ? <Lock className="h-3 w-3 text-muted-foreground" /> : <Globe className="h-3 w-3 text-muted-foreground" />}
          </div>
          {group.subject && <p className="text-xs text-primary font-medium">{group.subject}</p>}
          {group.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{group.description}</p>}
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" /> {memberCount(group)} member{memberCount(group) !== 1 ? "s" : ""}
          </div>
        </div>
        {!joined ? (
          <Button size="sm" className="shrink-0" onClick={e => { e.stopPropagation(); onJoin(group); }}>Join</Button>
        ) : (
          <Button size="sm" variant="outline" className="shrink-0" onClick={() => onOpen(group)}>Open</Button>
        )}
      </CardContent>
    </Card>
  );
}

function GroupFeed({ group, me, onBack }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const fileRef = useRef(null);
  const isCreator = group.creator_id === me.id;

  const { data: allStudents = [] } = useQuery({
    queryKey: ["all-students"],
    queryFn: () => base44.entities.Student.list(),
  });

  const memberIds = [...new Set([...(group.member_ids || "").split(",").filter(Boolean), group.creator_id])];
  const members = allStudents.filter(s => memberIds.includes(s.id));

  const removeMember = async (studentId) => {
    if (studentId === group.creator_id) return; // can't remove creator
    const newIds = (group.member_ids || "").split(",").filter(Boolean).filter(id => id !== studentId);
    await base44.entities.StudyGroup.update(group.id, { member_ids: newIds.join(",") });
    qc.invalidateQueries(["study-groups"]);
  };

  const { data: posts = [] } = useQuery({
    queryKey: ["study-group-posts", group.id],
    queryFn: () => base44.entities.StudyGroupPost.filter({ group_id: group.id }, "-created_date", 50),
    refetchInterval: 10000,
  });

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setMediaFile(f);
    setFileName(f.name);
    if (f.type.startsWith("image") || f.type.startsWith("video")) {
      setMediaPreview(URL.createObjectURL(f));
    } else {
      setMediaPreview(null);
    }
  };

  const submit = async () => {
    if (!text.trim() && !mediaFile) return;
    setUploading(true);
    let media_url = "", media_type = "none", file_name = "";
    if (mediaFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: mediaFile });
      media_url = file_url;
      file_name = fileName;
      if (mediaFile.type.startsWith("image")) media_type = "image";
      else if (mediaFile.type.startsWith("video")) media_type = "video";
      else media_type = "file";
    }
    await base44.entities.StudyGroupPost.create({
      group_id: group.id,
      author_id: me.id,
      author_name: me.full_name,
      author_photo: me.photo_url || "",
      content: text.trim(),
      media_url,
      media_type,
      file_name,
    });
    setText(""); setMediaFile(null); setMediaPreview(null); setFileName("");
    setUploading(false);
    qc.invalidateQueries(["study-group-posts", group.id]);
  };

  const deletePost = async (post) => {
    await base44.entities.StudyGroupPost.delete(post.id);
    qc.invalidateQueries(["study-group-posts", group.id]);
  };

  return (
    <div className="space-y-4 h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-base">{group.name}</h2>
          {group.subject && <p className="text-xs text-primary">{group.subject}</p>}
        </div>
        <button
          onClick={() => setShowMembers(p => !p)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border rounded-lg px-2 py-1"
        >
          <Users className="h-3.5 w-3.5" />
          {memberIds.length}
          {showMembers ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="feed" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="feed" className="gap-1.5"><BookOpen className="h-4 w-4" />Feed</TabsTrigger>
          <TabsTrigger value="chat" className="gap-1.5"><MessageCircle className="h-4 w-4" />Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="flex-1 space-y-4 overflow-y-auto">
          {/* Members panel */}
          {showMembers && (
            <Card>
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Members</p>
                {members.map(s => (
                  <div key={s.id} className="flex items-center gap-2">
                    {s.photo_url
                      ? <img src={s.photo_url} className="h-7 w-7 rounded-full object-cover" alt="" />
                      : <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{s.full_name[0]}</div>}
                    <span className="text-sm flex-1">{s.full_name}</span>
                    {s.id === group.creator_id && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Creator</span>}
                    {isCreator && s.id !== group.creator_id && (
                      <button onClick={() => removeMember(s.id)} className="text-muted-foreground hover:text-destructive" title="Remove member">
                        <UserMinus className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Compose */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
              {me.full_name[0]}
            </div>
            <Textarea
              placeholder="Post an update or share materials..."
              value={text}
              onChange={e => setText(e.target.value)}
              className="resize-none text-sm min-h-[64px]"
            />
          </div>
          {mediaPreview && mediaFile?.type.startsWith("image") && (
            <div className="relative">
              <img src={mediaPreview} className="w-full rounded-lg max-h-48 object-cover" alt="" />
              <button onClick={() => { setMediaFile(null); setMediaPreview(null); setFileName(""); }}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs">✕</button>
            </div>
          )}
          {mediaPreview && mediaFile?.type.startsWith("video") && (
            <video src={mediaPreview} className="w-full rounded-lg max-h-48" controls />
          )}
          {fileName && !mediaPreview && (
            <div className="flex items-center gap-2 text-sm bg-muted rounded-lg px-3 py-2">
              <Paperclip className="h-4 w-4 text-muted-foreground" />
              <span className="truncate flex-1">{fileName}</span>
              <button onClick={() => { setMediaFile(null); setFileName(""); }} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button onClick={() => fileRef.current?.click()} className="text-muted-foreground hover:text-foreground p-1">
                <Image className="h-4 w-4" />
              </button>
              <button onClick={() => fileRef.current?.click()} className="text-muted-foreground hover:text-foreground p-1">
                <Paperclip className="h-4 w-4" />
              </button>
              <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
            </div>
            <Button size="sm" onClick={submit} disabled={uploading || (!text.trim() && !mediaFile)} className="gap-1.5">
              <Send className="h-3.5 w-3.5" /> {uploading ? "Posting..." : "Post"}
            </Button>
          </div>
        </CardContent>
      </Card>

          {/* Posts */}
          {posts.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-6">No posts yet. Share something with the group!</p>
          )}
          {posts.map(post => (
            <Card key={post.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {post.author_photo
                      ? <img src={post.author_photo} className="h-8 w-8 rounded-full object-cover" alt="" />
                      : <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">{post.author_name[0]}</div>}
                    <div>
                      <p className="font-semibold text-sm">{post.author_name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(post.created_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {post.author_id === me.id && (
                    <button onClick={() => deletePost(post)} className="text-muted-foreground hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {post.content && <p className="text-sm">{post.content}</p>}
                {post.media_url && post.media_type === "image" && (
                  <img src={post.media_url} className="w-full rounded-lg max-h-64 object-cover" alt="" />
                )}
                {post.media_url && post.media_type === "video" && (
                  <video src={post.media_url} className="w-full rounded-lg max-h-64" controls />
                )}
                {post.media_url && post.media_type === "file" && (
                  <a href={post.media_url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-primary bg-primary/5 rounded-lg px-3 py-2 hover:bg-primary/10">
                    <Paperclip className="h-4 w-4" />
                    <span className="truncate">{post.file_name || "Download file"}</span>
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="chat" className="flex-1 overflow-hidden">
          <GroupChat group={group} me={me} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function PortalStudyGroups({ me }) {
  const qc = useQueryClient();
  const [activeGroup, setActiveGroup] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", subject: "", description: "", is_private: false });
  const [creating, setCreating] = useState(false);

  const { data: groups = [] } = useQuery({
    queryKey: ["study-groups"],
    queryFn: () => base44.entities.StudyGroup.list("-created_date", 100),
  });

  const myGroups = groups.filter(g => isMember(g, me.id));
  const discover = groups.filter(g => !isMember(g, me.id) && !g.is_private);

  const filtered = (list) =>
    search ? list.filter(g => g.name.toLowerCase().includes(search.toLowerCase()) || (g.subject || "").toLowerCase().includes(search.toLowerCase())) : list;

  const createGroup = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    await base44.entities.StudyGroup.create({
      name: form.name.trim(),
      subject: form.subject.trim(),
      description: form.description.trim(),
      creator_id: me.id,
      creator_name: me.full_name,
      member_ids: me.id,
      is_private: form.is_private,
    });
    setForm({ name: "", subject: "", description: "", is_private: false });
    setShowCreate(false);
    setCreating(false);
    qc.invalidateQueries(["study-groups"]);
  };

  const joinGroup = async (group) => {
    const members = (group.member_ids || "").split(",").filter(Boolean);
    if (!members.includes(me.id)) {
      members.push(me.id);
      await base44.entities.StudyGroup.update(group.id, { member_ids: members.join(",") });
      qc.invalidateQueries(["study-groups"]);
    }
    setActiveGroup({ ...group, member_ids: members.join(",") });
  };

  if (activeGroup) {
    return <GroupFeed group={activeGroup} me={me} onBack={() => setActiveGroup(null)} />;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">Study Groups</h2>
        <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> New Group
        </Button>
      </div>

      {/* Search */}
      <Input placeholder="Search groups..." value={search} onChange={e => setSearch(e.target.value)} />

      {/* My Groups */}
      {filtered(myGroups).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">My Groups</p>
          {filtered(myGroups).map(g => (
            <GroupCard key={g.id} group={g} me={me} onOpen={setActiveGroup} onJoin={joinGroup} />
          ))}
        </div>
      )}

      {/* Discover */}
      {filtered(discover).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Discover</p>
          {filtered(discover).map(g => (
            <GroupCard key={g.id} group={g} me={me} onOpen={setActiveGroup} onJoin={joinGroup} />
          ))}
        </div>
      )}

      {groups.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-10">No study groups yet. Create the first one!</p>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Study Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium">Group Name *</label>
              <Input className="mt-1" placeholder="e.g. Math Grade 10" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Subject</label>
              <Input className="mt-1" placeholder="e.g. Mathematics" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea className="mt-1 resize-none" placeholder="What is this group about?" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_private} onChange={e => setForm(p => ({ ...p, is_private: e.target.checked }))} className="rounded" />
              <Lock className="h-4 w-4 text-muted-foreground" /> Private group (invite only)
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={createGroup} disabled={creating || !form.name.trim()}>
              {creating ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}