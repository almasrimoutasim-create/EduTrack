import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Download } from "lucide-react";
import GradeTrendChart from "@/components/portal/GradeTrendChart";

export default function PortalGrades({ student }) {
  const { data: grades = [], isLoading } = useQuery({
    queryKey: ["student-grades", student.student_id],
    queryFn: () => entities.StudentGrade.filter({ student_id: student.student_id }),
  });

  const pct = (g) => Math.round((g.score / (g.max_score || 100)) * 100);
  const pctColor = (p) => p >= 85 ? "text-emerald-600" : p >= 70 ? "text-blue-600" : p >= 50 ? "text-amber-600" : "text-red-500";
  const pctBg = (p) => p >= 85 ? "bg-emerald-500" : p >= 70 ? "bg-blue-500" : p >= 50 ? "bg-amber-500" : "bg-red-500";

  const terms = [...new Set(grades.map(g => g.term))];

  const downloadReport = () => {
    const rows = [["Subject","Term","Score","Max","Percentage","Grade","Teacher","Notes"]];
    grades.forEach(g => rows.push([g.subject_name, g.term, g.score, g.max_score || 100, pct(g)+"%", g.grade_label || "", g.teacher_name || "", g.notes || ""]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `${student.full_name}_grades.csv`;
    a.click();
  };

  if (isLoading) return <p className="text-center text-sm text-muted-foreground py-8">Loading grades...</p>;

  if (grades.length === 0) return (
    <Card className="p-10 text-center">
      <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-muted-foreground text-sm">No grades recorded yet.</p>
    </Card>
  );

  const avg = Math.round(grades.reduce((s, g) => s + pct(g), 0) / grades.length);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <p className={`text-2xl font-bold ${pctColor(avg)}`}>{avg}%</p>
          <p className="text-xs text-muted-foreground">Overall Avg</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-primary">{grades.length}</p>
          <p className="text-xs text-muted-foreground">Subjects</p>
        </Card>
        <Card className="p-3 text-center">
          <p className={`text-2xl font-bold ${pctColor(Math.round(grades.filter(g => pct(g) >= 70).length / grades.length * 100))}`}>
            {grades.filter(g => pct(g) >= 70).length}/{grades.length}
          </p>
          <p className="text-xs text-muted-foreground">Passing</p>
        </Card>
      </div>

      <GradeTrendChart grades={grades} />

      <div className="flex items-center justify-between">
        <h3 className="font-semibold">My Grades</h3>
        <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-8 px-3 gap-1.5" onClick={downloadReport}>
          <Download className="h-3.5 w-3.5" /> Download
        </button>
      </div>

      {terms.map(term => (
        <div key={term} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{term}</p>
          {grades.filter(g => g.term === term).map(g => (
            <Card key={g.id}>
              <CardContent className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{g.subject_name}</p>
                    {g.teacher_name && <p className="text-xs text-muted-foreground">{g.teacher_name}</p>}
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${pctColor(pct(g))}`}>{g.score}/{g.max_score || 100}</p>
                    <p className="text-xs font-semibold">{g.grade_label || `${pct(g)}%`}</p>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${pctBg(pct(g))}`} style={{ width: `${pct(g)}%` }} />
                </div>
                {g.notes && <p className="text-xs text-muted-foreground mt-2 italic">{g.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}