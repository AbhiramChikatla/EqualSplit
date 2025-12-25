import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, api } from "@/App";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Users, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";

export default function Groups() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: "", description: "" });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await api.get("/groups");
      setGroups(res.data);
    } catch (err) {
      toast.error("Failed to fetch groups");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroup.name.trim()) {
      toast.error("Group name is required");
      return;
    }
    setCreating(true);
    try {
      const res = await api.post("/groups", newGroup);
      setGroups([res.data, ...groups]);
      setCreateOpen(false);
      setNewGroup({ name: "", description: "" });
      toast.success("Group created successfully!");
      navigate(`/groups/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(Math.abs(amount));
  };

  if (loading) {
    return (
      <div className="space-y-8" data-testid="groups-loading">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="groups-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-extrabold tracking-tight">
            Groups
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your expense groups
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/20 active-scale"
              data-testid="create-group-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Group
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md" data-testid="create-group-dialog">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl font-bold">
                Create New Group
              </DialogTitle>
              <DialogDescription>
                Create a group to start tracking shared expenses
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateGroup} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="group-name">Group Name</Label>
                <Input
                  id="group-name"
                  data-testid="group-name-input"
                  placeholder="e.g., Vacation Trip, Roommates"
                  value={newGroup.name}
                  onChange={(e) =>
                    setNewGroup({ ...newGroup, name: e.target.value })
                  }
                  className="input-focus"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group-description">Description (optional)</Label>
                <Textarea
                  id="group-description"
                  data-testid="group-description-input"
                  placeholder="What's this group for?"
                  value={newGroup.description}
                  onChange={(e) =>
                    setNewGroup({ ...newGroup, description: e.target.value })
                  }
                  className="input-focus resize-none"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCreateOpen(false)}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 active-scale"
                  data-testid="submit-create-group"
                >
                  {creating && <span className="spinner mr-2" />}
                  Create Group
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <div className="empty-state py-20 animate-slide-up" data-testid="no-groups">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
            <Users className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-heading font-bold mb-2">No groups yet</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Create your first group to start tracking shared expenses with friends,
            family, or roommates.
          </p>
          <Button
            onClick={() => setCreateOpen(true)}
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Group
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group, index) => (
            <Card
              key={group.id}
              className="card-interactive cursor-pointer hover-lift animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => navigate(`/groups/${group.id}`)}
              data-testid={`group-card-${index}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-bold text-lg truncate">
                      {group.name}
                    </h3>
                    {group.description && (
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {group.description}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-2" />
                </div>

                {/* Members */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="avatar-stack">
                    {group.member_details?.slice(0, 4).map((member, i) => (
                      <Avatar
                        key={member.id}
                        className="w-8 h-8 border-2 border-background"
                      >
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                          {member.name?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {group.member_details?.length > 4 && (
                      <Avatar className="w-8 h-8 border-2 border-background">
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                          +{group.member_details.length - 4}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {group.member_details?.length || 0} members
                  </span>
                </div>

                {/* Balance */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    {group.user_balance >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-income" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-expense" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      Your balance
                    </span>
                  </div>
                  <p
                    className={`text-xl font-mono font-medium mt-1 ${
                      group.user_balance >= 0 ? "text-income" : "text-expense"
                    }`}
                  >
                    {group.user_balance >= 0 ? "+" : "-"}
                    {formatAmount(group.user_balance)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
