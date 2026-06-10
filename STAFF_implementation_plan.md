<div dir="rtl">

# خطة تنفيذ مشروع نظام كوادر للموارد البشرية (Kawader HR System)

تهدف هذه الخطة إلى بناء نظام "كوادر" للموارد البشرية استناداً لخصائص الأنظمة الرائدة. النظام عبارة عن منصة SaaS (تعدد المستأجرين) لإدارة الموارد البشرية (مسير الرواتب، الحضور والانصراف، وإدارة الموظفين).

## User Review Required

> [!IMPORTANT]
> يرجى مراجعة تصميم قاعدة البيانات أدناه للتأكد من توافقها مع رؤيتك. النظام مصمم ليدعم (تعدد المستأجرين - Multi-tenancy) بحيث يمكن لعدة شركات استخدام نفس النظام، مع عزل بيانات كل شركة. هل تريد أن يكون النظام مخصصاً لشركة واحدة فقط أم لعدة شركات كما هو الحال في منصة جسر السحابية؟

## Proposed Changes

### التقنيات المقترحة (Tech Stack)

تم بناء هذه التقنيات لتقارب بشكل كبير البنية التقنية الفعلية التي اكتشفناها في نظام (Jisr):

*   **الواجهة الأمامية (Frontend):** 
    *   إطار العمل: **React.js** (عبر إطار Next.js لتحسين الأداء والـ SEO).
    *   لغة البرمجة: **TypeScript**.
    *   دعم الواجهة والمكونات (UI): سنستخدم **Radix UI** جنباً إلى جنب مع **TailwindCSS** (لتبسيط بناء نظام التصميم Astralis الخاص بهم واستنساخ المكونات بمرونة عالية، مع دعم الـ Dark Mode الشفاف).
    *   التحريك (Animations): **Framer Motion** أو React Spring لجعل التفاعلات سلسة كما هو الحال في الموقع الأصلي.
*   **الواجهة الخلفية (Backend) وقاعدة البيانات:**
    *   قاعدة البيانات: **PostgreSQL** (الأنسب للتعقيد العالي والعلاقات المتعددة في أنظمة الموارد البشرية كما يبدو من حجم بيانات Jisr).
    *   إطار العمل: **Node.js مع Prisma ORM** لإدارة المخطط الضخم (Schema) للكيانات بكفاءة.
    *   المصادقة: **NextAuth.js** مع دعم تسجيل الدخول الأساسي وحسابات Google و Microsoft.

---

### تصميم قاعدة البيانات (Database Schema المقترح)

بناءً على الاستكشاف الداخلي للنظام، يتضح أن هيكل البيانات أكثر تفصيلاً ويشمل المكونات التالية. تم تصميم النماذج لتغطية المتطلبات الرئيسية:

