import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  PieChart,
  Wallet,
  ArrowRight,
  Check,
  DollarSign,
  TrendingUp,
  Bell,
  Shield,
  Zap,
  Globe,
  Calculator,
  Receipt,
  UserPlus,
  Split,
  CheckCircle2,
  Target,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/App";

const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      
      {/* Gradient orbs */}
      <motion.div
        className="absolute top-0 -left-4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        animate={{
          x: [0, -100, 0],
          y: [0, -50, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};

const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-5xl mx-auto space-y-8"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center"
          >
            <Badge className="px-4 py-2 text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-2" />
              The Smart Way to Split Expenses
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight"
          >
            Split expenses,{" "}
            <br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              not friendships
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            Track shared expenses with friends, roommates, and groups. Know exactly who owes what
            with simplified balances and smart settlements.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              size="lg"
              className="text-lg px-8 py-6 rounded-full shadow-2xl hover:shadow-primary/20 group"
              onClick={() => navigate(user ? "/dashboard" : "/auth")}
            >
              {user ? "Go to Dashboard" : "Get Started Free"}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 rounded-full"
              onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              See How It Works
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-12"
          >
            {[
              { label: "Split Types", value: "4" },
              { label: "Simplified", value: "100%" },
              { label: "Free Forever", value: "∞" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const BentoFeatures = () => {
  const features = [
    {
      icon: Users,
      title: "Group Expenses",
      description: "Create unlimited groups for trips, roommates, events, or any shared expenses.",
      gradient: "from-blue-500/10 to-cyan-500/10",
      iconColor: "text-blue-500",
    },
    {
      icon: Calculator,
      title: "4 Split Types",
      description: "Equal, exact amounts, percentage, or by shares - split expenses your way.",
      gradient: "from-purple-500/10 to-pink-500/10",
      iconColor: "text-purple-500",
    },
    {
      icon: TrendingUp,
      title: "Smart Balances",
      description: "Simplified balance calculations show exactly who owes whom.",
      gradient: "from-green-500/10 to-emerald-500/10",
      iconColor: "text-green-500",
    },
    {
      icon: Zap,
      title: "Instant Updates",
      description: "Real-time balance updates as expenses and settlements are recorded.",
      gradient: "from-yellow-500/10 to-orange-500/10",
      iconColor: "text-yellow-500",
    },
    {
      icon: Bell,
      title: "Email Notifications",
      description: "Get notified when new expenses are added to your groups.",
      gradient: "from-red-500/10 to-rose-500/10",
      iconColor: "text-red-500",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "JWT authentication keeps your financial data safe and secure.",
      gradient: "from-indigo-500/10 to-violet-500/10",
      iconColor: "text-indigo-500",
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight">
            Everything you need to
            <br />
            <span className="text-primary">manage shared expenses</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to make splitting expenses effortless
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <Card className="h-full border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                <CardContent className="p-6 space-y-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center`}>
                    <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const HowItWorks = () => {
  const steps = [
    {
      icon: UserPlus,
      title: "Create a Group",
      description: "Add friends, roommates, or travel buddies to your group.",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      icon: Receipt,
      title: "Add Expenses",
      description: "Record shared expenses and choose how to split them.",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      icon: Calculator,
      title: "Track Balances",
      description: "See who owes what with simplified balance calculations.",
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      icon: CheckCircle2,
      title: "Settle Up",
      description: "Mark payments as settled and keep everyone updated.",
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
  ];

  return (
    <section id="how-it-works" className="relative py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight">
            How <span className="text-primary">EqualSplit</span> Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get started in minutes with our simple 4-step process
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="relative"
            >
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
              )}
              
              <div className="relative z-10 text-center space-y-4">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`w-20 h-20 ${step.bg} rounded-2xl flex items-center justify-center mx-auto shadow-lg`}
                >
                  <step.icon className={`w-10 h-10 ${step.color}`} />
                </motion.div>
                <div className="text-sm font-bold text-primary">Step {i + 1}</div>
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const SplitTypesShowcase = () => {
  const splitTypes = [
    {
      type: "Equal Split",
      icon: Split,
      description: "Divide expenses equally among all participants",
      example: "$100 ÷ 4 people = $25 each",
      color: "from-blue-500 to-cyan-500",
    },
    {
      type: "Exact Amount",
      icon: Target,
      description: "Specify exact amounts for each person",
      example: "You: $40, Friend: $35, Other: $25",
      color: "from-purple-500 to-pink-500",
    },
    {
      type: "Percentage Split",
      icon: PieChart,
      description: "Split by percentage based on contribution",
      example: "60%, 25%, 15% of total",
      color: "from-green-500 to-emerald-500",
    },
    {
      type: "By Shares",
      icon: Wallet,
      description: "Divide by shares or units consumed",
      example: "3 shares, 2 shares, 1 share",
      color: "from-orange-500 to-red-500",
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight">
            <span className="text-primary">4 Flexible</span> Split Types
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect way to divide any expense
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {splitTypes.map((split, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.03 }}
            >
              <Card className="h-full border-border/50 hover:border-primary/50 transition-all duration-300 overflow-hidden group">
                <div className={`h-2 bg-gradient-to-r ${split.color}`} />
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${split.color} flex items-center justify-center`}>
                      <split.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold">{split.type}</h3>
                  </div>
                  <p className="text-muted-foreground">{split.description}</p>
                  <div className="pt-2 border-t border-border/50">
                    <div className="text-sm font-mono text-primary font-semibold">{split.example}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const BenefitsSection = () => {
  const benefits = [
    "No complex math - we handle all calculations",
    "Simplified balances reduce number of transactions",
    "Track unlimited groups and expenses",
    "Real-time updates for all group members",
    "Email notifications keep everyone informed",
    "Secure JWT authentication",
    "Dashboard view of all your finances",
    "Mobile-responsive design",
  ];

  return (
    <section className="relative py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight">
              Why Choose
              <br />
              <span className="text-primary">EqualSplit?</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Built with simplicity and efficiency in mind, EqualSplit makes managing shared
              expenses a breeze.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-4"
          >
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="flex items-start gap-3 p-4 rounded-lg hover:bg-background/50 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <span className="text-lg">{benefit}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const CTASection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="relative py-24 overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="border-border/50 shadow-2xl bg-card/50 backdrop-blur-sm">
            <CardContent className="p-12 text-center space-y-8">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center"
              >
                <DollarSign className="w-10 h-10 text-primary" />
              </motion.div>
              
              <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight">
                Ready to Simplify Your
                <br />
                <span className="text-primary">Shared Expenses?</span>
              </h2>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join thousands of users who trust EqualSplit to manage their group expenses.
                Get started in less than a minute.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 rounded-full shadow-2xl hover:shadow-primary/20 group"
                  onClick={() => navigate(user ? "/dashboard" : "/auth")}
                >
                  {user ? "Go to Dashboard" : "Start Splitting Now"}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                No credit card required • Free forever • Set up in 60 seconds
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="relative border-t border-border/50 py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight">EqualSplit</span>
            </div>

            {/* Links */}
            <div className="flex gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms</a>
              <a href="#" className="hover:text-primary transition-colors">Support</a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
            © 2025 EqualSplit. Built for splitting expenses, not friendships.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function MarketingLanding() {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <BentoFeatures />
      <HowItWorks />
      <SplitTypesShowcase />
      <BenefitsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
