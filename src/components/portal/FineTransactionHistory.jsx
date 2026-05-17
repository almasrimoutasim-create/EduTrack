import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3 } from "lucide-react";

export default function FineTransactionHistory({ student, privacyMode }) {
  const { data: fines = [] } = useQuery({
    queryKey: ["parent-fine-history", student.id],
    queryFn: () => base44.entities.Fine.filter({ student_id: student.id }, "-created_date"),
  });

  const paidFines = fines.filter(f => f.status === "paid");
  const totalPaid = paidFines.reduce((s, f) => s + (f.amount || 0), 0);

  if (paidFines.length === 0) {
    return (
      <Card className="p-8 text-center">
        <BarChart3 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="font-semibold text-sm">No payment history</p>
        <p className="text-xs text-muted-foreground">No fines have been paid yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Fines Paid</p>
          <p className="text-2xl font-bold text-emerald-600">{paidFines.length}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
          <p className="text-2xl font-bold text-emerald-600">{privacyMode ? "••••" : `$${totalPaid.toFixed(2)}`}</p>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fine Reason</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Paid Date</TableHead>
              <TableHead>Issued By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paidFines.map(fine => (
              <TableRow key={fine.id}>
                <TableCell className="font-medium">{fine.reason}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize text-xs">
                    {fine.category || "general"}
                  </Badge>
                </TableCell>
                <TableCell className="font-bold text-emerald-600">${fine.amount?.toFixed(2)}</TableCell>
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