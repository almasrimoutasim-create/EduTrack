import { useState } from "react";
import { entities } from "@/api/dbClient";
import { fileClient } from "@/api/fileClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Upload, AlertCircle, CheckCircle } from "lucide-react";

export default function BulkImportDialog({ open, onOpenChange }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
      if (!validTypes.some(type => selectedFile.type.includes(type)) && !selectedFile.name.endsWith('.csv')) {
        setError("Please upload a CSV or Excel file");
        return;
      }
      setFile(selectedFile);
      setError("");
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError("");

    try {
      // Upload the file
      const { file_url } = await fileClient.uploadFile({ file });

      // Define the expected schema for student records
      const schema = {
        type: "object",
        properties: {
          full_name: { type: "string" },
          student_id: { type: "string" },
          grade: { type: "string" },
          section: { type: "string" },
          gender: { type: "string" },
          parent_name: { type: "string" },
          parent_email: { type: "string" },
          parent_phone: { type: "string" },
          date_of_birth: { type: "string" },
          address: { type: "string" },
        },
      };

      // Extract data from file
      const { status, output } = await fileClient.extractDataFromUploadedFile({
        file_url,
        json_schema: schema,
      });

      if (status !== "success" && status !== "completed" || !output) {
        throw new Error("Failed to extract data from file");
      }

      // Normalize output to array
      const records = Array.isArray(output) ? output : [output];

      // Create students
      const created = [];
      const skipped = [];

      for (const record of records) {
        if (!record.full_name || !record.student_id || !record.grade) {
          skipped.push({ record, reason: "Missing required fields (full_name, student_id, grade)" });
          continue;
        }

        try {
          await entities.Student.create({
            full_name: record.full_name,
            student_id: record.student_id,
            grade: record.grade,
            section: record.section || "أبو بكر",
            gender: record.gender || "male",
            parent_name: record.parent_name || "",
            parent_email: record.parent_email || "",
            parent_phone: record.parent_phone || "",
            date_of_birth: record.date_of_birth || "",
            address: record.address || "",
            status: "active",
            card_balance: 0,
            bus_registered: false,
          });
          created.push(record.full_name);
        } catch (err) {
          skipped.push({ record, reason: err.message });
        }
      }

      setResult({ created: created.length, skipped: skipped.length, records: created });
    } catch (err) {
      setError(err.message || "Import failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Import Students</DialogTitle>
          <DialogDescription>Upload a CSV or Excel file with student records</DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 mt-2">
            <Card className="p-6 border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary transition-colors" onClick={() => document.getElementById("file-input").click()}>
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm">{file?.name || "Click to select file"}</p>
                  <p className="text-xs text-muted-foreground mt-1">CSV or Excel (.xlsx, .xls)</p>
                </div>
              </div>
              <Input
                id="file-input"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </Card>

            {error && (
              <div className="flex gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-sm">
              <p className="font-semibold mb-2 text-blue-900 dark:text-blue-100">Required columns:</p>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>• full_name</li>
                <li>• student_id</li>
                <li>• grade</li>
              </ul>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">Optional: section, gender, parent_name, parent_email, parent_phone, date_of_birth, address</p>
            </div>

            <button onClick={handleImport} disabled={!file || loading} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed w-full h-11">
              {loading ? "Importing..." : "Import Students"}
            </button>
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-900 dark:text-emerald-100">{result.created} students imported</p>
                {result.skipped > 0 && <p className="text-xs text-emerald-700 dark:text-emerald-300">{result.skipped} records skipped</p>}
              </div>
            </div>

            <button onClick={handleClose} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed w-full h-11">
              Done
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}