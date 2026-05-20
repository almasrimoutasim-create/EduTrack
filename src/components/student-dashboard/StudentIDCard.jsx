import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Copy, Check } from "lucide-react";
import { useState } from "react";
import { displayStudentId } from "@/utils/studentIdFormatter";

/**
 * Student ID Display Card Component
 * Displays the formatted student ID with copy functionality
 */
export default function StudentIDCard({ studentId, studentName, size = "md" }) {
  const [copied, setCopied] = useState(false);
  
  const formattedId = displayStudentId(studentId);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(formattedId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6"
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-6 w-6"
  };

  return (
    <Card className={`${sizeClasses[size]} border shadow-sm bg-gradient-to-br from-primary/5 to-primary/10`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Zap className={`${iconSizes[size]} text-primary`} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Student ID
            </p>
            <p className={`${textSizes[size]} font-mono font-bold text-primary`}>
              {formattedId}
            </p>
            {studentName && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {studentName}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="ml-2 p-2 rounded-lg hover:bg-primary/10 transition-colors"
          title="Copy student ID"
        >
          {copied ? (
            <Check className={`${iconSizes[size]} text-emerald-600`} />
          ) : (
            <Copy className={`${iconSizes[size]} text-muted-foreground hover:text-primary`} />
          )}
        </button>
      </div>
    </Card>
  );
}
