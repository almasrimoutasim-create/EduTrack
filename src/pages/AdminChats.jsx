import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Search, 
  User, 
  FileText, 
  Image as ImageIcon, 
  Download,
  ShieldAlert,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { useLanguage } from "@/lib/LanguageContext";

export default function AdminChats() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [activeConvKey, setActiveConvKey] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Queries
  const { data: allMessages = [], isLoading } = useQuery({
    queryKey: ["admin-private-messages"],
    queryFn: () => base44.entities.PrivateMessage.list(),
    refetchInterval: 5000 // Refresh every 5 seconds for real-time monitoring
  });

  // Helper to make unique conversation key
  const makeKey = (id1, id2) => [id1, id2].sort().join("_");

  // Group messages into conversations
  const conversationsMap = {};
  allMessages.forEach(msg => {
    const key = makeKey(msg.sender_id, msg.receiver_id);
    if (!conversationsMap[key]) {
      conversationsMap[key] = {
        key,
        messages: [],
        teacherName: "",
        parentName: "",
        lastMessage: null,
        lastActiveTime: 0
      };
    }
    
    conversationsMap[key].messages.push(msg);

    // Identify roles and names
    if (msg.sender_id.startsWith("parent-")) {
      conversationsMap[key].parentName = msg.sender_name;
    } else {
      conversationsMap[key].teacherName = msg.sender_name;
    }

    if (msg.receiver_id.startsWith("parent-")) {
      conversationsMap[key].parentName = msg.receiver_name;
    } else {
      conversationsMap[key].teacherName = msg.receiver_name;
    }
  });

  // Convert map to array and sort by latest activity
  const conversations = Object.values(conversationsMap).map(conv => {
    const sortedMsgs = conv.messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const lastMsg = sortedMsgs[sortedMsgs.length - 1];
    
    return {
      ...conv,
      messages: sortedMsgs,
      lastMessage: lastMsg,
      lastActiveTime: lastMsg ? new Date(lastMsg.created_at).getTime() : 0,
      // Fallback names if role patterns don't match exactly
      pName: conv.parentName || "ولي أمر / Parent",
      tName: conv.teacherName || "معلم / Teacher"
    };
  }).sort((a, b) => b.lastActiveTime - a.lastActiveTime);

  // Filter conversations based on search term
  const filteredConvs = conversations.filter(c =>
    c.pName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.tName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeConv = conversations.find(c => c.key === activeConvKey);

  return (
    <div className="space-y-6">
      <PageHeader 
        title={isRTL ? "مراقبة وإدارة محادثات البوابة" : "Portal Message Monitoring"} 
        subtitle={isRTL ? "الاطلاع الكامل ومراقبة المحادثات المتبادلة بين المعلمين وأولياء الأمور لضمان جودة التواصل." : "Full audit and monitoring of direct messages exchanged between teachers and parents."}
      >
        <Badge className="bg-rose-500/10 text-rose-600 border-none rounded-xl text-xs font-bold px-3 py-1 flex items-center gap-1.5 uppercase tracking-wide">
          <ShieldAlert size={14} />
          {isRTL ? "قسم الرقابة الإدارية" : "Administrative Audit"}
        </Badge>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white border border-stone-200/80 rounded-[32px] overflow-hidden shadow-sm h-[650px]">
        {/* Left/Right Conversations List */}
        <div className="md:col-span-5 border-r border-stone-100 flex flex-col h-full bg-stone-50/40 min-h-0">
          <div className="p-4 border-b border-stone-100">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
              <Input
                placeholder={isRTL ? "البحث باسم المعلم أو ولي الأمر..." : "Search teacher or parent..."}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pr-10 rounded-xl bg-white border-stone-200 text-xs h-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoading ? (
              <div className="text-center py-20 text-stone-400 text-xs font-semibold">
                {isRTL ? "جاري تحميل المحادثات..." : "Loading conversations..."}
              </div>
            ) : filteredConvs.length === 0 ? (
              <div className="text-center py-20 text-stone-400 text-xs">
                {isRTL ? "لا توجد محادثات نشطة متوفرة." : "No active chats found."}
              </div>
            ) : (
              filteredConvs.map(conv => {
                const isSelected = activeConvKey === conv.key;
                return (
                  <button
                    key={conv.key}
                    onClick={() => setActiveConvKey(conv.key)}
                    className={`w-full p-3.5 rounded-2xl flex flex-col gap-1 transition-all text-right cursor-pointer border ${
                      isSelected 
                        ? "bg-stone-900 text-white border-stone-900 shadow-md" 
                        : "hover:bg-stone-100/70 text-stone-700 bg-white/50 border-stone-100/50"
                    }`}
                  >
                    <div className="flex justify-between items-baseline w-full">
                      <span className="font-extrabold text-xs truncate max-w-[45%] text-stone-850 dark:text-inherit">
                        {conv.tName}
                      </span>
                      <span className={`text-[10px] ${isSelected ? "text-stone-400" : "text-stone-350"} shrink-0`}>
                        {isRTL ? "مع" : "with"}
                      </span>
                      <span className="font-extrabold text-xs truncate max-w-[45%] text-amber-600 dark:text-amber-400">
                        {conv.pName}
                      </span>
                    </div>

                    <div className="flex justify-between items-center w-full mt-1.5 pt-1.5 border-t border-stone-100/5 dark:border-white/5">
                      <p className={`text-[10px] truncate max-w-[70%] ${isSelected ? "text-stone-300" : "text-stone-400"}`}>
                        {conv.lastMessage ? conv.lastMessage.content : ""}
                      </p>
                      <span className={`text-[8px] ${isSelected ? "text-stone-400" : "text-stone-400"} num-en`}>
                        {conv.lastMessage && conv.lastMessage.created_at 
                          ? new Date(conv.lastMessage.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) 
                          : ""}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Messages Log view */}
        <div className="md:col-span-7 flex flex-col h-full bg-white relative min-h-0">
          {activeConv ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-stone-900 leading-tight">
                    {activeConv.tName} <span className="text-[10px] font-normal text-stone-400 mx-1">{isRTL ? "مَع" : "with"}</span> {activeConv.pName}
                  </h4>
                  <p className="text-[9px] text-stone-400 mt-1">
                    {isRTL 
                      ? `سجل المراقبة: ${activeConv.messages.length} رسالة متبادلة` 
                      : `Audit log: ${activeConv.messages.length} messages exchanged`
                    }
                  </p>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/20">
                {activeConv.messages.map(msg => {
                  const isParentSender = msg.sender_id.startsWith("parent-");
                  
                  return (
                    <div key={msg.id} className={`flex ${isParentSender ? "justify-start" : "justify-end"} w-full`}>
                      <div className={`max-w-[75%] rounded-2xl p-3 text-right shadow-sm border ${
                        isParentSender 
                          ? "bg-amber-500/5 text-stone-900 border-amber-200/55 rounded-tr-none" 
                          : "bg-white text-stone-900 border-stone-200/80 rounded-tl-none"
                      }`}>
                        <span className={`text-[8px] font-black block mb-1 uppercase tracking-wider ${isParentSender ? "text-amber-700" : "text-stone-550"}`}>
                          {msg.sender_name}
                        </span>

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
                                className="flex items-center gap-2 p-2 rounded-lg text-xs font-semibold bg-stone-50 text-stone-800 hover:bg-stone-100 border border-stone-200"
                              >
                                <FileText size={16} />
                                <span className="truncate flex-1">تحميل المرفق</span>
                                <Download size={14} />
                              </a>
                            )}
                          </div>
                        )}
                        <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <span className="text-[8px] block text-left mt-1 text-stone-400 num-en">
                          {msg.created_at ? new Date(msg.created_at).toLocaleString() : ""}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-45">
              <MessageSquare size={48} className="text-stone-400 mb-3" />
              <h4 className="font-serif text-lg font-bold text-stone-700">
                {isRTL ? "مراقبة محادثات البوابة" : "Audit Conversation Logs"}
              </h4>
              <p className="text-xs text-stone-500 max-w-sm mt-1">
                {isRTL 
                  ? "يرجى تحديد محادثة من القائمة لعرض سجل المراسلات والمرفقات بالكامل." 
                  : "Please select a conversation from the list to audit the messaging logs."
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
