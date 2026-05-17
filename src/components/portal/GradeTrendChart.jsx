import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];
const TERM_ORDER = { "Term 1": 1, "Term 2": 2, "Term 3": 3, "Final": 4 };

export default function GradeTrendChart({ grades }) {
  const { chartData, subjects } = useMemo(() => {
    if (!grades.length) return { chartData: [], subjects: [] };

    const pct = (g) => Math.round((g.score / (g.max_score || 100)) * 100);
    const subjectSet = [...new Set(grades.map(g => g.subject_name))];
    const termSet = [...new Set(grades.map(g => g.term))].sort((a, b) => (TERM_ORDER[a] || 99) - (TERM_ORDER[b] || 99));

    const data = termSet.map(term => {
      const entry = { term };
      subjectSet.forEach(sub => {
        const g = grades.find(x => x.term === term && x.subject_name === sub);
        entry[sub] = g ? pct(g) : null;
      });
      return entry;
    });

    return { chartData: data, subjects: subjectSet };
  }, [grades]);

  if (chartData.length < 2 || subjects.length === 0) return null;

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <p className="font-semibold text-sm">Grade Trends</p>
            <p className="text-xs text-muted-foreground">Performance across subjects over time</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="term" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
            <Tooltip formatter={(v) => `${v}%`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {subjects.map((sub, i) => (
              <Line
                key={sub}
                type="monotone"
                dataKey={sub}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}