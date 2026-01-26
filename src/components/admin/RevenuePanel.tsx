import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Calendar, Loader2, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useRevenueData } from "@/hooks/useRevenueData";
import { CornerAccent } from "@/components/decorative/CornerAccent";
import { StatusDot } from "@/components/ui/StatusDot";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-sm p-3 shadow-lg">
        <p className="font-mono text-xs text-muted-foreground mb-1">
          {formatDate(label)}
        </p>
        <p className="font-mono text-sm text-cyan-400">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export const RevenuePanel = () => {
  const {
    dailyRevenue,
    totalRevenue,
    averageDaily,
    peakDay,
    paymentCount,
    isLoading,
    error,
  } = useRevenueData();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative bg-card border border-border rounded-sm overflow-hidden"
    >
      <CornerAccent position="tl" size={20} />
      <CornerAccent position="br" size={20} />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-cyan-500/10 rounded-sm border border-cyan-500/30">
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-mono text-sm font-medium">&gt; REVENUE_STREAM</h3>
            <p className="font-mono text-xs text-muted-foreground">// last 30 days</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusDot status="online" />
          <span className="font-mono text-xs text-green-400">LIVE</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 p-4 border-b border-border">
        <div className="text-center">
          <p className="font-mono text-2xl font-bold text-cyan-400">
            {isLoading ? "..." : formatCurrency(totalRevenue)}
          </p>
          <p className="font-mono text-xs text-muted-foreground">30D Total</p>
        </div>
        <div className="text-center border-x border-border">
          <p className="font-mono text-2xl font-bold text-foreground">
            {isLoading ? "..." : formatCurrency(averageDaily)}
          </p>
          <p className="font-mono text-xs text-muted-foreground">Daily Avg</p>
        </div>
        <div className="text-center">
          <p className="font-mono text-2xl font-bold text-primary">
            {isLoading ? "..." : formatCurrency(peakDay.amount)}
          </p>
          <p className="font-mono text-xs text-muted-foreground">Peak Day</p>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4 h-64">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-8 h-8 text-destructive mb-2" />
            <p className="font-mono text-xs text-muted-foreground">
              // error loading revenue data
            </p>
          </div>
        ) : dailyRevenue.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <TrendingUp className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="font-mono text-xs text-muted-foreground">
              // no payment data available
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={dailyRevenue}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "monospace" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(v) => `$${v}`}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "monospace" }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#00E5FF"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#00E5FF", stroke: "hsl(var(--background))", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border bg-surface-elevated/30">
        <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar size={12} />
            <span>{paymentCount} payments processed</span>
          </div>
          <span>// Whop API</span>
        </div>
      </div>
    </motion.div>
  );
};
