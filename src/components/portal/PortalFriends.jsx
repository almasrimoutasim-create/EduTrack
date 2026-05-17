import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Check, X } from "lucide-react";
import StudentProfile from "./StudentProfile";

export default function PortalFriends({ me, onViewProfile }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [viewProfile, setViewProfile] = useState(null);

  const { data: allStudents = [] } = useQuery({
    queryKey: ["all-students"],
    queryFn: () => base44.entities.Student.list(),
  });
  const { data: allTeachers = [] } = useQuery({
    queryKey: ["all-teachers"],
    queryFn: () => base44.entities.Teacher.list(),
  });
  const { data: requests = [] } = useQuery({
    queryKey: ["friend-requests", me.id],
    queryFn: () => base44.entities.FriendRequest.list(),
  });

  const myRequests = requests.filter(r => r.from_id === me.id || r.to_id === me.id);
  const accepted = myRequests.filter(r => r.status === "accepted");
  const incoming = requests.filter(r => r.to_id === me.id && r.status === "pending");
  const sentIds = requests.filter(r => r.from_id === me.id && r.status === "pending").map(r => r.to_id);
  const friendIds = new Set(accepted.map(r => r.from_id === me.id ? r.to_id : r.from_id));

  const everyone = [
    ...allStudents.filter(s => s.id !== me.id).map(s => ({ ...s, _role: "student" })),
    ...allTeachers.map(t => ({ ...t, id: `teacher_${t.id}`, _role: "teacher", full_name: t.full_name })),
  ];

  const filtered = search
    ? everyone.filter(p => p.full_name?.toLowerCase().includes(search.toLowerCase()))
    : [];

  const sendRequest = async (person) => {
    await base44.entities.FriendRequest.create({
      from_id: me.id,
      from_name: me.full_name,
      from_photo: me.photo_url || "",
      from_role: "student",
      to_id: person.id,
      to_name: person.full_name,
    });
    await base44.entities.PortalNotification.create({
      recipient_id: person.id,
      message: `${me.full_name} sent you a friend request`,
      type: "friend_request",
      ref_id: me.id,
    });
    qc.invalidateQueries(["friend-requests"]);
  };

  const respond = async (req, status) => {
    await base44.entities.FriendRequest.update(req.id, { status });
    if (status === "accepted") {
      await base44.entities.PortalNotification.create({
        recipient_id: req.from_id,
        message: `${me.full_name} accepted your friend request`,
        type: "friend_accepted",
        ref_id: me.id,
      });
    }
    qc.invalidateQueries(["friend-requests"]);
  };

  const handleViewProfile = (person) => {
    if (onViewProfile) {
      const full = allStudents.find(s => s.id === person.id) || person;
      onViewProfile(full);
    } else {
      setViewProfile(person);
    }
  };

  // If viewing a profile (fallback when no onViewProfile passed)
  if (viewProfile) {
    const fullStudent = allStudents.find(s => s.id === viewProfile.id) || viewProfile;
    return <StudentProfile student={fullStudent} me={me} onBack={() => setViewProfile(null)} />;
  }

  const Avatar = ({ person, size = "md" }) => {
    const dim = size === "sm" ? "h-9 w-9 text-sm" : "h-10 w-10";
    return person.photo_url ? (
      <img src={person.photo_url} className={`${dim} rounded-full object-cover`} alt="" />
    ) : (
      <div className={`${dim} rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary`}>
        {person.full_name[0]}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Incoming Requests */}
      {incoming.length > 0 && (
        <div>
          <p className="font-semibold text-sm mb-2">Friend Requests ({incoming.length})</p>
          <div className="space-y-2">
            {incoming.map(req => (
              <Card key={req.id}>
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {req.from_photo ? (
                      <img src={req.from_photo} className="h-10 w-10 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {req.from_name[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{req.from_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{req.from_role}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-8 w-8 p-0" onClick={() => respond(req, "accepted")}><Check className="h-4 w-4" /></Button>
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => respond(req, "declined")}><X className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Friends list */}
      <div>
        <p className="font-semibold text-sm mb-2">My Friends ({friendIds.size})</p>
        {friendIds.size === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No friends yet. Search below to add people.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {[...everyone.filter(p => friendIds.has(p.id))].map(p => (
              <Card
                key={p.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => p._role === "student" && handleViewProfile(p)}
              >
                <CardContent className="p-3 flex items-center gap-2">
                  <Avatar person={p} size="sm" />
                  <div className="overflow-hidden">
                    <p className="font-medium text-sm truncate">{p.full_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{p._role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Search & Add */}
      <div>
        <p className="font-semibold text-sm mb-2">Find People</p>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search students or teachers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {search && (
          <div className="space-y-2">
            {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No results</p>}
            {filtered.map(person => {
              const isFriend = friendIds.has(person.id);
              const isPending = sentIds.includes(person.id);
              return (
                <Card key={person.id}>
                  <CardContent className="p-3 flex items-center justify-between gap-3">
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => person._role === "student" && handleViewProfile(person)}
                    >
                      <Avatar person={person} size="sm" />
                      <div>
                        <p className="font-medium text-sm">{person.full_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{person._role}{person.grade ? ` · Grade ${person.grade}` : ""}</p>
                      </div>
                    </div>
                    {isFriend ? (
                      <span className="text-xs text-green-600 font-medium">Friends</span>
                    ) : isPending ? (
                      <span className="text-xs text-muted-foreground">Sent</span>
                    ) : (
                      <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => sendRequest(person)}>
                        <UserPlus className="h-3.5 w-3.5" /> Add
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}