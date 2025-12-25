import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, api } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  Plus,
  ArrowRight,
  Receipt,
  HandCoins,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get("/dashboard");
      setDashboard(res.data);
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-8" data-testid="dashboard-loading">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <Skeleton className="h-48 col-span-full md:col-span-6" />
          <Skeleton className="h-48 col-span-full md:col-span-3" />
          <Skeleton className="h-48 col-span-full md:col-span-3" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="dashboard">
      {/* Header */}
      <div className="space-y-2 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-heading font-extrabold tracking-tight">
          Welcome back, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-lg text-muted-foreground">
          Here's your expense summary at a glance
        </p>
      </div>

      {/* Bento Grid */}
      <div className="bento-grid">
        {/* Hero Card - Net Balance */}
        <Card className="bento-hero card-interactive animate-slide-up" data-testid="balance-card">
          <CardContent className="p-8 h-full flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Net Balance
                </p>
                <p
                  className={`text-4xl md:text-5xl font-mono font-medium tracking-tighter ${
                    dashboard?.net_balance >= 0 ? "text-income" : "text-expense"
                  }`}
                  data-testid="net-balance"
                >
                  {formatAmount(Math.abs(dashboard?.net_balance || 0))}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {dashboard?.net_balance >= 0
                    ? "You are owed overall"
                    : "You owe overall"}
                </p>
              </div>
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  dashboard?.net_balance >= 0 ? "bg-income" : "bg-expense"
                }`}
              >
                <Wallet
                  className={`w-7 h-7 ${
                    dashboard?.net_balance >= 0 ? "text-income" : "text-expense"
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-income" />
                  <span className="text-xs text-muted-foreground">You are owed</span>
                </div>
                <p className="text-2xl font-mono font-medium text-income" data-testid="owed-to-you">
                  {formatAmount(dashboard?.total_owed_to_you || 0)}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-4 h-4 text-expense" />
                  <span className="text-xs text-muted-foreground">You owe</span>
                </div>
                <p className="text-2xl font-mono font-medium text-expense" data-testid="you-owe">
                  {formatAmount(dashboard?.total_you_owe || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Groups Card */}
        <Card className="col-span-full md:col-span-3 card-interactive animate-slide-up stagger-1" data-testid="groups-summary-card">
          <CardContent className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <Badge variant="secondary" className="font-mono">
                {dashboard?.total_groups || 0}
              </Badge>
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                Active Groups
              </p>
              <p className="text-sm text-muted-foreground">
                Track expenses across multiple groups
              </p>
            </div>
            <Button
              variant="ghost"
              className="w-full mt-4 justify-between"
              onClick={() => navigate("/groups")}
              data-testid="view-groups-btn"
            >
              View Groups
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="col-span-full md:col-span-3 card-interactive animate-slide-up stagger-2" data-testid="quick-actions-card">
          <CardContent className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Plus className="w-6 h-6 text-accent" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                Quick Actions
              </p>
              <p className="text-sm text-muted-foreground">
                Add expenses or create new groups
              </p>
            </div>
            <Button
              className="w-full mt-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/20 active-scale"
              onClick={() => navigate("/groups")}
              data-testid="create-group-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Group
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-full card-interactive animate-slide-up stagger-3" data-testid="activity-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-heading font-bold flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard?.recent_activity?.length === 0 ? (
              <div className="empty-state py-12">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Receipt className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-heading font-semibold mb-2">No activity yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a group and add your first expense
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate("/groups")}
                  className="rounded-full"
                >
                  Get Started
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {dashboard?.recent_activity?.map((item, index) => (
                    <div
                      key={item.id}
                      className="activity-item cursor-pointer hover-lift"
                      onClick={() => navigate(`/groups/${item.group_id}`)}
                      style={{ animationDelay: `${index * 0.05}s` }}
                      data-testid={`activity-item-${index}`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          item.type === "expense" ? "bg-expense" : "bg-income"
                        }`}
                      >
                        {item.type === "expense" ? (
                          <Receipt className="w-5 h-5 text-expense" />
                        ) : (
                          <HandCoins className="w-5 h-5 text-income" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {item.type === "expense"
                            ? item.description
                            : `${item.from_user_name} paid ${item.to_user_name}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.type === "expense"
                            ? `Paid by ${item.paid_by_name}`
                            : "Settlement"}{" "}
                          · {item.group_name}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p
                          className={`font-mono font-medium ${
                            item.type === "expense" ? "text-foreground" : "text-income"
                          }`}
                        >
                          {formatAmount(item.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
