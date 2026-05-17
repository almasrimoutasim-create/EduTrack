# PROJECT_MAP.md — EduTrack (المدرسة الرقمية)

## [TECH_STACK]
| Layer | Technology | Version (2026-05) |
|---|---|---|
| Framework | React + Vite | 18.2 / 6.1 |
| UI Components | Radix UI + shadcn/ui | latest stable |
| Styling | Tailwind CSS + tailwindcss-animate | 3.4.19 |
| State/Data | TanStack Query | 5.84.1 |
| Routing | React Router DOM | 6.26.0 |
| Backend | Base44 Platform + Neon PostgreSQL | SDK 0.8.27 |
| Forms | React Hook Form + Zod | 7.54.2 / 3.24.2 |
| Animations | Framer Motion | 11.16.4 |
| Icons | Lucide React | 0.475.0 |
| i18n | Custom LanguageProvider (EN/AR) | — |
| Charts | Recharts | 2.15.4 |
| PDF | jsPDF + react-pdf | 4.2.1 / 7.7.4 |
| QR | qrcode.react + jsqr | 3.2.0 / 1.4.0 |
| Payments | Stripe (React Stripe JS) | 3.0.0 / 5.2.0 |
| Linting | ESLint 9 (flat config) | 9.19.0 |

## [SYSTEM_FLOW]

### رحلة المستخدم الرئيسية (Admin Flow)
1. **Login** → RoleGate يحدد الدور → يوجه للبوابة المناسبة
2. **Admin Dashboard** → نظرة عامة على النظام (طلاب، حضور، مالية)
3. **Students** → CRUD كامل + استيراد جماعي + بطاقات QR ✅
4. **Teachers** → CRUD كامل (dialog مكتمل) ✅
5. **Attendance** → تسجيل الحضور + ملخصات ✅
6. **Finance** → معاملات من API + إحصائيات حقيقية + dialog ✅
7. **Library** → CRUD كامل للكتب (dialog مكتمل) ✅
8. **Store** → CRUD + سلة شراء حقيقية + checkout ✅
9. **Study Rooms** → حجز غرف + dialog مكتمل ✅
10. **Materials** → رفع ملفات + dialog مكتمل ✅
11. **Activity Feed** → نشاط اجتماعي
12. **Awards** → CRUD كامل للجوائز (dialog مكتمل) ✅
13. **Staff Control** → CRUD كامل للموظفين (dialog مكتمل) ✅
14. **Student Directory** → عرض + تصدير CSV ✅
15. **Audit Log** → سجل التدقيق
16. **Portal Access Admin** → إدارة الصلاحيات ✅

### البوابات المنفصلة (Portal Flows)
- **Student Portal** → جدول، درجات، دردشة، مجموعات ✅
- **Teacher Portal** → حصص مباشرة، إشعارات، ملفات
- **Parent Portal** → متابعة الأبناء، حضور، غرامات ✅
- **Bus Supervisor Portal** → بيانات حقيقية من API ✅
- **Staff Portal** → أخبار، دليل زملاء ✅

## [ARCHITECTURE]

```
C:\MFA/
├── src/
│   ├── main.jsx                    # Entry point
│   ├── App.jsx                     # Router + providers
│   ├── index.css                   # Global styles
│   ├── api/
│   │   ├── base44Client.js         # SDK proxy (redirects to dbClient)
│   │   └── dbClient.js             # CRUD via /neon-db/entities/* (38 entities)
│   ├── lib/
│   │   ├── AuthContext.jsx         # Auth provider
│   │   ├── LanguageContext.jsx     # i18n (EN/AR, RTL)
│   │   ├── PageNotFound.jsx        # 404 page
│   │   ├── app-params.js           # Base44 config extraction
│   │   ├── query-client.js         # TanStack Query config
│   │   ├── translations.js         # EN/AR dictionary
│   │   └── utils.js                # cn(), isIframe
│   ├── hooks/
│   │   └── use-mobile.jsx          # Responsive hook
│   ├── functions/
│   │   └── checkLowStockAlert.js   # Serverless stock alert
│   ├── utils/
│   │   └── index.ts                # createPageUrl()
│   ├── pages/                      # 31 page components
│   ├── components/
│   │   ├── ui/                     # 48 shadcn primitives
│   │   ├── layout/                 # 7 layout components
│   │   ├── portal/                 # 21 portal-specific components
│   │   ├── students/               # 3 student CRUD components
│   │   ├── teacher/                # 5 teacher components
│   │   ├── shared/                 # 11 shared components (9 CRUD dialogs + utils)
│   │   └── [9 top-level]           # ProtectedRoute, RoleGate, etc.
├── server/
│   ├── api.js                      # REST middleware (38 entities → Neon)
│   └── db.js                       # Neon SQL client
├── base44/
│   ├── entities/                   # 38 entity schemas (.jsonc)
│   └── functions/                  # 10 serverless functions
└── [config files]                  # vite, tailwind, eslint, postcss
```

### CRUD Dialogs Created (9 total)
| Dialog | Entity | Page |
|---|---|---|
| StudentFormDialog | Student | Students.jsx |
| TeacherFormDialog | Teacher | Teachers.jsx |
| SubjectFormDialog | Subject | Subjects.jsx |
| LibraryBookFormDialog | LibraryBook | Library.jsx |
| StoreItemFormDialog | StoreItem | Store.jsx |
| StaffMemberFormDialog | StaffMember | StaffControl.jsx |
| AwardFormDialog | StudentAward | Awards.jsx |
| FinancialRecordFormDialog | FinancialRecord | Finance.jsx |
| StudyRoomFormDialog | StudyRoom | StudyRooms.jsx |
| StudyMaterialFormDialog | StudyMaterial | Materials.jsx |

