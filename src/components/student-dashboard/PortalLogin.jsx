import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function PortalLogin({ onLogin }) {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!studentId || !password) return;
    setLoading(true);
    setError("");

    const results = await base44.entities.Student.filter({ student_id: studentId.trim() });
    const student = results[0];

    if (!student) {
      setError("Student ID not found.");
      setLoading(false);
      return;
    }

    if (!student.portal_password) {
      setError("No portal password has been set. Please contact your administrator.");
      setLoading(false);
      return;
    }

    if (student.portal_password !== password) {
      setError("Incorrect password.");
      setLoading(false);
      return;
    }

    if (student.status === "suspended") {
      setError("Your account is suspended. Please contact the school.");
      setLoading(false);
      return;
    }

    setLoading(false);
    onLogin(student);
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <Card className="p-8 max-w-sm w-full border shadow-sm">
        <div className="text-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <GraduationCap className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold">Student Portal</h1>
          <p className="text-sm text-muted-foreground mt-1">Log in with your student ID and password</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="sid">Student ID</Label>
            <Input
              id="sid"
              placeholder="e.g. STU-001"
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="pw">Password</Label>
            <div className="relative mt-1">
              <Input
                id="pw"
                type={showPw ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPw(v => !v)}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed w-full h-11 px-4" disabled={loading || !studentId || !password}>
            {loading ? "Checking..." : "Log In"}
          </button>
        </form>

        <p className="text-xs text-center text-muted-foreground mt-4">
          Forgot your password? Contact your school administrator.
        </p>
      </Card>
    </div>
  );
}