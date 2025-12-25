import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth, api } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  ArrowLeft,
  UserPlus,
  Receipt,
  HandCoins,
  Users,
  Trash2,
  Equal,
  Percent,
  DollarSign,
  Hash,
  Check,
  ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function GroupDetail() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Expense form
  const [expense, setExpense] = useState({
    description: "",
    amount: "",
    paid_by: "",
    split_type: "equal",
    participants: [],
    splits: [],
  });

  // Member form
  const [memberData, setMemberData] = useState({ name: "", email: "" });

  // Settlement form
  const [settlement, setSettlement] = useState({
    from_user: "",
    to_user: "",
    amount: "",
  });

  useEffect(() => {
    fetchGroup();
  }, [groupId]);

  useEffect(() => {
    if (group && user) {
      setExpense((prev) => ({
        ...prev,
        paid_by: user.id,
        participants: group.members || [],
      }));
    }
  }, [group, user]);

  const fetchGroup = async () => {
    try {
      const res = await api.get(`/groups/${groupId}`);
      setGroup(res.data);
    } catch (err) {
      toast.error("Failed to fetch group");
      navigate("/groups");
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expense.description.trim() || !expense.amount || !expense.paid_by) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        group_id: groupId,
        description: expense.description,
        amount: parseFloat(expense.amount),
        paid_by: expense.paid_by,
        split_type: expense.split_type,
      };

      if (expense.split_type === "equal") {
        payload.participants = expense.participants.length > 0 
          ? expense.participants 
          : group.members;
      } else {
        payload.splits = expense.splits;
      }

      await api.post("/expenses", payload);
      await fetchGroup();
      setExpenseOpen(false);
      resetExpenseForm();
      toast.success("Expense added successfully!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add expense");
    } finally {
      setSubmitting(false);
    }
  };

  const resetExpenseForm = () => {
    setExpense({
      description: "",
      amount: "",
      paid_by: user?.id || "",
      split_type: "equal",
      participants: group?.members || [],
      splits: [],
    });
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberData.email.trim() || !memberData.name.trim()) {
      toast.error("Please enter both name and email");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/groups/${groupId}/members`, memberData);
      await fetchGroup();
      setMemberOpen(false);
      setMemberData({ name: "", email: "" });
      toast.success("Member added and invitation email sent!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add member");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSettle = async (e) => {
    e.preventDefault();
    if (!settlement.from_user || !settlement.to_user || !settlement.amount) {
      toast.error("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/settlements", {
        group_id: groupId,
        from_user: settlement.from_user,
        to_user: settlement.to_user,
        amount: parseFloat(settlement.amount),
      });
      await fetchGroup();
      setSettleOpen(false);
      setSettlement({ from_user: "", to_user: "", amount: "" });
      toast.success("Settlement recorded!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to record settlement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    
    try {
      await api.delete(`/expenses/${expenseId}`);
      await fetchGroup();
      toast.success("Expense deleted");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete expense");
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(Math.abs(amount));
  };

  const getMemberName = (memberId) => {
    const member = group?.member_details?.find((m) => m.id === memberId);
    return member?.name || "Unknown";
  };

  const splitTypes = [
    { value: "equal", label: "Equal", icon: Equal, description: "Split equally among all" },
    { value: "exact", label: "Exact", icon: DollarSign, description: "Specify exact amounts" },
    { value: "percentage", label: "Percentage", icon: Percent, description: "Split by percentage" },
    { value: "shares", label: "Shares", icon: Hash, description: "Split by share ratio" },
  ];

  const initializeSplits = (type) => {
    const members = group?.member_details || [];
    if (type === "equal") {
      setExpense((prev) => ({
        ...prev,
        split_type: type,
        participants: members.map((m) => m.id),
        splits: [],
      }));
    } else {
      const splits = members.map((m) => ({
        user_id: m.id,
        amount: type === "exact" ? 0 : undefined,
        percentage: type === "percentage" ? 0 : undefined,
        shares: type === "shares" ? 1 : undefined,
      }));
      setExpense((prev) => ({
        ...prev,
        split_type: type,
        participants: [],
        splits,
      }));
    }
  };

  const updateSplit = (index, field, value) => {
    setExpense((prev) => {
      const newSplits = [...prev.splits];
      newSplits[index] = { ...newSplits[index], [field]: parseFloat(value) || 0 };
      return { ...prev, splits: newSplits };
    });
  };

  if (loading) {
    return (
      <div className="space-y-8" data-testid="group-detail-loading">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="group-detail">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/groups")}
            className="rounded-full"
            data-testid="back-button"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-extrabold tracking-tight">
              {group?.name}
            </h1>
            {group?.description && (
              <p className="text-muted-foreground mt-1">{group.description}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-full" data-testid="add-member-button">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="add-member-dialog">
              <DialogHeader>
                <DialogTitle className="font-heading font-bold">Add Member</DialogTitle>
                <DialogDescription>
                  Add someone to this group and they'll receive an invitation email
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddMember} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="member-name">Name</Label>
                  <Input
                    id="member-name"
                    data-testid="member-name-input"
                    type="text"
                    placeholder="John Doe"
                    value={memberData.name}
                    onChange={(e) => setMemberData({ ...memberData, name: e.target.value })}
                    className="input-focus"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-email">Email Address</Label>
                  <Input
                    id="member-email"
                    data-testid="member-email-input"
                    type="email"
                    placeholder="friend@example.com"
                    value={memberData.email}
                    onChange={(e) => setMemberData({ ...memberData, email: e.target.value })}
                    className="input-focus"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setMemberOpen(false)} className="rounded-full">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="rounded-full" data-testid="submit-add-member">
                    {submitting && <span className="spinner mr-2" />}
                    Add Member
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={expenseOpen} onOpenChange={(open) => {
            setExpenseOpen(open);
            if (open) resetExpenseForm();
          }}>
            <DialogTrigger asChild>
              <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/20 active-scale" data-testid="add-expense-button">
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" data-testid="add-expense-dialog">
              <DialogHeader>
                <DialogTitle className="font-heading font-bold text-xl">Add Expense</DialogTitle>
                <DialogDescription>
                  Add a new shared expense to this group
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddExpense} className="space-y-6 mt-4">
                {/* Amount Input */}
                <div className="text-center py-4">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Amount</Label>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="text-3xl font-mono text-muted-foreground">$</span>
                    <input
                      type="number"
                      data-testid="expense-amount-input"
                      placeholder="0.00"
                      value={expense.amount}
                      onChange={(e) => setExpense({ ...expense, amount: e.target.value })}
                      className="amount-input w-40 text-foreground outline-none"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expense-desc">Description</Label>
                  <Input
                    id="expense-desc"
                    data-testid="expense-description-input"
                    placeholder="What was this expense for?"
                    value={expense.description}
                    onChange={(e) => setExpense({ ...expense, description: e.target.value })}
                    className="input-focus"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Paid by</Label>
                  <Select
                    value={expense.paid_by}
                    onValueChange={(val) => setExpense({ ...expense, paid_by: val })}
                  >
                    <SelectTrigger data-testid="expense-payer-select">
                      <SelectValue placeholder="Select who paid" />
                    </SelectTrigger>
                    <SelectContent>
                      {group?.member_details?.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name} {member.id === user?.id && "(You)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Split Type Selection */}
                <div className="space-y-3">
                  <Label>Split Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {splitTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => initializeSplits(type.value)}
                        className={`split-type-card text-left ${
                          expense.split_type === type.value ? "selected" : ""
                        }`}
                        data-testid={`split-type-${type.value}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <type.icon className="w-4 h-4" />
                          <span className="font-medium">{type.label}</span>
                          {expense.split_type === type.value && (
                            <Check className="w-4 h-4 text-primary ml-auto" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Split Details */}
                {expense.split_type === "equal" && (
                  <div className="space-y-3">
                    <Label>Split among</Label>
                    <div className="space-y-2">
                      {group?.member_details?.map((member) => (
                        <label
                          key={member.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={expense.participants.includes(member.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setExpense((prev) => ({
                                  ...prev,
                                  participants: [...prev.participants, member.id],
                                }));
                              } else {
                                setExpense((prev) => ({
                                  ...prev,
                                  participants: prev.participants.filter((id) => id !== member.id),
                                }));
                              }
                            }}
                            className="w-4 h-4 rounded border-border"
                          />
                          <span className="flex-1">{member.name}</span>
                          {expense.amount && expense.participants.includes(member.id) && (
                            <span className="text-sm font-mono text-muted-foreground">
                              {formatAmount(parseFloat(expense.amount) / expense.participants.length)}
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {expense.split_type !== "equal" && (
                  <div className="space-y-3">
                    <Label>
                      {expense.split_type === "exact" && "Exact amounts"}
                      {expense.split_type === "percentage" && "Percentages"}
                      {expense.split_type === "shares" && "Number of shares"}
                    </Label>
                    <div className="space-y-2">
                      {expense.splits.map((split, index) => {
                        const member = group?.member_details?.find((m) => m.id === split.user_id);
                        return (
                          <div
                            key={split.user_id}
                            className="flex items-center gap-3 p-3 rounded-lg border border-border"
                          >
                            <span className="flex-1">{member?.name}</span>
                            <Input
                              type="number"
                              data-testid={`split-input-${index}`}
                              className="w-24 text-right input-focus"
                              placeholder="0"
                              value={
                                expense.split_type === "exact"
                                  ? split.amount || ""
                                  : expense.split_type === "percentage"
                                  ? split.percentage || ""
                                  : split.shares || ""
                              }
                              onChange={(e) =>
                                updateSplit(
                                  index,
                                  expense.split_type === "exact"
                                    ? "amount"
                                    : expense.split_type === "percentage"
                                    ? "percentage"
                                    : "shares",
                                  e.target.value
                                )
                              }
                              step={expense.split_type === "shares" ? "1" : "0.01"}
                              min="0"
                            />
                            <span className="text-sm text-muted-foreground w-8">
                              {expense.split_type === "exact" && "$"}
                              {expense.split_type === "percentage" && "%"}
                              {expense.split_type === "shares" && "x"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setExpenseOpen(false)} className="rounded-full">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="rounded-full bg-primary" data-testid="submit-add-expense">
                    {submitting && <span className="spinner mr-2" />}
                    Add Expense
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Expenses & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Expenses List */}
          <Card className="card-interactive animate-slide-up" data-testid="expenses-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-heading font-bold flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                Expenses
                <Badge variant="secondary" className="ml-auto font-mono">
                  {group?.expenses?.length || 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {group?.expenses?.length === 0 ? (
                <div className="empty-state py-12">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                    <Receipt className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-heading font-semibold mb-2">No expenses yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Add your first expense to start tracking
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {group?.expenses?.map((exp, index) => (
                      <div
                        key={exp.id}
                        className="activity-item group"
                        data-testid={`expense-item-${index}`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-expense flex items-center justify-center flex-shrink-0">
                          <Receipt className="w-5 h-5 text-expense" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{exp.description}</p>
                          <p className="text-sm text-muted-foreground">
                            Paid by {getMemberName(exp.paid_by)} · {exp.split_type} split
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-mono font-medium">{formatAmount(exp.amount)}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(exp.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        {exp.created_by === user?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteExpense(exp.id)}
                            data-testid={`delete-expense-${index}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Members & Balances */}
        <div className="space-y-6">
          {/* Members */}
          <Card className="card-interactive animate-slide-up stagger-1" data-testid="members-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-heading font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {group?.member_details?.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar className="w-9 h-9 border-2 border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {member.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {member.name}
                        {member.id === user?.id && (
                          <span className="text-muted-foreground ml-1">(You)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                    {member.id === group?.created_by && (
                      <Badge variant="secondary" className="text-xs">Owner</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Balances */}
          <Card className="card-interactive animate-slide-up stagger-2" data-testid="balances-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-heading font-bold flex items-center gap-2">
                <HandCoins className="w-5 h-5 text-primary" />
                Balances
              </CardTitle>
            </CardHeader>
            <CardContent>
              {group?.balances?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">All settled up!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {group?.balances?.map((balance, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                      data-testid={`balance-item-${index}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium truncate">
                            {balance.from_user === user?.id ? "You" : getMemberName(balance.from_user)}
                          </span>
                          <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium truncate">
                            {balance.to_user === user?.id ? "You" : getMemberName(balance.to_user)}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-medium text-expense">
                        {formatAmount(balance.amount)}
                      </span>
                    </div>
                  ))}

                  <Separator className="my-4" />

                  <Dialog open={settleOpen} onOpenChange={setSettleOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                        data-testid="settle-up-button"
                      >
                        <HandCoins className="w-4 h-4 mr-2" />
                        Settle Up
                      </Button>
                    </DialogTrigger>
                    <DialogContent data-testid="settle-up-dialog">
                      <DialogHeader>
                        <DialogTitle className="font-heading font-bold">Record Settlement</DialogTitle>
                        <DialogDescription>
                          Record a payment between group members
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSettle} className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label>From (who paid)</Label>
                          <Select
                            value={settlement.from_user}
                            onValueChange={(val) => setSettlement({ ...settlement, from_user: val })}
                          >
                            <SelectTrigger data-testid="settle-from-select">
                              <SelectValue placeholder="Select person" />
                            </SelectTrigger>
                            <SelectContent>
                              {group?.member_details?.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                  {member.name} {member.id === user?.id && "(You)"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>To (who received)</Label>
                          <Select
                            value={settlement.to_user}
                            onValueChange={(val) => setSettlement({ ...settlement, to_user: val })}
                          >
                            <SelectTrigger data-testid="settle-to-select">
                              <SelectValue placeholder="Select person" />
                            </SelectTrigger>
                            <SelectContent>
                              {group?.member_details
                                ?.filter((m) => m.id !== settlement.from_user)
                                .map((member) => (
                                  <SelectItem key={member.id} value={member.id}>
                                    {member.name} {member.id === user?.id && "(You)"}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Amount</Label>
                          <Input
                            type="number"
                            data-testid="settle-amount-input"
                            placeholder="0.00"
                            value={settlement.amount}
                            onChange={(e) => setSettlement({ ...settlement, amount: e.target.value })}
                            className="input-focus"
                            step="0.01"
                            min="0"
                            required
                          />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                          <Button type="button" variant="ghost" onClick={() => setSettleOpen(false)} className="rounded-full">
                            Cancel
                          </Button>
                          <Button type="submit" disabled={submitting} className="rounded-full" data-testid="submit-settle">
                            {submitting && <span className="spinner mr-2" />}
                            Record Settlement
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
