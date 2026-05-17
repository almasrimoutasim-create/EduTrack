import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UsersRound, Plus, ArrowLeft, Send, Lock, Globe, Clock } from "lucide-react";
import { toast } from "sonner";

export default function PortalGroups({ me }) {
  const qc = useQueryClient();
  const [openGroup, setOpenGroup] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrivate, setNewPrivate] = useState(false);
  const [msgInput, setMsgInput] = useState("");
  const [typingTimeout, setTypingTimeout] = useState(null);
  const bottomRef = useRef(null);

  const { data: groups = [] } = useQuery({
    queryKey: ["portal-groups"],
    queryFn: () => base44.entities.PortalGroup.list(),
  });

  const { data: groupMessages = [] } = useQuery({
    queryKey: ["group-messages", openGroup?.id],
    queryFn: () => base44.entities.PortalGroupMessage.filter({ group_id: openGroup?.id }),
    enabled: !!openGroup,
    refetchInterval: 3000,
  });

  const { data: typingIndicators = [] } = useQuery({
    queryKey: ["typing-indicators"],
    queryFn: () => base44.entities.TypingIndicator.list(),
    refetchInterval: 2000,
    enabled: !!openGroup,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [groupMessages.length]);

  const isMember = (g) => {
    const members = (g.member_ids || "").split(",").filter(Boolean);
    return g.created_by_id === me.id || members.includes(me.id);
  };

  const isPending = (g) => {
    const pending = (g.pending_member_ids || "").split(",").filter(Boolean);
    return pending.includes(me.id);
  };

  const isCreator = (g) => g.created_by_id === me.id;

  const pendingMembers = (g) => (g.pending_member_ids || "").split(",").filter(Boolean);

  const myGroups = groups.filter(isMember);
  const discoverGroups = groups.filter(g => !isMember(g));

  const groupTypers = openGroup
    ? typingIndicators.filter(t => {
        if (t.conversation_key !== openGroup.id) return false;
        if (t.typer_id === me.id) return false;
        if (!t.is_typing) return false;
        return Date.now() - new Date(t.last_typed).getTime() < 4000;
      })
    : [];

  const updateTyping = async (isTyping) => {
    if (!openGroup) return;
    const existing = typingIndicators.find(t => t.typer_id === me.id && t.conversation_key === openGroup.id);
    const payload = { conversation_key: openGroup.id, typer_id: me.id, typer_name: me.full_name, is_typing: isTyping, last_typed: new Date().toISOString() };
    if (existing) await base44.entities.TypingIndicator.update(existing.id, payload);
    else await base44.entities.TypingIndicator.create(payload);
  };

  const handleInputChange = (e) => {
    setMsgInput(e.target.value);
    updateTyping(true);
    if (typingTimeout) clearTimeout(typingTimeout);
    setTypingTimeout(setTimeout(() => updateTyping(false), 2000));
  };

  // Join open group immediately; request to join private group
  const joinGroup = async (group) => {
    if (group.is_private) {
      const pending = pendingMembers(group);
      if (pending.includes(me.id)) return;
      const newPending = [...pending, me.id].join(",");
      await base44.entities.PortalGroup.update(group.id, { pending_member_ids: newPending });
      await base44.entities.PortalNotification.create({
        recipient_id: group.created_by_id,
        message: `${me.full_name} requested to join your group "${group.name}"`,
        type: "group_invite",
        ref_id: group.id,
      });
      qc.invalidateQueries(["portal-groups"]);
      toast.success("Join request sent! Waiting for approval.");
    } else {
      const members = (group.member_ids || "").split(",").filter(Boolean);
      members.push(me.id);
      await base44.entities.PortalGroup.update(group.id, { member_ids: members.join(",") });
      qc.invalidateQueries(["portal-groups"]);
    }
  };

  // Creator approves or rejects a pending member
  const handlePendingMember = async (group, memberId, approve) => {
    const pending = pendingMembers(group).filter(id => id !== memberId);
    const update = { pending_member_ids: pending.join(",") };
    if (approve) {
      const members = (group.member_ids || "").split(",").filter(Boolean);
      members.push(memberId);
      update.member_ids = members.join(",");
    }
    await base44.entities.PortalGroup.update(group.id, update);
    qc.invalidateQueries(["portal-groups"]);
    if (openGroup?.id === group.id) {
      setOpenGroup(prev => ({ ...prev, ...update }));
    }
    toast.success(approve ? "Member approved!" : "Request declined");
  };

  const createGroup = async () => {
    if (!newName.trim()) return;
    await base44.entities.PortalGroup.create({
      name: newName.trim(),
      description: newDesc.trim(),
      created_by_id: me.id,
      created_by_name: me.full_name,
      member_ids: me.id,
      is_private: newPrivate,
      pending_member_ids: "",
    });
    setNewName(""); setNewDesc(""); setNewPrivate(false); setShowCreate(false);
    qc.invalidateQueries(["portal-groups"]);
  };

  const sendMessage = async () => {
    if (!msgInput.trim() || !openGroup) return;
    updateTyping(false);
    await base44.entities.PortalGroupMessage.create({
      group_id: openGroup.id,
      sender_id: me.id,
      sender_name: me.full_name,
      sender_photo: me.photo_url || "",
      sender_role: "student",
      message: msgInput.trim(),
    });
    setMsgInput("");
    qc.invalidateQueries(["group-messages", openGroup.id]);
  };

  if (openGroup) {
    const pending = pendingMembers(openGroup);
    return (
      <div className="flex flex-col h-[calc(100vh-200px)]">
        <div className="flex items-center gap-3 mb-3">
          <Button variant="ghost" size="icon" onClick={() => setOpenGroup(null)}><ArrowLeft className="h-4 w-4" /></Button>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold">{openGroup.name}</p>
              {openGroup.is_private && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>
            {openGroup.description && <p className="text-xs text-muted-foreground">{openGroup.description}</p>}
          </div>
        </div>

        {/* Pending join requests (only visible to creator) */}
        {isCreator(openGroup) && pending.length > 0 && (
          <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
            <p className="text-xs font-semibold text-amber-800">Join Requests ({pending.length})</p>
            {pending.map(memberId => (
              <div key={memberId} className="flex items-center justify-between">
                <span className="text-xs text-amber-900">User ID: {memberId.slice(0, 8)}...</span>
                <div className="flex gap-1.5">
                  <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => handlePendingMember(openGroup, memberId, true)}>Accept</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handlePendingMember(openGroup, memberId, false)}>Decline</Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-3 pb-2">
          {groupMessages.map(msg => {
            const isMe = msg.sender_id === me.id;
            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {msg.sender_name[0]}
                </div>
                <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                  {!isMe && <p className="text-xs text-muted-foreground mb-0.5">{msg.sender_name}</p>}
                  <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm"}`}>
                    {msg.message}
                  </div>
                </div>
              </div>
            );
          })}
          {groupTypers.length > 0 && (
            <div className="flex gap-2 items-center">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
                {groupTypers[0].typer_name[0]}
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] text-muted-foreground">
                  {groupTypers.map(t => t.typer_name.split(" ")[0]).join(", ")} {groupTypers.length === 1 ? "is" : "are"} typing...
                </p>
                <div className="px-3 py-2 bg-muted rounded-2xl rounded-tl-sm flex gap-1 items-center mt-0.5">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2 mt-2">
          <Input placeholder="Type a message..." value={msgInput} onChange={handleInputChange}
            onKeyDown={e => e.key === "Enter" && sendMessage()} />
          <Button size="icon" onClick={sendMessage}><Send className="h-4 w-4" /></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <p className="font-semibold text-sm">My Groups</p>
        <Button size="sm" className="gap-1" onClick={() => setShowCreate(true)}>
          <Plus className="h-3.5 w-3.5" /> Create
        </Button>
      </div>

      {myGroups.length === 0 && <p className="text-sm text-muted-foreground text-center py-3">You haven't joined any groups yet.</p>}
      <div className="space-y-2">
        {myGroups.map(g => (
          <Card key={g.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setOpenGroup(g)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <UsersRound className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-sm truncate">{g.name}</p>
                  {g.is_private && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                </div>
                {g.description && <p className="text-xs text-muted-foreground truncate">{g.description}</p>}
                {isCreator(g) && pendingMembers(g).length > 0 && (
                  <p className="text-xs text-amber-600 font-medium">{pendingMembers(g).length} pending request{pendingMembers(g).length > 1 ? "s" : ""}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground">Open →</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {discoverGroups.length > 0 && (
        <div>
          <p className="font-semibold text-sm mb-2">Discover Groups</p>
          <div className="space-y-2">
            {discoverGroups.map(g => {
              const pending = isPending(g);
              return (
                <Card key={g.id}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                      {g.is_private ? <Lock className="h-5 w-5 text-muted-foreground" /> : <Globe className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-sm truncate">{g.name}</p>
                        {g.is_private && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Private</span>}
                      </div>
                      {g.description && <p className="text-xs text-muted-foreground truncate">{g.description}</p>}
                      <p className="text-xs text-muted-foreground">by {g.created_by_name}</p>
                    </div>
                    {pending ? (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Clock className="h-3.5 w-3.5" /> Pending
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => joinGroup(g)} className="shrink-0">
                        {g.is_private ? "Request" : "Join"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create a Group</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Group name" value={newName} onChange={e => setNewName(e.target.value)} />
            <Input placeholder="Description (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
            <label className="flex items-center gap-3 cursor-pointer py-2">
              <div
                onClick={() => setNewPrivate(p => !p)}
                className={`relative h-5 w-9 rounded-full transition-colors ${newPrivate ? "bg-primary" : "bg-muted"}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${newPrivate ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  {newPrivate ? <Lock className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                  {newPrivate ? "Private group" : "Public group"}
                </p>
                <p className="text-xs text-muted-foreground">{newPrivate ? "Members must request to join and be approved" : "Anyone can join instantly"}</p>
              </div>
            </label>
            <Button className="w-full" onClick={createGroup}>Create Group</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}