### Entity Registry (38 entities in dbClient.js)
Student, Teacher, Attendance, Subject, LibraryBook, FinancialRecord, ActivityPost, ActivityComment, ActivityChat, AuditLog, BusDriver, BusDriverReport, CardTopUp, ClassSchedule, Donation, FriendRequest, StoreItem, Purchase, StudyRoom, StudyGroup, StudyGroupPost, StudyMaterial, StudentAward, StudentGrade, StudentReport, Supervisor, StaffMember, TeacherRating, TeacherTask, PortalAccessConfig, PortalGroup, PortalGroupMessage, PortalNotification, PrivateMessage, RoomMessage, RoomVideo, BookReview, MessageReadReceipt, TypingIndicator

## [ORPHANS & PENDING]

### COMPLETED (All Fixed)
| # | Issue | Status |
|---|---|---|
| 1 | Finance.jsx: `Clock` icon missing import | ✅ Fixed |
| 2 | Finance.jsx: `format` from date-fns missing import | ✅ Fixed |
| 3 | PortalAccessAdmin.jsx: `Staff` → `StaffMember` | ✅ Fixed |
| 4 | StaffPortal.jsx: `Staff` → `StaffMember` | ✅ Fixed |
| 5 | Awards.jsx: `Award` → `StudentAward` | ✅ Fixed |
| 6 | Students.tsx duplicate dead file | ✅ Deleted |
| 7 | Teachers.jsx: Add button → no CRUD dialog | ✅ TeacherFormDialog |
| 8 | Subjects.jsx: Add button → no CRUD dialog | ✅ SubjectFormDialog |
| 9 | Library.jsx: Add Book button → no dialog | ✅ LibraryBookFormDialog |
| 10 | Store.jsx: Add Product button → no dialog | ✅ StoreItemFormDialog |
| 11 | Awards.jsx: Grant Award button → no dialog | ✅ AwardFormDialog |
| 12 | StaffControl.jsx: Add Staff button → no dialog | ✅ StaffMemberFormDialog |
| 13 | Finance.jsx: New Transaction button → no dialog | ✅ FinancialRecordFormDialog |
| 14 | StudyRooms.jsx: Book Room button → no dialog | ✅ StudyRoomFormDialog |
| 15 | Materials.jsx: Upload File button → no dialog | ✅ StudyMaterialFormDialog |
| 16 | StudentDirectory.jsx: Export CSV → no implementation | ✅ CSV export added |
| 17 | Store.jsx: Cart → mock data | ✅ Real cart + checkout |
| 18 | Finance.jsx: Stats → hardcoded | ✅ Real API data |
| 19 | BusSupervisorPortal.jsx: Data → hardcoded | ✅ Real API data |
| 20 | All pages: `name` → `full_name` field mismatch | ✅ Fixed in 14 files |
| 21 | Students.jsx: Dropdown action buttons missing icons | ✅ Added Eye, Pencil, Trash2 |
| 22 | Teachers.jsx: Dropdown action buttons missing icons | ✅ Added Eye, Pencil, Trash2 |
| 23 | Subjects.jsx: Dropdown action buttons missing icons | ✅ Added Eye, Pencil, Trash2 |
| 24 | All pages: Action buttons showing as blank/white | ✅ Added Arabic labels + outline variant |
| 25 | LanguageSwitcher: Icon-only button | ✅ Added "EN/عربي" label |
| 26 | Pagination buttons: Icon-only | ✅ Added "السابق/التالي" labels |
| 27 | Filter/Clear buttons: Missing text labels | ✅ Added Arabic labels |
| 28 | Global: Font unification to Cairo (Google Fonts) | ✅ Cairo 200-900 weights, removed Inter/Playfair/Tajawal |
| 29 | Global: RTL input fields & cards alignment | ✅ All inputs, selects, tables use dir="rtl" in Arabic mode |
| 30 | Global: English numerals in RTL mode | ✅ `.num-en` class with `unicode-bidi: isolate; direction: ltr` |
| 31 | Pages: Full redesign (Students, Teachers, Subjects, Finance, Library, Store, Awards, StaffControl, Materials, StudyRooms, Attendance, StudentDirectory) | ✅ Unified Cairo font, rounded-xl cards, consistent spacing, Arabic labels, English numbers |
| 32 | Button component: Text invisible on white background | ✅ Fixed outline/ghost/secondary variants with explicit text-stone-800 colors and thicker borders |

### Low Priority (Unrouted Pages)
| # | File | Issue |
|---|---|---|
| 21 | `src/pages/StudentDashboard.jsx` | Exists but not routed |
| 22 | `src/pages/TeacherDashboard.jsx` | Exists but not routed |
| 23 | `src/pages/ParentDashboard.jsx` | Exists but not routed |
| 24 | `src/pages/BoardingStatus.jsx` | Exists but not routed |

### Entities with No Dedicated UI (21)
BusDriver, BusDriverReport, CardTopUp, ClassSchedule, Donation, FriendRequest, MessageReadReceipt, PortalAccessConfig, PortalGroup, PortalGroupMessage, PortalNotification, PrivateMessage, RoomMessage, RoomVideo, BookReview, TypingIndicator, Supervisor, StudentGrade, StudentReport, TeacherRating, TeacherTask, StudyGroup, StudyGroupPost

---
*Last Updated: 2026-05-17*
*Status: FULL REDESIGN COMPLETE. Cairo font unified (200-900). RTL inputs/cards fixed. English numerals enforced. All pages redesigned with consistent spacing, rounded-xl cards, Arabic labels. Build passing (ESLint ✅, Vite ✅).*
