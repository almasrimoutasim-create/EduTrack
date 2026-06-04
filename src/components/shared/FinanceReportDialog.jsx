import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Download, FileSpreadsheet, FileText, Calendar, Filter, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { format, subDays, startOfMonth, startOfYear } from "date-fns";

export default function FinanceReportDialog({ open, onClose, purchases = [], financialRecords = [], isRTL = false }) {
  const [preset, setPreset] = useState("last_30_days");
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  const [isExporting, setIsExporting] = useState(false);

  // Update dates when preset changes
  useEffect(() => {
    const today = new Date();
    if (preset === "today") {
      setStartDate(format(today, "yyyy-MM-dd"));
      setEndDate(format(today, "yyyy-MM-dd"));
    } else if (preset === "last_7_days") {
      setStartDate(format(subDays(today, 7), "yyyy-MM-dd"));
      setEndDate(format(today, "yyyy-MM-dd"));
    } else if (preset === "last_30_days") {
      setStartDate(format(subDays(today, 30), "yyyy-MM-dd"));
      setEndDate(format(today, "yyyy-MM-dd"));
    } else if (preset === "this_month") {
      setStartDate(format(startOfMonth(today), "yyyy-MM-dd"));
      setEndDate(format(today, "yyyy-MM-dd"));
    } else if (preset === "this_year") {
      setStartDate(format(startOfYear(today), "yyyy-MM-dd"));
      setEndDate(format(today, "yyyy-MM-dd"));
    }
  }, [preset]);

  const t = {
    title: isRTL ? "تصدير التقرير المالي" : "Export Financial Report",
    presetLabel: isRTL ? "الفترة الزمنية" : "Time Period",
    startDateLabel: isRTL ? "تاريخ البدء" : "Start Date",
    endDateLabel: isRTL ? "تاريخ الانتهاء" : "End Date",
    typeLabel: isRTL ? "نوع المعاملة" : "Transaction Type",
    statusLabel: isRTL ? "الحالة" : "Status",
    sortLabel: isRTL ? "الترتيب حسب" : "Sort By",
    formatLabel: isRTL ? "صيغة التصدير" : "Export Format",
    exportBtn: isRTL ? "توليد وتنزيل التقرير" : "Generate & Download",
    exporting: isRTL ? "جاري التصدير..." : "Exporting...",
    
    // Presets
    today: isRTL ? "اليوم" : "Today",
    last7: isRTL ? "آخر 7 أيام" : "Last 7 Days",
    last30: isRTL ? "آخر 30 يوم" : "Last 30 Days",
    thisMonth: isRTL ? "هذا الشهر" : "This Month",
    thisYear: isRTL ? "هذه السنة" : "This Year",
    custom: isRTL ? "فترة مخصصة" : "Custom Period",

    // Types
    all: isRTL ? "الكل" : "All",
    purchase: isRTL ? "مشتريات المتجر" : "Store Purchases",
    salary: isRTL ? "الرواتب والأجور" : "Salaries & Payments",
    tuition: isRTL ? "الرسوم الدراسية" : "Tuition & Fees",
    expense: isRTL ? "المصاريف العامة" : "General Expenses",

    // Statuses
    completed: isRTL ? "مكتمل / مدفوع" : "Completed / Paid",
    pending: isRTL ? "قيد الانتظار" : "Pending",
    cancelled: isRTL ? "ملغي" : "Cancelled",

    // Sorting
    dateDesc: isRTL ? "التاريخ: من الأحدث للأقدم" : "Date: Newest to Oldest",
    dateAsc: isRTL ? "التاريخ: من الأقدم للأحدث" : "Date: Oldest to Newest",
    amountDesc: isRTL ? "المبلغ: من الأعلى للأقل" : "Amount: Highest to Lowest",
    amountAsc: isRTL ? "المبلغ: من الأقل للأعلى" : "Amount: Lowest to Highest",
  };

  const getFilteredAndSortedData = () => {
    // Combine transactions
    const combined = [
      ...purchases.map(p => ({
        id: p.id,
        date: p.created_at || p.created_date || p.payment_date || p.date,
        party: p.student_name || p.recipient_name || "—",
        item: p.item_name || (isRTL ? "وجبة مدرسية / متجر" : "School Meal / Store"),
        amount: parseFloat(p.total_price || p.total_amount || 0),
        status: p.status || "paid",
        _type: "purchase",
        record_type: "purchase"
      })),
      ...financialRecords.map(r => ({
        id: r.id,
        date: r.created_at || r.created_date || r.payment_date || r.date,
        party: r.recipient_name || "—",
        item: r.description || r.record_type || (isRTL ? "معاملة مالية" : "Financial Transaction"),
        amount: parseFloat(r.amount || 0),
        status: r.status || "pending",
        _type: "record",
        record_type: r.record_type
      }))
    ];

    // Filter by Date Range
    const start = new Date(startDate);
    const end = new Date(endDate);
    // Set hours to cover the whole day
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    let filtered = combined.filter(t => {
      if (!t.date) return false;
      const tDate = new Date(t.date);
      return tDate >= start && tDate <= end;
    });

    // Filter by Type
    if (typeFilter !== "all") {
      filtered = filtered.filter(t => {
        if (typeFilter === "purchase") return t._type === "purchase";
        if (typeFilter === "salary") return t._type === "record" && t.record_type === "salary";
        if (typeFilter === "tuition") return t._type === "record" && (t.record_type === "income" || t.record_type === "fine_payment" || t.record_type === "tuition");
        if (typeFilter === "expense") return t._type === "record" && (t.record_type === "expense" || t.record_type === "bus_driver_payment" || t.record_type === "supervisor_payment" || t.record_type === "refund");
        return true;
      });
    }

    // Filter by Status
    if (statusFilter !== "all") {
      filtered = filtered.filter(t => {
        const s = t.status.toLowerCase();
        if (statusFilter === "completed") return s === "paid" || s === "completed";
        if (statusFilter === "pending") return s === "pending";
        if (statusFilter === "cancelled") return s === "cancelled";
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "date_desc") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === "date_asc") {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === "amount_desc") {
        return b.amount - a.amount;
      } else if (sortBy === "amount_asc") {
        return a.amount - b.amount;
      }
      return 0;
    });

    return filtered;
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const data = getFilteredAndSortedData();
      if (data.length === 0) {
        toast.error(isRTL ? "لا توجد بيانات لتصديرها ضمن المحددات المختارة" : "No data found for the selected filters");
        setIsExporting(false);
        return;
      }

      // Calculate totals
      const totalRevenue = data
        .filter(t => (t.record_type === "income" || t.record_type === "fine_payment" || t.record_type === "tuition" || t._type === "purchase") && t.status !== "cancelled")
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpenses = data
        .filter(t => (t.record_type === "expense" || t.record_type === "salary" || t.record_type === "bus_driver_payment" || t.record_type === "supervisor_payment" || t.record_type === "refund") && t.status !== "cancelled")
        .reduce((sum, t) => sum + t.amount, 0);

      const netProfit = totalRevenue - totalExpenses;

      // Construct XML for Excel (XML Spreadsheet 2003)
      let xml = `<?xml version="1.0" encoding="utf-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>School Management System</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Color="#1c1917"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="Title">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="16" ss:Bold="1" ss:Color="#7c3aed"/>
  </Style>
  <Style ss:ID="SubTitle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#78716c" ss:Italic="1"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#ffffff"/>
   <Interior ss:Color="#7c3aed" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#5b21b6"/>
   </Borders>
  </Style>
  <Style ss:ID="Cell">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e7e5e4"/>
   </Borders>
  </Style>
  <Style ss:ID="CellAmount">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Bold="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e7e5e4"/>
   </Borders>
   <NumberFormat ss:Format="$#,##0.00"/>
  </Style>
  <Style ss:ID="StatusPaid">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Color="#065f46" ss:Bold="1"/>
   <Interior ss:Color="#d1fae5" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e7e5e4"/>
   </Borders>
  </Style>
  <Style ss:ID="StatusPending">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Color="#92400e" ss:Bold="1"/>
   <Interior ss:Color="#fef3c7" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e7e5e4"/>
   </Borders>
  </Style>
  <Style ss:ID="StatusCancelled">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Color="#991b1b" ss:Bold="1"/>
   <Interior ss:Color="#fee2e2" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e7e5e4"/>
   </Borders>
  </Style>
  <Style ss:ID="SummaryLabel">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#78716c"/>
   <Interior ss:Color="#fafaf9" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="SummaryValue">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#1c1917"/>
   <Interior ss:Color="#fafaf9" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="$#,##0.00"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Financial Report">
  <Table ss:ExpandedColumnCount="5" ss:ExpandedRowCount="${data.length + 9}" x:FullColumns="1" x:FullRows="1">
   <Column ss:Width="100"/>
   <Column ss:Width="150"/>
   <Column ss:Width="180"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   
   <!-- Title Row -->
   <Row ss:Height="30">
    <Cell ss:MergeAcross="4" ss:StyleID="Title">
     <Data ss:Type="String">${isRTL ? "التقرير المالي التفصيلي" : "Detailed Financial Report"}</Data>
    </Cell>
   </Row>
   
   <!-- Subtitle Row -->
   <Row ss:Height="20">
    <Cell ss:MergeAcross="4" ss:StyleID="SubTitle">
     <Data ss:Type="String">${isRTL ? `الفترة من ${startDate} إلى ${endDate}` : `Period from ${startDate} to ${endDate}`}</Data>
    </Cell>
   </Row>
   
   <!-- Empty spacer row -->
   <Row ss:Height="15"></Row>
   
   <!-- Summary Statistics Rows -->
   <Row ss:Height="20">
    <Cell ss:MergeAcross="1" ss:StyleID="SummaryLabel"><Data ss:Type="String">${isRTL ? "إجمالي الإيرادات:" : "Total Revenue:"}</Data></Cell>
    <Cell ss:StyleID="SummaryValue"><Data ss:Type="Number">${totalRevenue}</Data></Cell>
    <Cell ss:MergeAcross="1"></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="1" ss:StyleID="SummaryLabel"><Data ss:Type="String">${isRTL ? "إجمالي المصروفات:" : "Total Expenses:"}</Data></Cell>
    <Cell ss:StyleID="SummaryValue"><Data ss:Type="Number">${totalExpenses}</Data></Cell>
    <Cell ss:MergeAcross="1"></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="1" ss:StyleID="SummaryLabel"><Data ss:Type="String">${isRTL ? "صافي الربح:" : "Net Profit:"}</Data></Cell>
    <Cell ss:StyleID="SummaryValue"><Data ss:Type="Number">${netProfit}</Data></Cell>
    <Cell ss:MergeAcross="1"></Cell>
   </Row>
   
   <!-- Spacer -->
   <Row ss:Height="15"></Row>
   
   <!-- Headers Row -->
   <Row ss:Height="24">
    <Cell ss:StyleID="Header"><Data ss:Type="String">${isRTL ? "التاريخ" : "Date"}</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">${isRTL ? "الطرف / المستفيد" : "Party / Recipient"}</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">${isRTL ? "البيان / البند" : "Item"}</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">${isRTL ? "المبلغ" : "Amount"}</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">${isRTL ? "الحالة" : "Status"}</Data></Cell>
   </Row>
`;

      // Add Data Rows
      data.forEach(t => {
        const formattedDate = t.date ? format(new Date(t.date), "yyyy-MM-dd") : "";
        const isStatusPaid = t.status === "paid" || t.status === "completed";
        const isStatusPending = t.status === "pending";
        let statusStyle = "StatusCancelled";
        if (isStatusPaid) statusStyle = "StatusPaid";
        else if (isStatusPending) statusStyle = "StatusPending";

        const statusText = isStatusPaid 
          ? (isRTL ? "مكتمل" : "Completed") 
          : isStatusPending 
            ? (isRTL ? "معلق" : "Pending") 
            : (isRTL ? "ملغي" : "Cancelled");

        xml += `
   <Row ss:Height="22">
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${formattedDate}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${t.party}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${t.item}</Data></Cell>
    <Cell ss:StyleID="CellAmount"><Data ss:Type="Number">${t.amount}</Data></Cell>
    <Cell ss:StyleID="${statusStyle}"><Data ss:Type="String">${statusText}</Data></Cell>
   </Row>`;
      });

      xml += `
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <PageSetup>
    <Header x:Margin="0.3"/>
    <Footer x:Margin="0.3"/>
    <PageMargins x:Bottom="0.75" x:Left="0.7" x:Right="0.7" x:Top="0.75"/>
   </PageSetup>
   <Unsynced/>
   <Print>
    <ValidPrinterInfo/>
    <PaperSizeIndex>9</PaperSizeIndex>
    <HorizontalResolution>600</HorizontalResolution>
    <VerticalResolution>600</VerticalResolution>
   </Print>
   <Selected/>
   ${isRTL ? '<DisplayRightToLeft/>' : ''}
   <ProtectObjects>False</ProtectObjects>
   <ProtectScenarios>False</ProtectScenarios>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;

      const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Financial_Report_${startDate}_to_${endDate}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(isRTL ? "تم تصدير التقرير بنجاح كملف Excel منسق!" : "Report exported successfully as formatted Excel!");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(isRTL ? "حدث خطأ أثناء تصدير التقرير" : "An error occurred while exporting");
    }
    setIsExporting(false);
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    // Simulate premium PDF generation and then open print window for report dashboard
    setTimeout(() => {
      const data = getFilteredAndSortedData();
      if (data.length === 0) {
        toast.error(isRTL ? "لا توجد بيانات لتصديرها ضمن المحددات المختارة" : "No data found for the selected filters");
        setIsExporting(false);
        return;
      }

      // Create a print-friendly window/view
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error(isRTL ? "الرجاء السماح بالنوافذ المنبثقة للتصدير" : "Please allow popups for exporting");
        setIsExporting(false);
        return;
      }

      const totalRevenue = data
        .filter(t => (t.record_type === "income" || t.record_type === "fine_payment" || t.record_type === "tuition" || t._type === "purchase") && t.status !== "cancelled")
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpenses = data
        .filter(t => (t.record_type === "expense" || t.record_type === "salary" || t.record_type === "bus_driver_payment" || t.record_type === "supervisor_payment" || t.record_type === "refund") && t.status !== "cancelled")
        .reduce((sum, t) => sum + t.amount, 0);

      const netProfit = totalRevenue - totalExpenses;

      const htmlContent = `
        <html dir="${isRTL ? "rtl" : "ltr"}">
        <head>
          <title>${t.title}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1c1917; }
            .header { display: flex; justify-content: space-between; align-items: center; border-b: 2px solid #e7e5e4; padding-bottom: 20px; margin-bottom: 30px; }
            .logo-title h1 { margin: 0; font-size: 24px; font-weight: 800; }
            .logo-title p { margin: 5px 0 0 0; font-size: 14px; color: #78716c; }
            .meta-info { text-align: ${isRTL ? "left" : "right"}; font-size: 12px; color: #78716c; line-height: 1.6; }
            .stats-grid { display: grid; grid-cols: 3; display: flex; gap: 20px; margin-bottom: 30px; }
            .stat-card { flex: 1; padding: 15px; border: 1px solid #e7e5e4; rounded-xl: 10px; border-radius: 12px; background-color: #fafaf9; }
            .stat-card h3 { margin: 0 0 5px 0; font-size: 11px; text-transform: uppercase; color: #78716c; }
            .stat-card p { margin: 0; font-size: 20px; font-weight: 700; color: #1c1917; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f5f5f4; color: #78716c; text-align: ${isRTL ? "right" : "left"}; padding: 12px 15px; font-size: 12px; font-weight: 700; border-bottom: 2px solid #e7e5e4; }
            td { padding: 12px 15px; font-size: 13px; border-bottom: 1px solid #f5f5f4; }
            tr:hover { background-color: #fafaf9; }
            .badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; }
            .badge-paid { bg: #ecfdf5; background-color: #d1fae5; color: #065f46; }
            .badge-pending { background-color: #fef3c7; color: #92400e; }
            .badge-cancelled { background-color: #fee2e2; color: #991b1b; }
            @media print {
              body { padding: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-title">
              <h1>${isRTL ? "التقرير المالي التفصيلي" : "Detailed Financial Report"}</h1>
              <p>${isRTL ? `الفترة من ${startDate} إلى ${endDate}` : `Period from ${startDate} to ${endDate}`}</p>
            </div>
            <div class="meta-info">
              <div>${isRTL ? "تاريخ الاستخراج:" : "Exported on:"} ${format(new Date(), "yyyy-MM-dd HH:mm")}</div>
              <div>${isRTL ? "نظام إدارة المدرسة" : "School Management System"}</div>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <h3>${isRTL ? "إجمالي الإيرادات" : "Total Revenue"}</h3>
              <p>$${totalRevenue.toLocaleString()}</p>
            </div>
            <div class="stat-card">
              <h3>${isRTL ? "إجمالي المصروفات" : "Total Expenses"}</h3>
              <p>$${totalExpenses.toLocaleString()}</p>
            </div>
            <div class="stat-card">
              <h3>${isRTL ? "صافي الربح" : "Net Profit"}</h3>
              <p style="color: ${netProfit >= 0 ? '#059669' : '#e11d48'}">$${netProfit.toLocaleString()}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>${isRTL ? "التاريخ" : "Date"}</th>
                <th>${isRTL ? "الطرف / المستفيد" : "Party / Recipient"}</th>
                <th>${isRTL ? "البيان / البند" : "Item"}</th>
                <th>${isRTL ? "المبلغ" : "Amount"}</th>
                <th>${isRTL ? "الحالة" : "Status"}</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(t => `
                <tr>
                  <td>${t.date ? format(new Date(t.date), "yyyy-MM-dd") : "—"}</td>
                  <td><b>${t.party}</b></td>
                  <td>${t.item}</td>
                  <td><b>$${t.amount.toLocaleString()}</b></td>
                  <td>
                    <span class="badge ${
                      t.status === "paid" || t.status === "completed" 
                        ? "badge-paid" 
                        : t.status === "pending" 
                          ? "badge-pending" 
                          : "badge-cancelled"
                    }">
                      ${t.status === "paid" || t.status === "completed" 
                        ? (isRTL ? "مكتمل" : "Completed") 
                        : t.status === "pending" 
                          ? (isRTL ? "معلق" : "Pending") 
                          : (isRTL ? "ملغي" : "Cancelled")}
                    </span>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setIsExporting(false);
      toast.success(isRTL ? "تم توليد تقرير PDF بنجاح!" : "PDF Report generated successfully!");
      onClose();
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl p-6" dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader className="border-b border-stone-100 pb-3 flex flex-row items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Download size={20} />
          </div>
          <div className="text-right">
            <DialogTitle className="font-display text-xl font-bold text-stone-900">
              {t.title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4 text-right">
          {/* Preset Selector */}
          <div className="space-y-1.5">
            <Label className="text-stone-600 font-bold text-xs flex gap-1.5 items-center justify-start">
              <Calendar size={14} className="text-stone-400" />
              <span>{t.presetLabel}</span>
            </Label>
            <Select value={preset} onValueChange={setPreset}>
              <SelectTrigger className="h-11 rounded-xl border-stone-200 bg-white font-semibold transition-all">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="today" className="font-semibold">{t.today}</SelectItem>
                <SelectItem value="last_7_days" className="font-semibold">{t.last7}</SelectItem>
                <SelectItem value="last_30_days" className="font-semibold">{t.last30}</SelectItem>
                <SelectItem value="this_month" className="font-semibold">{t.thisMonth}</SelectItem>
                <SelectItem value="this_year" className="font-semibold">{t.thisYear}</SelectItem>
                <SelectItem value="custom" className="font-semibold">{t.custom}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Pickers */}
          {preset === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-stone-600 font-bold text-xs">{t.startDateLabel}</Label>
                <input 
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl h-11 px-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all text-right"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-stone-600 font-bold text-xs">{t.endDateLabel}</Label>
                <input 
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl h-11 px-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all text-right"
                />
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-stone-600 font-bold text-xs flex gap-1.5 items-center justify-start">
                <Filter size={14} className="text-stone-400" />
                <span>{t.typeLabel}</span>
              </Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-11 rounded-xl border-stone-200 bg-white font-semibold transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="font-semibold">{t.all}</SelectItem>
                  <SelectItem value="purchase" className="font-semibold">{t.purchase}</SelectItem>
                  <SelectItem value="salary" className="font-semibold">{t.salary}</SelectItem>
                  <SelectItem value="tuition" className="font-semibold">{t.tuition}</SelectItem>
                  <SelectItem value="expense" className="font-semibold">{t.expense}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-stone-600 font-bold text-xs flex gap-1.5 items-center justify-start">
                <Filter size={14} className="text-stone-400" />
                <span>{t.statusLabel}</span>
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 rounded-xl border-stone-200 bg-white font-semibold transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="font-semibold">{t.all}</SelectItem>
                  <SelectItem value="completed" className="font-semibold">{t.completed}</SelectItem>
                  <SelectItem value="pending" className="font-semibold">{t.pending}</SelectItem>
                  <SelectItem value="cancelled" className="font-semibold">{t.cancelled}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sorting */}
          <div className="space-y-1.5">
            <Label className="text-stone-600 font-bold text-xs flex gap-1.5 items-center justify-start">
              <ArrowUpDown size={14} className="text-stone-400" />
              <span>{t.sortLabel}</span>
            </Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-11 rounded-xl border-stone-200 bg-white font-semibold transition-all">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="date_desc" className="font-semibold">{t.dateDesc}</SelectItem>
                <SelectItem value="date_asc" className="font-semibold">{t.dateAsc}</SelectItem>
                <SelectItem value="amount_desc" className="font-semibold">{t.amountDesc}</SelectItem>
                <SelectItem value="amount_asc" className="font-semibold">{t.amountAsc}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export Action Buttons */}
          <div className="pt-4 grid grid-cols-2 gap-3">
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer h-12 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet size={18} className="text-emerald-600" />
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer h-12 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText size={18} className="text-rose-600" />
              <span>PDF / طباعة</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
