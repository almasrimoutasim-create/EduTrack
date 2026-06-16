# PLATFORM_STRUCTURE.md — EduTrack (نظام إدارة المدرسة)

> **تعليمات للـ Agent:** اقرأ هذا الملف بالكامل قبل تنفيذ أي مهمة. هذا الملف هو المرجع الوحيد لفهم بنية المشروع وقواعده.

---

## 1. نظرة عامة

**اسم المشروع:** EduTrack  
**النوع:** منصة شاملة لإدارة المدارس (School Management Platform)  
**المسار الجذري:** `C:\MFA`  
**البيئة:** React 18 + Vite 6 (Frontend) / Express.js (Backend) / Neon PostgreSQL (Database)  
**النشر:** Render

---

## 2. المكدس التقني الكامل (Tech Stack)

| الطبقة | التقنية |
|---|---|
| Frontend | React 18 + Vite 6 |
| Backend | Express.js |
| Database | Neon PostgreSQL |
| State / Data Fetching | TanStack React Query v5 |
| Routing | React Router v6 |
| Styling | Tailwind CSS 3 |
| UI Components | Radix UI + shadcn/ui |
| Icons | Lucide React |
| Animation | Framer Motion |
| Forms | React Hook Form + Zod |
| Payments | Stripe |
| PDF / Print | jsPDF + html2canvas |
| 3D | Three.js |
| Charts | Recharts |
| Maps | React Leaflet |
| QR Code | qrcode.react + jsqr |

---

## 3. بوابات المنصة (Portals)

```
EduTrack
├── مدير النظام          (System Admin)
├── بوابة المعلم         (Teacher Portal)
├── بوابة الطالب         (Student Portal)
├── بوابة ولي الأمر      (Parent Portal)
└── بوابة الموظف         (Staff Portal)
    ├── المسجل            (Registrar)
    ├── مشرف حافلة        (Bus Supervisor)
    ├── أمين مستودع       (Warehouse)
    ├── حارس أمن          (Security Guard)
    ├── الموارد البشرية   (HR)
    ├── المحاسب           (Accountant)
    ├── المرشد الطلابي    (Student Counselor)
    └── الدعم الفني       (Technical Support)
```

---

## 4. نظام المصادقة (Auth)

```javascript
// الهوك الوحيد المستخدم للمصادقة
const { user } = useAuth();
// user يحتوي على: { id, full_name, role }

// ❌ ممنوع منعاً باتاً
created_by: 1  // لا تُهارد-كود أي ID
// ✅ الصحيح
created_by: user.id
```

---

## 5. نمط جلب البيانات (Data Fetching Pattern)

```javascript
// ✅ الطريقة الصحيحة دائماً — useQuery فقط
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";

const { data, isLoading } = useQuery({
  queryKey: ["uniqueKeyHere"],
  queryFn: () => entities.EntityName.list("-created_at"),
});

// ❌ ممنوع منعاً باتاً
useEffect(() => {
  fetch("/api/something").then(...) // لا تستخدم useEffect مع fetch مباشرة
}, []);
```

---

## 6. Migration: base44 → entities (جارٍ)

### النمط العام
```javascript
// ❌ القديم
import { base44 } from "@/api/base44Client";
base44.entities.Student.list("-created_date");

// ✅ الجديد
import { entities } from "@/api/dbClient";
entities.Student.list("-created_at");
```

### التغييرات المطلوبة
| القديم | الجديد |
|---|---|
| `import { base44 } from "@/api/base44Client"` | `import { entities } from "@/api/dbClient"` |
| `base44.entities.X` | `entities.X` |
| `-created_date` | `-created_at` |

### ملفات انتهى منها Migration ✅
- `Library.jsx`
- `Grades.jsx`
- `StaffPayroll.jsx`
- `CounselingDashboard.jsx`
- `BusSupervisorPortal.jsx`
- `StaffPortal.jsx` (Security - Visitor entity)

### ملفات استثنائية ⚠️ (تحتاج معالجة مختلفة)
| الملف | السبب |
|---|---|
| `PageNotFound.jsx` | يستخدم `base44.auth.me` — لا يوجد مكافئ في dbClient حتى الآن |
| 7 ملفات (غير محددة) | تستخدم `base44.integrations.Core.UploadFile` — لا يوجد مكافئ بعد |
| `AuthContext.jsx` | يحتوي على ref واحد فقط (تعليق) |

---

## 7. قواعد الكود الإلزامية (Coding Rules)

