import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, MessageCircle, Check, CheckCheck } from "lucide-react";

function makeConversationKey(id1, id2) {
  return [id1, id2].sort().join("_");
}

function MessageTicks({ msg, me, readReceipts }) {
  if (msg.sender_id !== me.id) return null;
  const isRead = readReceipts.some(r => r.message_id === msg.id && r.reader_id !== me.id);
  if (isRead) return <CheckCheck className="h-3 w-3 text-blue-400 shrink-0 mt-0.5" />;
  // If msg has an id it means it was delivered (saved to DB)
  if (msg.id) return <CheckCheck className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />;
  return <Check className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />;
}

export default function PortalChat({ me }) {
  const qc = useQueryClient();
  const [activeFriend, setActiveFriend] = useState(null);
  const [msgInput, setMsgInput] = useState("");
  const [typingTimeout, setTypingTimeout] = useState(null);
  const bottomRef = useRef(null);

  const { data: allStudents = [] } = useQuery({
    queryKey: ["all-students"],
    queryFn: () => entities.Student.list(),
  });
  const { data: allTeachers = [] } = useQuery({
    queryKey: ["all-teachers"],
    queryFn: () => entities.Teacher.list(),
  });
  const { data: requests = [] } = useQuery({
    queryKey: ["friend-requests", me.id],
    queryFn: () => entities.FriendRequest.list(),
  });
  const { data: allMessages = [] } = useQuery({
    queryKey: ["private-messages", me.id],
    queryFn: () => entities.PrivateMessage.list(),
    refetchInterval: 3000,
  });
  const { data: readReceipts = [] } = useQuery({
    queryKey: ["read-receipts"],
    queryFn: () => entities.MessageReadReceipt.list(),
    refetchInterval: 3000,
  });
  const { data: typingIndicators = [] } = useQuery({
    queryKey: ["typing-indicators"],
    queryFn: () => entities.TypingIndicator.list(),
    refetchInterval: 2000,
    enabled: !!activeFriend,
  });

  const accepted = requests.filter(r =>
    r.status === "accepted" && (r.from_id === me.id || r.to_id === me.id)
  );
  const friendIds = accepted.map(r => r.from_id === me.id ? r.to_id : r.from_id);

  const everyone = [
    ...allStudents.filter(s => s.id !== me.id).map(s => ({ ...s, _role: "student" })),
    ...allTeachers.map(t => ({ ...t, id: `teacher_${t.id}`, _role: "teacher" })),
  ];
  const friends = everyone.filter(p => friendIds.includes(p.id));

  const convKey = activeFriend ? makeConversationKey(me.id, activeFriend.id) : null;
  const conversation = allMessages.filter(m => m.conversation_key === convKey);

  // Mark messages as read when opening a conversation
  useEffect(() => {
    if (!activeFriend || !convKey) return;
    const unread = conversation.filter(m => m.receiver_id === me.id);
    unread.forEach(async (msg) => {
      const alreadyRead = readReceipts.some(r => r.message_id === msg.id && r.reader_id === me.id);
      if (!alreadyRead) {
        await entities.MessageReadReceipt.create({
          message_id: msg.id,
          reader_id: me.id,
          conversation_key: convKey,
        });
      }
    });
  }, [activeFriend, conversation.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.length]);

  // Typing indicator - friend is typing?
  const friendIsTyping = activeFriend && typingIndicators.some(t => {
    if (t.typer_id !== activeFriend.id) return false;
    if (t.conversation_key !== convKey) return false;
    if (!t.is_typing) return false;
    // Stale after 4 seconds
    const age = Date.now() - new Date(t.last_typed).getTime();
    return age < 4000;
  });

  const updateTyping = async (isTyping) => {
    if (!convKey) return;
    const existing = typingIndicators.find(t => t.typer_id === me.id && t.conversation_key === convKey);
    const payload = { conversation_key: convKey, typer_id: me.id, typer_name: me.full_name, is_typing: isTyping, last_typed: new Date().toISOString() };
    if (existing) {
      await entities.TypingIndicator.update(existing.id, payload);
    } else {
      await entities.TypingIndicator.create(payload);
    }
  };

  const handleInputChange = (e) => {
    setMsgInput(e.target.value);
    updateTyping(true);
    if (typingTimeout) clearTimeout(typingTimeout);
    const t = setTimeout(() => updateTyping(false), 2000);
    setTypingTimeout(t);
  };

  const sendMessage = async () => {
    if (!msgInput.trim() || !activeFriend) return;
    updateTyping(false);
    await entities.PrivateMessage.create({
      conversation_key: convKey,
      sender_id: me.id,
      sender_name: me.full_name,
      sender_photo: me.photo_url || "",
      receiver_id: activeFriend.id,
      message: msgInput.trim(),
    });
    // Only create notification if not already in this conversation (can't check here easily, always create — receiver ignores if they have chat open)
    await entities.PortalNotification.create({
      recipient_id: activeFriend.id,
      message: `${me.full_name} sent you a message`,
      type: "message",
      ref_id: me.id,
    });
    setMsgInput("");
    qc.invalidateQueries(["private-messages"]);
  };

  const getLastMsg = (friendId) => {
    const key = makeConversationKey(me.id, friendId);
    const msgs = allMessages.filter(m => m.conversation_key === key);
    return msgs[msgs.length - 1];
  };

  const getUnreadCount = (friendId) => {
    const key = makeConversationKey(me.id, friendId);
    return allMessages.filter(m => m.conversation_key === key && m.receiver_id === me.id &&
      !readReceipts.some(r => r.message_id === m.id && r.reader_id === me.id)
    ).length;
  };

  if (activeFriend) {
    return (
      <div className="flex flex-col h-[calc(100vh-200px)]">
        <div className="flex items-center gap-3 mb-4">
          <button className="cursor-pointer text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg px-3 py-2 h-10 w-10 p-0 flex items-center justify-center" onClick={() => setActiveFriend(null)}><ArrowLeft className="h-4 w-4" /></button>
          {activeFriend.photo_url ? (
            <img src={activeFriend.photo_url} className="h-9 w-9 rounded-full object-cover" alt="" />
          ) : (
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
              {activeFriend.full_name[0]}
            </div>
          )}
          <div>
            <p className="font-semibold text-sm">{activeFriend.full_name}</p>
            {friendIsTyping ? (
              <p className="text-xs text-green-500 animate-pulse">typing...</p>
            ) : (
              <p className="text-xs text-muted-foreground capitalize">{activeFriend._role}</p>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 pb-2">
          {conversation.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Say hi!</p>
          )}
          {conversation.map(msg => {
            const isMe = msg.sender_id === me.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "flex-row-reverse" : ""} gap-2`}>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {msg.sender_name[0]}
                </div>
                <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                  <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm"}`}>
                    {msg.message}
                  </div>
                  {isMe && (
                    <div className="flex justify-end mt-0.5 pr-1">
                      <MessageTicks msg={msg} me={me} readReceipts={readReceipts} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {friendIsTyping && (
            <div className="flex gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                {activeFriend.full_name[0]}
              </div>
              <div className="px-3 py-2 bg-muted rounded-2xl rounded-tl-sm flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2 mt-2">
          <Input
            placeholder="Type a message..."
            value={msgInput}
            onChange={handleInputChange}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed w-10 h-10 p-0"><Send className="h-4 w-4" /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="font-semibold text-sm">Messages</p>
      {friends.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Add friends to start chatting privately</p>
        </div>
      )}
      <div className="space-y-2">
        {friends.map(friend => {
          const last = getLastMsg(friend.id);
          const unread = getUnreadCount(friend.id);
          return (
            <Card key={friend.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveFriend(friend)}>
              <CardContent className="p-3 flex items-center gap-3">
                {friend.photo_url ? (
                  <img src={friend.photo_url} className="h-11 w-11 rounded-full object-cover" alt="" />
                ) : (
                  <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {friend.full_name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{friend.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {last ? last.message : "Tap to start chatting"}
                  </p>
                </div>
                {unread > 0 && (
                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-[10px] text-primary-foreground font-bold">{unread}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}