```prisma
// Users, Companies & Roles
model Tenant {
  id              String      @id @default(cuid())
  name            String      // اسم الشركة المستأجرة (مثال: شركة أحمد للتقنية)
  domain          String?     @unique // النطاق الفرعي إذا لزم الأمر (ahmed.jisr.local)
  subscriptionPlan String     @default("BASIC") // نوع الاشتراك (أساسي، متقدم)
  isActive        Boolean     @default(true)
  
  // العلاقات: كل شيء يندرج تحت المستأجر (Tenant) لضمان عزل البيانات
  users           User[]
  departments     Department[]
  locations       Location[]
  payrollGroups   PayrollGroup[]
  leaveTypes      LeaveType[]
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

model User {
  id              String      @id @default(cuid())
  employeeId      String?     // رقم الموظف (لم يعد فريداً عاماً، بل فريد داخل الشركة فقط)
  idNumber        String?     // رقم الهوية/الإقامة
  email           String      @unique // الإيميل فريد عبر النظام لتسجيل الدخول
  password        String?
  fullName        String      // الاسم كاملاً
  jobTitle        String?     // المسمى الوظيفي
  status          EmpStatus   @default(ACTIVE) // حالة الموظف
  joinDate        DateTime?   // تاريخ الانضمام
  role            SystemRole  @default(EMPLOYEE) // دور المستخدم في النظام (مستأجر رئيسي، HR، موظف)
  
  // العلاقات (Relations) الأساسية לעزل البيانات
  tenantId        String
  tenant          Tenant      @relation(fields: [tenantId], references: [id])
  
  departmentId    String?
  department      Department? @relation(fields: [departmentId], references: [id])
  locationId      String?
  location        Location?   @relation(fields: [locationId], references: [id])
  managerId       String?
  manager         User?       @relation("ManagerToEmployee", fields: [managerId], references: [id])
  employees       User[]      @relation("ManagerToEmployee")
  
  attendances     Attendance[]
  payrollRecords  PayrollRecord[]
  requests        Request[]

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  // ضمان عدم تكرار رقم الموظف أو الهوية داخل نفس الشركة (الـ Tenant)
  @@unique([tenantId, employeeId])
  @@unique([tenantId, idNumber])
}

model Department {
  id            String    @id @default(cuid())
  name          String
  tenantId      String
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  users         User[]
}

model Location {
  id            String    @id @default(cuid())
  name          String    // اسم الموقع الجغرافي (مثل HEAD OFFICE)
  tenantId      String
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  users         User[]
}

// Attendance (الحضور والانصراف)
model Attendance {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  date          DateTime  @db.Date
  checkIn       DateTime?
  checkOut      DateTime?
  status        AttStatus // حضور متأخر، انصراف مبكر، غياب
  deductionMins Int       @default(0) // الخصومات بالدقائق
}

// Payroll (مسير الرواتب)
model PayrollGroup {
  id            String    @id @default(cuid())
  name          String
  tenantId      String
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  payrolls      Payroll[]
}

model Payroll {
  id            String        @id @default(cuid())
  groupId       String
  group         PayrollGroup  @relation(fields: [groupId], references: [id])
  month         Int
  year          Int
  status        String        // خطوة جمع البيانات، معتمد
  records       PayrollRecord[]
}

model PayrollRecord {
  id            String    @id @default(cuid())
  payrollId     String
  payroll       Payroll   @relation(fields: [payrollId], references: [id])
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  basicSalary   Float
  allowances    Float     @default(0)
  deductions    Float     @default(0)
  netPay        Float
}

// Requests (الطلبات)
model Request {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  
  // نوع الطلب (مثل: تصحيح بصمة، استئذان، إجازة)
  requestType   RequestType 
  
  // تفاصيل الطلب المتغيرة حسب النوع (مثلاً: اليوم كاملاً، شخصي، الحضور + الانصراف)
  details       Json?     
  
  // تواريخ الطلب إذا كان له نطاق (مثل إجازة أو استئذان)
  targetDate    DateTime? @db.Date // يوم الطلب
  
  approverId    String?   // مسؤول الموافقة
  status        ReqStatus @default(PENDING) // في الانتظار (معلق)، معتمدة، مرفوض.
  createdAt     DateTime  @default(now())
}

enum RequestType {
  LEAVE           // إجازة
  PERMISSION      // استئذان (كما في الصورة)
  PUNCH_CORRECTION // تصحيح بصمة (كما في الصورة)
  OTHER           // أخرى
}

enum EmpStatus {
  ACTIVE      // نشط
  PROBATION   // في فترة التجربة
  TERMINATED  // منتهي خدمته
}

enum AttStatus {
  PRESENT     // حاضر
  LATE        // حضور متأخر
  EARLY_LEAVE // انصراف مبكر
  ABSENT      // غياب
  INCOMPLETE  // سجلات غير مكتملة
}

enum ReqStatus {
  PENDING
  APPROVED
  REJECTED
}

enum SystemRole {
  SUPER_ADMIN // مدير النظام العام (أنت)
  TENANT_ADMIN // مدير الشركة المشتركة
  HR_MANAGER  // مدير الموارد البشرية بالشركة
  EMPLOYEE    // موظف عادي
}

// Settings & Policies (الإعدادات والسياسات)
model LeaveType {
  id            String    @id @default(cuid())
  name          String    // اسم الإجازة (سنوية، مرضية، بدون راتب)
  tenantId      String
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  isPaid        Boolean   @default(true) // هل هي مدفوعة أم لا؟
  maxDays       Int       // الحد الأقصى للأيام في السنة
  policies      LeavePolicy[]
}

model LeavePolicy {
  id            String    @id @default(cuid())
  leaveTypeId   String
  leaveType     LeaveType @relation(fields: [leaveTypeId], references: [id])
  minServiceDays Int      @default(0) // متى يستحق الموظف هذه الإجازة؟
  carryOverDays  Int      @default(0) // عدد الأيام التي يمكن ترحيلها للسنة القادمة
}
```

