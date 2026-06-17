import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, Users, MessageCircle, UserCheck, Trophy, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const NOTIF_ICONS = {
  friend_request: Users,
  friend_accepted: UserCheck,
  message: MessageCircle,
  award: Trophy,
  fine: AlertTriangle,
};

export default function PortalNotifications({ me }) {
  const qc = useQueryClient();
  const [selectedFine, setSelectedFine] = useState(null);

  const { data: notifs = [] } = useQuery({
    queryKey: ["portal-notifs", me.id],
    queryFn: () => entities.PortalNotification.filter({ recipient_id: me.id }),
    refetchInterval: 10000,
  });

  const { data: fines = [] } = useQuery({
    queryKey: ["student-fines", me.id],
    queryFn: () => entities.Fine.filter({ student_id: me.id }),
    enabled: !!me?.id,
  });

  // Auto mark all as read when this component mounts / notifs load
  useEffect(() => {
    const unread = notifs.filter(n => !n.is_read);
    if (unread.length === 0) return;
    Promise.all(unread.map(n => entities.PortalNotification.update(n.id, { is_read: true }))).then(() => {
      qc.invalidateQueries(["portal-notifs"]);
    });
  }, [notifs.length]);

  const sorted = [...notifs].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  return (
    <div className="space-y-4">
      <p className="font-semibold text-sm">Notifications</p>

      {sorted.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Bell className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No notifications yet</p>
        </div>
      )}

      <div className="space-y-2">
         {sorted.map(notif => {
           const Icon = NOTIF_ICONS[notif.type] || Bell;
           const isNew = !notif.is_read;
           const isFineNotif = notif.type === 'fine';
           const relatedFine = isFineNotif ? fines.find(f => f.id === notif.related_entity_id) : null;

           return (
             <Card 
               key={notif.id} 
               className={`cursor-pointer transition-colors ${isNew ? "border-primary/30 bg-primary/5" : "opacity-70"} ${isFineNotif && relatedFine ? "hover:bg-muted/50" : ""}`}
               onClick={() => isFineNotif && relatedFine && setSelectedFine(relatedFine)}
             >
               <CardContent className="p-3 flex items-start gap-3">
                 <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${isNew ? isFineNotif ? "bg-destructive/20" : "bg-primary/20" : "bg-muted"}`}>
                   <Icon className={`h-4 w-4 ${isNew ? isFineNotif ? "text-destructive" : "text-primary" : "text-muted-foreground"}`} />
                 </div>
                 <div className="flex-1">
                   <p className="text-sm">{notif.message}</p>
                   <p className="text-xs text-muted-foreground mt-0.5">
                     {new Date(notif.created_date).toLocaleString()}
                   </p>
                 </div>
                 {isNew && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
               </CardContent>
             </Card>
           );
         })}
       </div>

       {/* Fine Details Modal */}
       <Dialog open={!!selectedFine} onOpenChange={() => setSelectedFine(null)}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <AlertTriangle className="h-5 w-5 text-destructive" />
               Fine Details
             </DialogTitle>
           </DialogHeader>
           {selectedFine && (
             <div className="space-y-4">
               <div>
                 <label className="text-xs text-muted-foreground">Reason</label>
                 <p className="text-sm font-medium">{selectedFine.reason}</p>
               </div>
               <div>
                 <label className="text-xs text-muted-foreground">Category</label>
                 <Badge variant="outline" className="mt-1">{selectedFine.category}</Badge>
               </div>
               <div>
                 <label className="text-xs text-muted-foreground">Amount</label>
                 <p className="text-lg font-bold text-destructive">{selectedFine.amount}</p>
               </div>
               <div>
                 <label className="text-xs text-muted-foreground">Status</label>
                 <Badge 
                   variant="outline"
                   className={`mt-1 ${selectedFine.status === 'paid' ? 'bg-green-500/10 text-green-700' : selectedFine.status === 'waived' ? 'bg-blue-500/10 text-blue-700' : 'bg-yellow-500/10 text-yellow-700'}`}
                 >
                   {selectedFine.status}
                 </Badge>
               </div>
               <div>
                 <label className="text-xs text-muted-foreground">Date</label>
                 <p className="text-sm">{new Date(selectedFine.date).toLocaleDateString()}</p>
               </div>
               {selectedFine.notes && (
                 <div>
                   <label className="text-xs text-muted-foreground">Notes</label>
                   <p className="text-sm">{selectedFine.notes}</p>
                 </div>
               )}
             </div>
           )}
         </DialogContent>
       </Dialog>
    </div>
  );
}