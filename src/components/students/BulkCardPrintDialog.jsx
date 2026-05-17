import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Printer } from "lucide-react";

const GRADES = ["1","2","3","4","5","6","7","8","9","10","11","12"];

export default function BulkCardPrintDialog({ open, onOpenChange, students }) {
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSection, setSelectedSection] = useState("all");
  const [printing, setPrinting] = useState(false);

  const filteredStudents = students.filter(s => {
    if (!selectedGrade) return false;
    const gradeMatch = s.grade === selectedGrade;
    const sectionMatch = selectedSection === "all" || s.section === selectedSection;
    return gradeMatch && sectionMatch;
  });

  const sections = selectedGrade
    ? [...new Set(students.filter(s => s.grade === selectedGrade).map(s => s.section).filter(Boolean))]
    : [];

  const handlePrint = async () => {
    if (filteredStudents.length === 0) return;
    
    setPrinting(true);
    
    // Create printable HTML for all cards
    const printWindow = window.open("", "_blank");
    const cardHtml = filteredStudents.map(student => `
      <div style="page-break-inside: avoid; break-inside: avoid; margin: 16px; display: inline-block; width: 380px;">
        <div style="width: 380px; height: 240px; border: 2px solid #333; border-radius: 12px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-family: Arial, sans-serif; position: relative;">
          <!-- Header -->
          <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 20px;">Student ID Card</div>
          
          <!-- Student Info -->
          <div style="margin-bottom: 16px;">
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 4px;">${student.full_name}</div>
            <div style="font-size: 12px; margin-bottom: 8px;">Grade ${student.grade}${student.section ? `-${student.section}` : ""}</div>
          </div>
          
          <!-- ID Number -->
          <div style="margin-bottom: 16px; padding: 8px; background: rgba(255,255,255,0.15); border-radius: 6px;">
            <div style="font-size: 10px; opacity: 0.9;">Student ID</div>
            <div style="font-size: 16px; font-weight: bold; font-family: 'Courier New', monospace; letter-spacing: 2px;">${student.student_id}</div>
          </div>
          
          <!-- Footer -->
          <div style="font-size: 10px; opacity: 0.8; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 12px;">
            <div>School ID: ${student.id}</div>
            <div style="margin-top: 4px;">Valid for current academic year</div>
          </div>
        </div>
      </div>
    `).join("");

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student ID Cards - Bulk Print</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
            font-family: Arial, sans-serif;
          }
          .print-container {
            display: flex;
            flex-wrap: wrap;
            gap: 0;
            justify-content: center;
          }
          @media print {
            body { background: white; padding: 0; }
            .print-container { display: flex; flex-wrap: wrap; }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          ${cardHtml}
        </div>
        <script>
          setTimeout(() => { window.print(); }, 500);
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(fullHtml);
    printWindow.document.close();
    
    setPrinting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Bulk Print ID Cards</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Grade *</Label>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a grade" />
              </SelectTrigger>
              <SelectContent>
                {GRADES.map(g => (
                  <SelectItem key={g} value={g}>Grade {g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedGrade && sections.length > 0 && (
            <div>
              <Label>Section</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedGrade && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-900 font-semibold">Ready to print</p>
                <p className="text-blue-700 text-xs mt-1">{filteredStudents.length} card{filteredStudents.length !== 1 ? 's' : ''} will be printed</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 mt-4">
          <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-11 px-4" onClick={() => onOpenChange(false)}>Cancel</button>
          <button 
            onClick={handlePrint} 
            disabled={printing || filteredStudents.length === 0}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed h-11 px-4"
          >
            <Printer className="h-4 w-4" />
            {printing ? "Preparing..." : `Print ${filteredStudents.length} Cards`}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}