---

### الهيكل التنظيمي للمشروع (Project Structure & UI Features)

#### النمط المعماري وتجربة المستخدم (UI/UX)
*   **الوحدة البصرية (Design System):** 
    *   خلفية عامة رمادية فاتحة جداً للوحة التحكم (`bg-gray-50`) مع بطاقات بيضاء للبيانات (`bg-white` مع `shadow-sm`).
    *   شريط جانبي عمودي أيمن (Sidebar) باللون الأبيض أو الرمادي الفاتح، مع أيقونات واضحة وحركية بسيطة عند الـ Hover.
    *   الجداول: سيتم بناء جداول متقدمة تدعم الفلترة (مثل تصفية الموظفين حسب الحالة "نشط، منتهي خدمته") والتقسيم في صفحات (Pagination).
*   **التوطين (Localization):**
    *   التطبيق سيعمل بأساس **RTL (من اليمين لليسار)** كلغة افتراضية ليتطابق مع واجهة جسر.

#### هيكل الصفحات (Pages) في Next.js (App Router)
*   `app/(auth)/login/page.tsx`: صفحة الدخول بالشاشة المنقسمة.
*   `app/(dashboard)/layout.tsx`: الهيكل المحيط بالصفحات الداخلية (الشريط الجانبي، شريط البحث العلوي).
*   `app/(dashboard)/page.tsx`: **لوحة القيادة (الرئيسية).** تضم بطاقات لتتبع حضور الفريق (اليوم، الأمس)، التذكيرات (العقود المنتهية)، وصندوق الوارد (الطلبات المعلقة).
*   `app/(dashboard)/employees/page.tsx`: **الموظفين.** خلاصة إحصائية علوية (إجمالي النشطين، الموظفون الجدد، في فترة التجربة)، وجدول مفصل ببيانات الموظفين، وزر "+ إضافة موظف".
*   `app/(dashboard)/attendance/page.tsx`: **الحضور والانصراف.** ملخص الحالات اليومية (حضور متأخر، غياب، انصراف مبكر)، وجدول سجلات الموظفين للحركة اليومية وفترات العمل.
*   `app/(dashboard)/payroll/page.tsx`: **مسير الرواتب.** جدول زمني (Timeline/Gantt chart style) لدورات الرواتب الشهرية، وأزرار "بدء إعداد كشف الرواتب" و "إنشاء مجموعة מסير".
*   `app/(dashboard)/requests/page.tsx`: **الطلبات (طلباتي / إعتماداتي).** شاشة لمراجعة واعتماد الإجازات وطلبات الموظفين المختلفة.
*   `app/(dashboard)/settings/leave-policies/page.tsx`: **إعدادات الإجازات.** صفحة مخصصة لإدارة أنواع الإجازات (سنوية، مرضية، زواج، الخ) وتحديد هل هي مدفوعة الأجر أم لا، وربطها بسياسات الاستحقاق.

## Verification Plan

### Automated Tests
*   لا يوجد اختبارات مؤتمتة حالياً، حيث أن هذا مشروع جديد. سيتم لاحقاً إضافة اختبارات الوحدة (Unit Tests) للمكونات باستخدام Jest.

### Manual Verification
1.  **تشغيل خادم التطوير (Development Server):** بتنفيذ الأمر `npm run dev`.
2.  **معاينة التصميم:** فتح المتصفح على الرابط المحلي والتأكد من تطابق الشاشة المنقسمة مع واجهة Jisr، وتأثيرات التمرير (Hover effects)، والألوان.
3.  **فحص تعدد اللغات:** التأكد من عمل زر التبديل للغة العربية (RTL) بشكل يقلب واجهة المستخدم بالكامل بصورة صحيحة.
4.  **تفاعل النماذج:** اختبار الكتابة داخل حقول البريد الإلكتروني وكلمة المرور، والتحقق من الاستجابة البصرية الصحيحة لأزرار SSO.

</div>
