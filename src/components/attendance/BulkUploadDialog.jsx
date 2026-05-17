import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, CheckCircle2, XCircle, Loader2, FileSpreadsheet } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

const TEMPLATE_HEADERS = ["student_id", "student_name", "date", "type", "status", "time", "subject_name", "notes", "recorded_by"];
const VALID_TYPES = ["gate_in", "gate_out", "bus_in", "bus_out", "class"];
const VALID_STATUSES = ["present", "absent", "late", "excused"];

function downloadTemplate() {
  const rows = [
    TEMPLATE_HEADERS.join(","),
    `STU001,John Doe,${format(new Date(), "yyyy-MM-dd")},gate_in,present,08:00,,,"Teacher Name"`,
    `STU002,Jane Smith,${format(new Date(), "yyyy-MM-dd")},class,absent,09:30,Math,,"Teacher Name"`,
  ];
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "attendance_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text) {
  const lines = text.trim().split("\n").filter(l => l.trim());
  if (lines.length < 2) return { records: [], errors: ["File has no data rows"] };

  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, "").toLowerCase());
  const records = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const row = {};
    headers.forEach((h, idx) => { row[h] = vals[idx] || ""; });

    if (!row.student_name) { errors.push(`Row ${i + 1}: student_name is required`); continue; }
    if (!row.date) { errors.push(`Row ${i + 1}: date is required`); continue; }
    if (!VALID_TYPES.includes(row.type)) { errors.push(`Row ${i + 1}: type must be one of ${VALID_TYPES.join(", ")}`); continue; }
    if (row.status && !VALID_STATUSES.includes(row.status)) { errors.push(`Row ${i + 1}: status must be one of ${VALID_STATUSES.join(", ")}`); continue; }

    records.push({
      student_id: row.student_id || "",
      student_name: row.student_name,
      student_card_id: row.student_id || "",
      date: row.date,
      type: row.type,
      status: row.status || "present",
      time: row.time || "",
      subject_name: row.subject_name || "",
      notes: row.notes || "",
      recorded_by: row.recorded_by || "",
    });
  }
  return { records, errors };
}

export default function BulkUploadDialog({ open, onClose }) {
  const [stage, setStage] = useState("idle"); // idle | preview | uploading | done
  const [parsed, setParsed] = useState(null);
  const [parseErrors, setParseErrors] = useState([]);
  const [uploadResults, setUploadResults] = useState(null);
  const qc = useQueryClient();

  const reset = () => { setStage("idle"); setParsed(null); setParseErrors([]); setUploadResults(null); };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { records, errors } = parseCSV(ev.target.result);
      setParsed(records);
      setParseErrors(errors);
      setStage("preview");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleUpload = async () => {
    setStage("uploading");
    let success = 0, failed = 0;
    for (const rec of parsed) {
      try {
        await base44.entities.Attendance.create(rec);
        success++;
      } catch {
        failed++;
      }
    }
    qc.invalidateQueries({ queryKey: ["attendance"] });
    qc.invalidateQueries({ queryKey: ["attendance-recent"] });
    setUploadResults({ success, failed });
    setStage("done");
  };

  return (
    <Dialog open={open} onOpenChange={() => { reset(); onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Bulk Upload Attendance
          </DialogTitle>
        </DialogHeader>

        {stage === "idle" && (
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">Upload a CSV file with multiple attendance records at once. Download the template to get the correct format.</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={downloadTemplate} className="gap-2">
                <Download className="h-4 w-4" /> Download Template
              </Button>
              <label className="cursor-pointer">
                <Button asChild className="gap-2">
                  <span><Upload className="h-4 w-4" /> Choose CSV File</span>
                </Button>
                <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
              </label>
            </div>
            <div className="bg-muted/40 rounded-lg p-4 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">CSV columns:</p>
              <p><span className="font-medium">Required:</span> student_name, date (YYYY-MM-DD), type (gate_in/gate_out/bus_in/bus_out/class)</p>
              <p><span className="font-medium">Optional:</span> student_id, status (present/absent/late/excused), time (HH:MM), subject_name, notes, recorded_by</p>
            </div>
          </div>
        )}

        {stage === "preview" && parsed && (
          <div className="space-y-4 mt-2">
            <div className="flex items-center gap-3">
              <Badge variant="default">{parsed.length} valid records</Badge>
              {parseErrors.length > 0 && <Badge variant="destructive">{parseErrors.length} errors</Badge>}
            </div>
            {parseErrors.length > 0 && (
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 max-h-32 overflow-y-auto">
                {parseErrors.map((e, i) => <p key={i} className="text-xs text-destructive">{e}</p>)}
              </div>
            )}
            {parsed.length > 0 && (
              <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>{["Name", "Date", "Type", "Status", "Time"].map(h => <th key={h} className="text-left px-3 py-2 font-medium">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {parsed.map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-1.5">{r.student_name}</td>
                        <td className="px-3 py-1.5">{r.date}</td>
                        <td className="px-3 py-1.5 capitalize">{r.type.replace("_", " ")}</td>
                        <td className="px-3 py-1.5 capitalize">{r.status}</td>
                        <td className="px-3 py-1.5">{r.time || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={reset}>Back</Button>
              <Button onClick={handleUpload} disabled={parsed.length === 0} className="gap-2">
                <Upload className="h-4 w-4" /> Upload {parsed.length} Records
              </Button>
            </div>
          </div>
        )}

        {stage === "uploading" && (
          <div className="py-12 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Uploading records...</p>
          </div>
        )}

        {stage === "done" && uploadResults && (
          <div className="py-8 text-center space-y-4">
            <div className="flex justify-center gap-6">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">{uploadResults.success} uploaded</span>
              </div>
              {uploadResults.failed > 0 && (
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-5 w-5" />
                  <span className="font-semibold">{uploadResults.failed} failed</span>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Attendance records have been saved successfully.</p>
            <Button onClick={() => { reset(); onClose(); }}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}