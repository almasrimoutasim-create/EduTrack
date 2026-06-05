import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Send, 
  Paperclip, 
  FileText, 
  Image as ImageIcon, 
  X, 
  MessageSquare, 
  Download,
  User,
  Search,
  Check,
  CheckCheck
} from "lucide-react";
import { toast } from "sonner";

export default function ParentTeacherChat({ me }) {
  const qc = useQueryClient();
  const [activeContact, setActiveContact] = useState(null);
  const [msgInput, setMsgInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [attachedFile, setAttachedFile] = useState(null); // { name, type, dataUrl }
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);
  const [isSending, setIsSending] = useState(false);

  // Queries
  const { data: allStudents = [] } = useQuery({
    queryKey: ["all-students-chat"],
    queryFn: () => base44.entities.Student.list()
  });

  const { data: allTeachers = [] } = useQuery({
    queryKey: ["all-teachers-chat"],
    queryFn: () => base44.entities.Teacher.list()
  });

  const { data: allMessages = [], refetch: refetchMessages } = useQuery({
    queryKey: ["private-messages-chat", me.id],
    queryFn: () => base44.entities.PrivateMessage.list(),
    refetchInterval: 3000 // Real-time poll every 3 seconds
  });

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeContact, allMessages.length]);

  // Mark messages as read when active contact is open
  useEffect(() => {
    if (!activeContact) return;
    const unread = allMessages.filter(m => m.sender_id === activeContact.id && m.receiver_id === me.id && !m.is_read);
    if (unread.length > 0) {
      Promise.all(unread.map(m => base44.entities.PrivateMessage.update(m.id, { is_read: true })))
        .then(() => {
          refetchMessages();
          qc.invalidateQueries({ queryKey: ["private-messages-chat"] });
        })
        .catch(console.error);
    }
  }, [activeContact, allMessages, me.id]);

  // Construct contact list based on current user role
  const isParent = me.role === "parent";

  const contacts = isParent
    ? allTeachers.map(t => ({
        id: t.id,
        name: t.full_name || t.name,
        role: "teacher",
        roleLabel: "معلم / Teacher",
        avatar: t.photo_url || ""
      }))
    : allStudents
        .filter(s => s.parent_name && s.parent_email)
        .map(s => ({
          id: `parent-${s.id}`,
          name: `${s.parent_name} (ولي أمر ${s.full_name || s.name})`,
          role: "parent",
          roleLabel: "ولي أمر / Parent",
          avatar: s.photo_url || ""
        }));

  // Add last message and unread count to each contact
  const contactsWithMeta = contacts.map(c => {
    const contactMessages = allMessages.filter(m =>
      (m.sender_id === me.id && m.receiver_id === c.id) ||
      (m.sender_id === c.id && m.receiver_id === me.id)
    );
    const lastMsg = contactMessages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    const unreadCount = contactMessages.filter(m => m.sender_id === c.id && m.receiver_id === me.id && !m.is_read).length;
    return {
      ...c,
      lastMsg,
      unreadCount,
      lastActiveTime: lastMsg ? new Date(lastMsg.created_at).getTime() : 0
    };
  });

  // Sort contacts: 1. Unread first, 2. Newest message first
  const sortedContacts = contactsWithMeta.sort((a, b) => {
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
    return b.lastActiveTime - a.lastActiveTime;
  });

  const filteredContacts = sortedContacts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter messages for current active chat
  const activeChatMessages = allMessages.filter(m =>
    activeContact && (
      (m.sender_id === me.id && m.receiver_id === activeContact.id) ||
      (m.sender_id === activeContact.id && m.receiver_id === me.id)
    )
  ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // Handle file select & convert to base64
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الملف كبير جداً. الحد الأقصى هو 5 ميجابايت.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedFile({
        name: file.name,
        type: file.type,
        dataUrl: event.target.result
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (isSending) return;
    if (!activeContact) return;
    if (!msgInput.trim() && !attachedFile) return;
    setIsSending(true);

    try {
      const payload = {
        sender_id: me.id,
        sender_name: me.full_name,
        receiver_id: activeContact.id,
        receiver_name: activeContact.name,
        content: msgInput.trim() || (attachedFile ? `أرسل ملفاً: ${attachedFile.name}` : ""),
        type: attachedFile ? (attachedFile.type.startsWith("image/") ? "image" : "file") : "text",
        file_url: attachedFile ? attachedFile.dataUrl : "",
        is_read: false
      };

      await base44.entities.PrivateMessage.create(payload);
      
      // Send notification
      await base44.entities.PortalNotification.create({
        user_id: activeContact.id,
        title: "رسالة جديدة",
        message: `${me.full_name} أرسل لك رسالة جديدة`,
        type: "message"
      });

      setMsgInput("");
      setAttachedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      refetchMessages();
      qc.invalidateQueries({ queryKey: ["private-messages-chat"] });
    } catch (err) {
      console.error(err);
      toast.error("فشل إرسال الرسالة.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white border border-stone-200/80 rounded-[32px] overflow-hidden shadow-sm h-[650px]">
      
      {/* Contacts List Column (Left in LTR, Right in RTL) */}
      <div className="md:col-span-4 border-r border-stone-100 flex flex-col h-full bg-stone-50/40 min-h-0">
        <div className="p-4 border-b border-stone-100">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
            <Input
              placeholder="البحث عن جهة اتصال..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pr-10 rounded-xl bg-white border-stone-200 text-xs h-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-10 text-stone-400 text-xs">
              لا توجد جهات اتصال متاحة حالياً.
            </div>
          ) : (
            filteredContacts.map(contact => {
              const lastMsg = contact.lastMsg;
              const isSelected = activeContact?.id === contact.id;

              return (
                <button
                  key={contact.id}
                  onClick={() => setActiveContact(contact)}
                  className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all text-right cursor-pointer ${
                    isSelected 
                      ? "bg-stone-900 text-white shadow-md" 
                      : "hover:bg-stone-100/70 text-stone-700"
                  }`}
                >
                  {contact.avatar ? (
                    <img src={contact.avatar} className="h-10 w-10 rounded-full object-cover shrink-0" alt="" />
                  ) : (
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                      isSelected ? "bg-white/10 text-white" : "bg-primary/10 text-primary"
                    }`}>
                      <User size={18} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2">
                      <p className="font-bold text-xs truncate flex-1">{contact.name}</p>
                      {contact.unreadCount > 0 && (
                        <span className="bg-rose-500 text-white text-[9px] font-black h-4.5 px-1.5 rounded-full flex items-center justify-center shrink-0">
                          {contact.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className={`text-[10px] truncate mt-0.5 ${isSelected ? "text-stone-300" : "text-stone-400"}`}>
                      {lastMsg ? lastMsg.content : contact.roleLabel}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Messages Column */}
      <div className="md:col-span-8 flex flex-col h-full bg-white relative min-h-0">
        {activeContact ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeContact.avatar ? (
                  <img src={activeContact.avatar} className="h-9 w-9 rounded-full object-cover" alt="" />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    <User size={16} />
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-xs text-stone-900 leading-tight">{activeContact.name}</h4>
                  <p className="text-[9px] text-stone-400 mt-0.5">{activeContact.roleLabel}</p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeChatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                  <MessageSquare size={36} className="text-stone-400 mb-2" />
                  <p className="text-xs font-bold text-stone-500">لا توجد رسائل سابقة. ابدأ المحادثة الآن!</p>
                </div>
              ) : (
                activeChatMessages.map(msg => {
                  const isMe = msg.sender_id === me.id;
                  
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-start" : "justify-end"} w-full`}>
                      <div className={`max-w-[70%] rounded-2xl p-3 text-right shadow-sm ${
                        isMe 
                          ? "bg-stone-950 text-white rounded-tr-none" 
                          : "bg-stone-100 text-stone-900 rounded-tl-none border border-stone-200/50"
                      }`}>
                        {/* File Attachment Render */}
                        {msg.file_url && (
                          <div className="mb-2">
                            {msg.type === "image" ? (
                              <a href={msg.file_url} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-stone-200 max-w-xs cursor-pointer">
                                <img src={msg.file_url} alt="Attachment" className="max-h-48 object-cover w-full" />
                              </a>
                            ) : (
                              <a 
                                href={msg.file_url} 
                                download 
                                className={`flex items-center gap-2 p-2 rounded-lg text-xs font-semibold ${
                                  isMe ? "bg-white/10 text-white hover:bg-white/20" : "bg-white text-stone-800 hover:bg-stone-50 border border-stone-200"
                                }`}
                              >
                                <FileText size={16} />
                                <span className="truncate flex-1">تحميل المرفق</span>
                                <Download size={14} />
                              </a>
                            )}
                          </div>
                        )}
                        <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <span className="text-[9px] block text-left mt-1 opacity-60">
                          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : ""}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-stone-100 space-y-3 bg-white">
              {/* Attachment Preview */}
              {attachedFile && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-250 animate-fadeIn">
                  <div className="flex items-center gap-2 text-xs font-semibold text-stone-600 truncate">
                    {attachedFile.type.startsWith("image/") ? <ImageIcon size={16} /> : <FileText size={16} />}
                    <span className="truncate">{attachedFile.name}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setAttachedFile(null)}
                    className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-11 w-11 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-500 hover:text-stone-700 flex items-center justify-center shrink-0 cursor-pointer"
                  title="إرفاق ملف أو صورة"
                >
                  <Paperclip size={18} />
                </button>

                <Input
                  value={msgInput}
                  onChange={e => setMsgInput(e.target.value)}
                  placeholder="اكتب رسالة هنا..."
                  className="flex-1 rounded-xl h-11 border-stone-200 text-xs"
                />

                <button
                  type="submit"
                  disabled={isSending || (!msgInput.trim() && !attachedFile)}
                  className="h-11 px-5 rounded-xl bg-stone-900 text-white hover:bg-black font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
                >
                  <Send size={14} />
                  <span>إرسال</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-45">
            <MessageSquare size={48} className="text-stone-400 mb-3" />
            <h4 className="font-serif text-lg font-bold text-stone-700">بوابة تواصل المعلمين وأولياء الأمور</h4>
            <p className="text-xs text-stone-500 max-w-sm mt-1">يرجى تحديد جهة اتصال من القائمة لبدء المحادثة ومشاركة الاستفسارات والملفات التعليمية بشكل آمن.</p>
          </div>
        )}
      </div>
    </div>
  );
}
