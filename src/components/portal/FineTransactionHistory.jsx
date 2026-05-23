import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3 } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

const translateText = (text, isRTL) => {
  if (!text || !isRTL) return text;
  
  const textStr = String(text).trim();
  
  const map = {
    "sports": "أنشطة رياضية",
    "Sports": "أنشطة رياضية",
    "discipline": "انضباط سلوكي",
    "Discipline": "انضباط سلوكي",
    "library": "المكتبة المدرسية",
    "Library": "المكتبة المدرسية",
    "general": "رسوم عامة",
    "General": "رسوم عامة",
    "Lost sports equipment (Basketball)": "فقدان معدات رياضية (كرة السلة)",
    "Mock Fine: Lost sports equipment (Basketball)": "فقدان معدات رياضية (كرة السلة)",
    "Damaged science lab equipment": "تلف وتخريب أدوات مختبر العلوم",
    "Mock Fine: Damaged science lab equipment": "تلف وتخريب أدوات مختبر العلوم",
    "Late library return for book \"Introduction to Algorithms\"": "تأخير إرجاع كتاب \"مقدمة في الخوارزميات\" للمكتبة",
    "Mock Fine: Late library return for book \"Introduction to Algorithms\"": "تأخير إرجاع كتاب \"مقدمة في الخوارزميات\" للمكتبة",
    "Mock Fine: Late library return for book \"Introduction to Algorithms": "تأخير إرجاع كتاب \"مقدمة في الخوارزميات\" للمكتبة",
    "Damaged beaker during chemistry class": "كسر وتلف أنبوب اختبار زجاجي أثناء حصة الكيمياء العملي.",
    "Book was overdue by 5 days": "تأخر في إرجاع الكتاب المستعار عن الموعد المحدد بـ 5 أيام.",
    "Paid on 2026-05-12": "تم السداد بنجاح بتاريخ: 2026-05-12"
  };

  if (map[textStr]) return map[textStr];

  if (textStr.includes("Lost sports equipment (Basketball)")) {
    return "فقدان معدات رياضية (كرة السلة)";
  }
  if (textStr.includes("Damaged science lab equipment")) {
    return "تلف وتخريب أدوات مختبر العلوم";
  }
  if (textStr.includes("Late library return") || textStr.includes("Introduction to Algorithms")) {
    return "تأخير إرجاع كتاب \"مقدمة في الخوارزميات\" للمكتبة";
  }
  if (textStr.includes("Damaged beaker")) {
    return "كسر وتلف أنبوب اختبار زجاجي أثناء حصة الكيمياء العملي.";
  }
  if (textStr.includes("Book was overdue")) {
    return "تأخر في إرجاع الكتاب المستعار عن الموعد المحدد بـ 5 أيام.";
  }
  if (textStr.includes("Paid on")) {
    return textStr.replace("Paid on", "تم السداد بتاريخ:");
  }

  return text;
};

export default function FineTransactionHistory({ student, privacyMode }) {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const { data: fines = [] } = useQuery({
    queryKey: ["parent-fine-history", student?.id],
    enabled: !!student?.id,
    queryFn: () => base44.entities.Fine.filter({ student_id: student.id }, "-created_date"),
  });

  const paidFines = fines.filter(f => f.status === "paid");
  const totalPaid = paidFines.reduce((s, f) => s + (parseFloat(f.amount) || 0), 0);

  if (!student?.id || paidFines.length === 0) {
    return (
      <Card className="p-8 text-center">
        <BarChart3 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="font-semibold text-sm">{isRTL ? "لا يوجد سجل للمدفوعات" : "No payment history"}</p>
        <p className="text-xs text-muted-foreground">{isRTL ? "لم يتم سداد أي فواتير أو رسوم حتى الآن." : "No invoices or fees have been paid yet."}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{isRTL ? "المدفوعات المسددة" : "Payments Cleared"}</p>
          <p className="text-2xl font-bold text-emerald-600">{paidFines.length}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">{isRTL ? "إجمالي المسدد" : "Total Paid"}</p>
          <p className="text-2xl font-bold text-emerald-600">{privacyMode ? "••••" : `$${totalPaid.toFixed(2)}`}</p>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isRTL ? "بيان الدفع / التفاصيل" : "Payment details / Reason"}</TableHead>
              <TableHead>{isRTL ? "الفئة" : "Category"}</TableHead>
              <TableHead>{isRTL ? "القيمة" : "Amount"}</TableHead>
              <TableHead>{isRTL ? "تاريخ السداد" : "Paid Date"}</TableHead>
              <TableHead>{isRTL ? "بواسطة" : "Issued By"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paidFines.map(fine => (
              <TableRow key={fine.id}>
                <TableCell className="font-medium">{translateText(fine.reason, isRTL)}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize text-xs">
                    {translateText(fine.category || "general", isRTL)}
                  </Badge>
                </TableCell>
                <TableCell className="font-bold text-emerald-600">${parseFloat(fine.amount || 0).toFixed(2)}</TableCell>
                <TableCell className="text-sm">{fine.date}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{fine.issued_by || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}