```
✅ استخدم useQuery دائماً لجلب البيانات
✅ استخدم useMutation للعمليات (create/update/delete)
✅ استخدم useMemo للقيم المحسوبة
✅ استخدم useSearchParams بدلاً من useState للتنقل بين التبويبات
✅ كل queryKey يجب أن يكون فريداً في المشروع كله
✅ user.id دائماً للـ created_by

❌ لا useEffect مع fetch مباشرة
❌ لا hardcode للـ IDs (created_by: 1 ممنوع)
❌ لا قيم queryKey مكررة في أي مكان
❌ لا نظام غرامات/عقوبات (تمت إزالته — لا تُعيده)
❌ لا نظام استعارة مكتبي (تمت إزالته — لا تُعيده)
```

---

## 8. كيان Visitor (مضاف حديثاً)

```javascript
// الجدول: visitors
// الاستخدام: بوابة الموظف > حارس الأمن (سجل الزوار)
entities.Visitor.list("-created_at")
// متاح للمدير للاطلاع أيضاً
```

---

## 9. الـ Entities الكاملة في قاعدة البيانات

```
Student, Teacher, Attendance, Subject, LibraryBook,
FinancialRecord, ActivityPost, ActivityComment, ActivityChat,
AuditLog, BusDriver, BusDriverReport, CardTopUp, ClassSchedule,
Donation, FriendRequest, StoreItem, Purchase, StudyRoom,
StudyGroup, StudyGroupPost, StudyMaterial, StudentAward,
StudentGrade, StudentReport, Supervisor, StaffMember,
TeacherRating, TeacherTask, PortalAccessConfig, PortalGroup,
PortalGroupMessage, PortalNotification, PrivateMessage,
RoomMessage, RoomVideo, BookReview, MessageReadReceipt,
TypingIndicator, Fine, ParentLinkRequest, VirtualSession,
SessionParticipant, OfficialAnnouncement, CounselingCase,
CaseAssessment, InterventionPlan, FollowUp, CaseVisibilityLog,
FeeStructure, StudentFee, FeePayment, ActivityFee,
StudentActivityFee, StudentWallet, WalletTransaction,
HallRental, OtherRevenue, Expense, SalaryRecord,
PurchaseOrder, Visitor
```

---

## 10. نظام المالية (Finance System)

طبقات ونظم المالية:
1. **محفظة الطالب** — رصيد قابل للشحن (StudentWallet / WalletTransaction / CardTopUp)
2. **الرسوم الدراسية والنشاطات** — (FeeStructure / StudentFee / FeePayment / ActivityFee / StudentActivityFee)
3. **مسير الرواتب والكشوفات (Payroll)** — صفحة (`StaffPayroll.jsx`) مخصصة لاحتساب وصرف رواتب الموظفين الإداريين والمعلمين.

### قواعد احتساب الرواتب في مسير الرواتب:
- **الموظفون الإداريون**: يتم تخزين رواتبهم في عمود `salary` في جدول `staff_members` (بنوع بيانات `NUMERIC` وقيمة افتراضية 4000 ريال)، ويمكن تعديلها وتخصيصها من نافذة بيانات الموظف في لوحة الموارد البشرية.
- **المعلمون**: يتم مزامنة رواتبهم ديناميكياً من عمود `salary` في جدول `teachers` (التي يتم تعيينها من صفحة مدير النظام / ملف المعلم).
- **أولوية حساب الراتب الأساسي (Basic Salary)**:
  1. التعديلات اليدوية للمسير المحفوظة محلياً (`localStorage`).
  2. قيمة الراتب المخصص المسجل في قاعدة البيانات (`member.salary`).
  3. القيمة الافتراضية للمعلم (8000 ريال) في حال عدم تحديد راتب بقاعدة البيانات.
  4. القيم الافتراضية للدور الوظيفي للموظف (Admin: 9000، HR: 6500، المحاسب: 7000، المسجل: 5500، والباقي: 4000).

بوابة المحاسب تشمل: الإيرادات / المصروفات / أوامر الشراء / 8 تقارير قابلة للطباعة

---

## 11. نظام الإرشاد الطلابي (Counseling System)

Entities: `CounselingCase`, `CaseAssessment`, `InterventionPlan`, `FollowUp`, `CaseVisibilityLog`  
الصلاحيات: role-based — ليس كل الأدوار ترى كل الحالات

---

## 12. الجلسة الافتراضية (Virtual Classroom)

التقنية: WebRTC + Canvas Smart Board  
Entities: `VirtualSession`, `SessionParticipant`

---

## 13. تحسينات الأداء

```javascript
// React Query — لتقليل استهلاك Neon PostgreSQL (free tier)
{
  staleTime: 5 * 60 * 1000,  // 5 دقائق
  // + تحديد حجم الـ fetch الافتراضي
}
```

---

## 14. طريقة استخدام هذا الملف في البرومت

في بداية كل برومت للـ Agent أضف:

```
اقرأ ملف PLATFORM_STRUCTURE.md الموجود في جذر المشروع أولاً،
ثم نفّذ المطلوب بدقة وفقاً للقواعد الموثقة فيه.
```

---

*آخر تحديث: يونيو 2026*
