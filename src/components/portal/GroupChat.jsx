import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

export default function GroupChat({ group, me }) {
  const qc = useQueryClient();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const { data: messages = [] } = useQuery({
    queryKey: ["group-chat", group.id],
    queryFn: () => base44.entities.PortalGroupMessage.filter({ group_id: group.id }, "-created_date", 100),
    refetchInterval: 3000,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    setSending(true);
    await base44.entities.PortalGroupMessage.create({
      group_id: group.id,
      sender_id: me.id,
      sender_name: me.full_name,
      sender_photo: me.photo_url || "",
      content: message.trim(),
    });
    setMessage("");
    setSending(false);
    qc.invalidateQueries(["group-chat", group.id]);
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-background">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">No messages yet. Start the conversation!</p>
        ) : (
          messages
            .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
            .map(msg => (
              <div key={msg.id} className="flex gap-2 group">
                {msg.sender_photo ? (
                  <img src={msg.sender_photo} className="h-8 w-8 rounded-full object-cover shrink-0" alt="" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                    {msg.sender_name?.[0]}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-xs font-semibold text-muted-foreground">{msg.sender_name}</p>
                  <div className={`mt-1 p-2.5 rounded-lg ${msg.sender_id === me.id ? "bg-primary text-primary-foreground ml-auto max-w-xs" : "bg-muted text-foreground max-w-xs"}`}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(msg.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t p-4 bg-card">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            disabled={sending}
          />
          <button onClick={sendMessage} disabled={sending || !message.trim()} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed w-10 h-10 p-0">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}