import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const roleBadge = { admin: "bg-primary text-primary-foreground", teacher: "bg-blue-100 text-blue-700", student: "bg-green-100 text-green-700" };

export default function CommunityChat({ currentUser }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    loadMessages();
    const unsub = base44.entities.ActivityChat.subscribe(event => {
      if (event.type === "create") setMessages(prev => [...prev, event.data]);
      else if (event.type === "delete") setMessages(prev => prev.filter(m => m.id !== event.id));
    });
    return unsub;
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    const data = await base44.entities.ActivityChat.list("-created_date", 100);
    setMessages(data.reverse());
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    const role = currentUser?.role === "admin" ? "admin" : "student";
    await base44.entities.ActivityChat.create({
      sender_name: currentUser?.full_name || "Unknown",
      sender_email: currentUser?.email,
      sender_role: role,
      message: text.trim()
    });
    setText("");
    setSending(false);
  };

  return (
    <Card className="shadow-sm flex flex-col h-[500px]">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" /> Community Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">No messages yet. Say hello!</div>
        )}
        {messages.map(msg => {
          const isMe = msg.sender_email === currentUser?.email;
          return (
            <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
              <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary text-xs font-bold">
                {msg.sender_name?.[0] || "?"}
              </div>
              <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                {!isMe && (
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-xs font-semibold">{msg.sender_name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full capitalize ${roleBadge[msg.sender_role] || roleBadge.student}`}>
                      {msg.sender_role}
                    </span>
                  </div>
                )}
                <div className={`rounded-2xl px-3 py-2 text-sm ${isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm"}`}>
                  {msg.message}
                </div>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  {msg.created_date ? formatDistanceToNow(new Date(msg.created_date), { addSuffix: true }) : "just now"}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </CardContent>
      <div className="p-3 border-t flex gap-2">
        <Input
          placeholder="Type a message..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          className="h-9 text-sm"
        />
        <button onClick={handleSend} disabled={sending || !text.trim()} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed h-9 w-9 p-0 shrink-0">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}