import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, Zap, TrendingUp, Activity, Calendar } from "lucide-react";

interface DashboardData {
  totalEvents: number;
  eventsByType: { event_type: string; count: number }[];
  topEvents: { event_name: string; count: number }[];
  dailyCounts: { date: string; count: number }[];
  activeUsers: number;
  recentEvents?: { event_type: string; event_name: string; user_id: string | null; timestamp: string }[];
}

const BAR_COLORS = [
  "bg-cyan-400", "bg-purple-400", "bg-green-400", "bg-pink-400",
  "bg-yellow-400", "bg-blue-400", "bg-red-400", "bg-orange-400",
  "bg-teal-400", "bg-indigo-400", "bg-emerald-400", "bg-fuchsia-400",
];

export default function AnalyticsDashboard() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/analytics/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  const totalEvents = data?.totalEvents ?? 0;
  const activeUsers = data?.activeUsers ?? 0;
  const eventsByType = data?.eventsByType ?? [];
  const topEvents = (data?.topEvents ?? []).slice(0, 20);
  const dailyCounts = data?.dailyCounts ?? [];
  const recentEvents = (data?.recentEvents ?? []).slice(0, 50);
  const topFeature = topEvents.length > 0 ? topEvents[0].event_name : "N/A";
  const eventsToday = dailyCounts.length > 0 ? dailyCounts[dailyCounts.length - 1]?.count ?? 0 : 0;
  const maxEventType = Math.max(...eventsByType.map((e) => e.count), 1);
  const maxDaily = Math.max(...dailyCounts.map((d) => d.count), 1);

  const summaryCards = [
    { label: "Total Events", value: totalEvents.toLocaleString(), icon: Activity, color: "text-cyan-400", bg: "from-cyan-500/10 to-cyan-500/5" },
    { label: "Active Users", value: activeUsers.toLocaleString(), icon: Users, color: "text-purple-400", bg: "from-purple-500/10 to-purple-500/5" },
    { label: "Top Feature", value: topFeature, icon: Zap, color: "text-green-400", bg: "from-green-500/10 to-green-500/5" },
    { label: "Events Today", value: eventsToday.toLocaleString(), icon: TrendingUp, color: "text-pink-400", bg: "from-pink-500/10 to-pink-500/5" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-cyan-400" />
          <h1 className="text-3xl font-bold text-white tracking-tight">App Analytics</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card) => (
            <Card key={card.label} className={`bg-gradient-to-br ${card.bg} border border-white/10 backdrop-blur-xl shadow-lg`}>
              <CardContent className="p-5 flex items-center gap-4">
                <card.icon className={`h-10 w-10 ${card.color} shrink-0`} />
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider">{card.label}</p>
                  <p className="text-white text-xl font-bold truncate">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/5 border border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-cyan-400" /> Events by Type
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {eventsByType.map((item, i) => (
                <div key={item.event_type} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">{item.event_type}</span>
                    <span className="text-gray-400">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3">
                    <div
                      className={`${BAR_COLORS[i % BAR_COLORS.length]} h-3 rounded-full transition-all duration-500`}
                      style={{ width: `${(item.count / maxEventType) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {eventsByType.length === 0 && <p className="text-gray-500 text-sm">No event data yet</p>}
            </CardContent>
          </Card>

          <Card className="bg-white/5 border border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-400" /> Top Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {topEvents.map((item, i) => (
                  <div key={item.event_name} className="flex items-center justify-between p-2 rounded-lg bg-gray-800/50 border border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 text-xs font-mono w-6 text-right">#{i + 1}</span>
                      <span className="text-gray-200 text-sm">{item.event_name}</span>
                    </div>
                    <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">{item.count}</Badge>
                  </div>
                ))}
                {topEvents.length === 0 && <p className="text-gray-500 text-sm">No feature data yet</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/5 border border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-400" /> Daily Activity (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-48 overflow-x-auto pb-2">
              {dailyCounts.map((day) => (
                <div key={day.date} className="flex flex-col items-center gap-1 min-w-[20px] flex-1 group">
                  <span className="text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {day.count}
                  </span>
                  <div
                    className="w-full bg-gradient-to-t from-purple-500 to-cyan-400 rounded-t transition-all duration-300 hover:from-purple-400 hover:to-cyan-300 min-h-[2px]"
                    style={{ height: `${Math.max((day.count / maxDaily) * 100, 2)}%` }}
                  />
                  <span className="text-[8px] text-gray-600 rotate-[-45deg] origin-top-left whitespace-nowrap">
                    {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
              {dailyCounts.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-gray-500 text-sm">No activity data yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-pink-400" /> Recent Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-gray-400 py-2 px-3 font-medium">Type</th>
                    <th className="text-left text-gray-400 py-2 px-3 font-medium">Name</th>
                    <th className="text-left text-gray-400 py-2 px-3 font-medium">User</th>
                    <th className="text-left text-gray-400 py-2 px-3 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map((event, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-2 px-3">
                        <Badge variant="outline" className="text-cyan-300 border-cyan-500/30 text-xs">{event.event_type}</Badge>
                      </td>
                      <td className="py-2 px-3 text-gray-300">{event.event_name}</td>
                      <td className="py-2 px-3 text-gray-400">{event.user_id || "Anonymous"}</td>
                      <td className="py-2 px-3 text-gray-500 text-xs">
                        {new Date(event.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {recentEvents.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500">No recent events</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
