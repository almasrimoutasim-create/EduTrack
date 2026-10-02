# تقرير تدقيق أمني ووظيفي شامل — منصة EduTrack

**التاريخ:** 2026-10-02
**النطاق:** المنصة بالكامل (جميع الصفحات والأزرار) — بدءًا من صفحة المؤسس
**طبيعة العمل:** تدقيق فقط — **لم يتم تعديل أو حذف أي ملف**
**حالة المستودع:** شجرة العمل نظيفة، الفرع `main` يسبق `origin/main` بمقدار commit واحد (`9a00e9b`)

---

## مُلخّص تنفيذي

| المستوى | العدد | أبرز الأمثلة |
|---|---|---|
| 🔴 **حرج / أمني** | 5 | تجاوز المصادقة على مستوى المستأجر، بيانات دخول افتراضية، جلسات ضيف مُمنحة ذاتيًا، تسريب بيانات الطلاب عبر البوابات، تغيير كلمة مرور مزيّف |
| 🟠 **عالية** | 7 | مؤشر تحميل لا ينتهي، مسارات متجر غير محمية، نوافذ مؤسس ميتة، تكرار معرّفات DOM |
| 🟡 **متوسطة** | 8 | خطأ بناء في ملف يتيم، سياق الفروع معطّل، لا تحديث تلقائي للبيانات، سجلات تصحيح أخطاء |
| ⚪ **منخفضة** | 6 | استيرادات غير مستخدمة، صفحات بلا `useAuth`، ضجيج `typecheck` |

**الحكم العام:** المنصة **غير صالحة للنشر في الإنتاج** قبل معالجة الفئة الحريحة. الطبقة الأمنية Pathfinder غير مُفعَّلة فعليًا على الجداول، وواجهات البوابات تتجاوز المصادقة من جهة العميل.

---

# 🔴 الفئة الحرجة (أمنية)

## 1. تجاوز المصادقة يتيح قراءة/تعديل/حذف بيانات كل المدارس — `server/api.js`

**هذا أخطر ثغرة في النظام.**

### سلسلة الخلل

**أ) الوسيط يتجاهل غياب الرمز** — `server/api.js:3424–3457`
```js
const allowWithoutAuth =
  isPublicRegistrationPost(...)  // 3426
  || isPublicRegisterPath(...)    // 3427
  || (isFounderEntity(...) && isFounderJwt);  // 3428
// 3441–3444: يُرجع 401 فقط عند عدم وجود Bearer header إطلاقًا
// 3452–3454: عند فشل التحقق → req.user = null  (واستمرار الطلب!)
```
عند إرسال رمز غير صالح، **لا يُرفض الطلب** بل يُكمل بـ `req.user = null`.

**ب) الحارس multitenant يُخطى بحالة `req.user = null`** — `api.js:3647–3652`
```js
const TENANT_TABLES_SET = new Set([ /* 72 جدولًا */ ]);  // 3647
const tenantId = req.user?.school_id || null;              // 3649
if (isTenantTable && !tenantId && req.user && req.user.role !== 'founder') {
  return 403;
}
//                      ^^^^^^^^ هذا الشرط يجعل req.user=null يتخطى الحارس كليًا
```

**ج) النتيجة:** كل استعلامات الجداول الـ72 بلا ترشيح
- `LIST` `3929` و `GET-ONE` `3975`: يُضاف `WHERE school_id = $n` فقط `if (tenantId)` →沦为 `SELECT * FROM students`
- `POST` `4021–4024`: يُحقن `school_id` فقط إذا كان truthy
- `PUT` `4193–4206`: الفرع البديل يُحدّث بـ `WHERE id = $n` **دون أي ترشيح مدرسة**
- `DELETE` `4219–4226`: نفس النمط

**د) لا توجد حماية على مستوى المضيف** — `server.js:67–73`
```js
app.use(apiHandler);   // بلا أي auth middleware
```

**الجداول الـ72 المُعرّضة** تشمل: `students`، `teachers`، `attendance`، `system_admins`، `system_settings`، `fines`، `counseling_cases`، `salary_records`، `fee_payments`، `visitors`، `school_branches` وغيرها.

**الاختبار:**
```
curl -H "Authorization: Bearer invalid" https://host/api/entities/students
→ 200 OK + قائمة كل طلاب كل المدارس
curl -X PUT -H "Authorization: Bearer x" -d '{"full_name":"HACKED"}' .../entities/students/42
→ 200 OK + تعديل طالب في مدرسة أخرى
```

**الإصلاح المطلوب:** ربط `!tenantId && isTenantTable` بـ 403 **دون** شرط `req.user`، ورفض أي مسار لا يحمل `req.user` صالحًا، وإضافة `authenticate` في `server.js` قبل `apiHandler`.

---

## 2. بيانات دخول افتراضية معروفة تُنشأ تلقائيًا عند كل نشر جديد

**أ) حساب المدير العام** — `api.js:657–662`
```js
const rows = await sql`SELECT COUNT(*) FROM system_admins`;
if (rows[0].count === '0') {
  const hashed = bcrypt.hashSync('admin123', 10);
  await sql`INSERT INTO system_admins (email, password, full_name)
             VALUES ('admin@edutrack.com', ${hashed}, 'System Admin')`;
  console.log('[neon] created default system admin (admin@edutrack.com / admin123)');
}
```

**ب) حساب البوابة** — `api.js:620–625`
```js
if (rows[0].count === '0') {
  const hashed = bcrypt.hashSync('edutrack2026', 10);
  await sql`INSERT INTO gateway_accounts (username, password) VALUES ('gateway', ${hashed})`;
  console.log('[neon] created default gateway account (gateway / edutrack2026)');
}
```

كلمة المرور `edutrack2026` و `admin123` **مستخدمة ومعلنة** في سجلات الخادم نفسها. أي نشر جديد على الإنترنت يبدأ بهذين الحسابين.

**الإصلاح:** تعطيل البذر افتراضيًا، توليد كلمة مرور عشوائية وطباعتها مرة واحدة فقط، أو اشتراط متغير بيئة إلزامي.

---

## 3. ثلاث مسارات تمنح نفسها جلسة ضيف مُصادَق عليها — دون كلمة مرور

### أ) بطاقة "الموظف" في صفحة `/login` العامة — `RoleLogin.jsx:602–621`
```js
// النقر على بطاقة الدور "staff" يكتب:
localStorage.setItem("portal_role", "staff");
localStorage.setItem("portal_user", JSON.stringify({
  id: "staff-guest", email: "guest@edutrack.com"   // 608–612
}));
localStorage.setItem("portal_user_id", "staff-guest");
localStorage.setItem("portal_user_name", "زائر");
localStorage.setItem("portal_is_auth", "true");      // ← 614
localStorage.setItem("portal_gateway_passed", "true"); // ← 615
window.location.href = "/staff-portal";
```
التعليق في `614–615` يعترف بالنية صراحةً. **لا يوجد حقل كلمة مرور إطلاقًا.**

### ب) زر "دخول سريع (زائر)" — `RoleLogin.jsx:801–818`
زر مرئي داخل صفحة الدخول عندما `selectedRole.id === "staff"`، يبذر الجلسة نفسها (بدون `portal_gateway_passed`).

### ج) زر "تسجيل الخروج" يُعيد بذر الجلسة — `StaffPortal.jsx:268–284`
```js
function handleLogoutDept() {
  // يُنظّف الجلسة...
  localStorage.setItem("portal_role", "staff");
  localStorage.setItem("portal_user", ...);
  localStorage.setItem("portal_is_auth", "true");
  localStorage.setItem("portal_gateway_passed", "true");  // 284
  window.location.href = "/staff-portal";
}
```
**النقطة الحرجة:** هذا ليس في `git log` — وجوده سابقHISTORY ولا علاقة له بالـ commit الأخير.

**الأثر:** أي زائر على `/login` يصل إلى `/staff-portal` بصلاحيات موظف، وبوابة المرور تُعتبر "مجاوزة".

---

## 4. البوابات الخمس تتجاوز المصادقة + تسريب بيانات غير مرشَّحة

### أ) لا بوابة واحدة تستورد `useAuth`

بحث نصي على `useAuth` / `isAuthenticated` / `authChecked` في الملفات الخمسة大型:

| الملف | الأسطر | آلية الهوية |
|---|---|---|
| `StudentPortal.jsx` | 1786 | `localStorage.getItem("portal_user_id") \|\| "S-505"` (`103`) |
| `ParentPortal.jsx` | 1269 | `localStorage.portal_user` (`88`) + `portal_user_id \|\| "parent-default"` (`692`, `893`) |
| `TeacherPortal.jsx` | 1792 | `localStorage.getItem("portal_user_id") \|\| "T-202"` (`65`) |
| `BusSupervisorPortal.jsx` | 1137 | مطابقة بريد من `localStorage` (`166–169`) |
| `StaffPortal.jsx` | 727 | `useAuth` للـ `user` فقط (`44`) لكن يفضّل `localStorage.portal_role` (`46`) |

**معرّفات احتياطية ثابتة (`S-505`, `T-202`, `parent-default`)** — لو حُذفت `localStorage` يقرأ التطبيق بيانات طالب/معلم افتراضي غير موجود.

**ب) `/student-portal` مفتوح للعموم** — `RoleGate.jsx:106` يضعه في `PUBLIC_PATHS`، و`165–167` تُعيد `children` **قبل** فحص المصادقة في `170`.

### ج) مسح بيانات غير مرشَّح عبر `entities.*.list()`
الافتراضي في `dbClient.js:41–56` هو `limit = 1000` بلا أي ترشيح مدرسة:

**أسوأ الحالات — سجلات counseling:**
```js
// CounselingParentView.jsx
24:  CaseAssessment.list("-created_at", 200)     // تقييمات الإرشاد النفسي
32:  InterventionPlan.list("-created_at", 200)  // خطط التدخل
```
**200 سجل إرشاد نفسي/صحة عقلية لجميع الطلاب** معروضة داخل بوابة ولي أمر.

**الدردشة — تسريب شامل** (`PortalChat.jsx:30,34,38,42,47,52`): كل الطلاب، كل المعلمين، **كل الرسائل الخاصة**، إيصالات القراءة، مؤشرات الكتابة. نفس النمط في `ParentTeacherChat.jsx:34,39,44`.

**أخرى:** `TeacherPortal.jsx:76,229` · `PortalFriends.jsx:16,20,24` · `StudentProfile.jsx:70` · `RateTeachersTab.jsx:32,42` · `ParentFinanceTab.jsx:52` · `BusSupervisorPortal.jsx:117,122,127` · `StudentPortal.jsx:122,150,320` · `PortalActivityFeed.jsx:21,27` · `JoinRoomDialog.jsx:24` · `PortalGroups.jsx:23` · `PortalStudyGroups.jsx:73,297` · الجانبية `ParentSidebar.jsx:41,52` / `TeacherSidebar.jsx:55` / `StudentSidebar.jsx:38`

**٤٨ صفحة** لا تستورد `useAuth` إطلاقًا (حماية على مستوى المسار فقط).

**الإصلاح:** حارس على مستوى المكوّن في كل بوابة + ترشيح `school_id` في كل استعلام + `message_id`/معرّف مالك في استعلامات الرسائل.

---

## 5. 🔴 صفحة المؤسس — زر "تغيير كلمة المرور" مزيّف بالكامل

`FounderDashboard.jsx:3271–3278`
```js
<button onClick={()=>{
  if(!pw.next || pw.next!==pw.confirm) return toast.error("...");
  if(pw.next.length<6) return toast.error("...");
  localStorage.setItem("founder_custom_password", pw.next);   // 3274 ← نص صريح
  setPw({cur:"", next:"", confirm:""});
  toast.success("تم تغيير كلمة المرور بنجاح وحفظها محلياً.");
}}>
```
**ثلاث مشكلات متداخلة:**

1. **حقل «كلمة المرور الحالية» (`pw.cur`) لا يُقرأ إطلاقًا** — لا يوجد أي تحقق من الهوية.
2. **لا يوجد أي اتصال بالخادم** — لا `fetch` ولا `entities`.
3. **التخزين نص صريح (plaintext) في `localStorage`** — أي XSS واحد = سرقة كلمة مرور المؤسس.

**والأهم:** `/api/founder-login` (`api.js:2490–2504`) لا يقرأ `localStorage` إطلاقًا:
```js
const FOUNDER_EMAIL = process.env.FOUNDER_EMAIL;
const FOUNDER_PASSWORD = process.env.FOUNDER_PASSWORD;  // 2494
```
→ **الزر معطّل ١٠٠٪**، والقيمة المخزَّنة **لا تُستخدم أبدًا** عند تسجيل الدخول.

**وأخطر:** السطر `3278` يطبع كلمة المرور الافتراضية داخل واجهة مُوزَّعة:
> `الافتراضية: 430655 — يمكنك تغييرها هنا وتحفظ محلياً.`

و`.env:9–10` يحتوي `FOUNDER_EMAIL=etrack249@gmail.com` و `FOUNDER_PASSWORD=Etrack@430655`.
*(ملاحظة: `.env` مُستثنى في `.gitignore:30,34` وغير متتبَّع في git — وهذا جيد. لكن الرقم `430655` يظهر في كود الواجهة المُوزَّع.)*

**الإصلاح:** `POST /api/founder-password` مع تحقق من كلمة المرور الحالية في الخادم، `bcrypt.hash`، وتخزين في جدول — لا `localStorage`.

---

# 🟠 الفئة العالية

## 6. `PlanAccessGuard` — مؤشر تحميل لا ينتهي للأبد
`PlanAccessGuard.jsx`
```js
// 57–60
if (!isAuthenticated || !user?.school_id) {
  setChecking(false);
  return;                    // ← لا يُضبط loadingPlan=false أبدًا
}
// 92
if (checking || loadingPlan) return <spinner> "جاري التحقق من الباقة...";
```
`loadingPlan` يبدأ `true` (`51`) ولا يُصبح `false` في هذا المسار → **سبينر دائم** لأي مستخدم مصادَق عليه بلا `school_id`.

**إضافي:** `RESTRICTED_ROUTES[location.pathname]` مطابقة تامة — المفتاح `'/counseling/:id'` (`27`) **لا يمكن أن يُطابق أبدًا** → تفاصيل الحالة الإرشادية غير محمية على باقة Starter. كذلك `/staff/personal-requests` و `/staff/attendance` مُغلَّفة لكنها غير موجودة في `RESTRICTED_ROUTES`. واستيرادات `Shield, Crown, Zap` غير مستخدمة.

## 7. مسارات `/store*` غير محمية — `App.jsx:144–149` مقابل `182–187`
```jsx
// 144–149: بدون أي حارس
<Route path="/store" element={<StoreHome/>} />
<Route path="/store/catalog" element={<StoreCatalog/>} />
<Route path="/store/cart" element={<StoreCart/>} />
// 182–187: نفس المسارات ملفوفة بـ PlanAccessGuard
```
React Router v7 يُبقي **أول تطابق متساوي الرتبة** → النسخ المحمية **ميتة**، والمتجر مفتوح على **كل** الباقات.

**إضافي:** كل مسارات البوابات (`194–198`) في المستوى الأعلى — بلا `PlanAccessGuard` وبلا `AppLayout`.

## 8. `RoleGate` يُعيد التصيير قبل التحقق — `RoleGate.jsx:165–167`
```js
if (isPublicPath) return children;   // 165
if (!isAuthenticated) return <Login/>;  // 170
```
المسارات العامة تتخطى **المصادقة و التفويض والقفل معًا**، والمطابقةbysubfix تمتد للمسارات الفرعية. كذلك `getDefaultRedirect` يوجّه أدوار `hr→/staff-control` و `accountant→/finance` و `library→/library` و `store→/store` (كلها محمية بالباقة) → مستخدم Starter يرى جدار الترقية. وإعادة التوجيه تستخدم `window.location.href` الكامل (`140`).

## 9. نافذتان في لوحة المؤسس لا يمكن فتحهما أبدًا

| الحالة | الاستدعاءات | النتيجة |
|---|---|---|
| `setShowAddPlan` | `false` فقط في `1141`, `3551`, `3602` | نافذة إضافة/تعديل الباقة (`showAddPlan &&` في `3550`) **ميتة** |
| `setViewTeacherSubDetail` | `null` فقط في `1088`, `1112`, `3683` | نافذة تفاصيل اشتراك المعلم (`3609–3690`) **غير قابلة للوصول** |

**أثر على 넓ش:** تدفّق **الموافقة على trials/الاشتراكات المدفوعة للمعلمين ميت بالكامل**.

**وأيضًا:** `filteredTeacherSubRequests` (`1481`) معرَّف ولا يُصيَّر أبدًا · `subscriptionPricing` (`1230`) + `pricingFetching` (`1231`) غير مستخدمين مع **طلب `/api/subscription-pricing` بلا فائدة عند كل تحميل** · `setTeacherSubRequests`/`setTeacherSubLoading` (`1944–45`) لا تُستدعى.

## 10. مكرّرات معرّفات DOM في محرّري الأسعار
```
field-founderdashboard-plan-starter-price      → 2936 و 3232
field-founderdashboard-plan-professional-price → 2937 و 3233
field-founderdashboard-plan-enterprise-price   → 2938 و 3234
field-founderdashboard-default-currency        → 2940 و 3255
```
محرّران للأسعار في نفس الصفحة، **يكتبان نفس `localStorage["founder_platform_settings"]`** → تركيز/تمرير خاطئ، والتعارض يربح على أي إدخال.

## 11. الأسعار تُحفظ في المتصفح فقط — لا تتشارك بين الجلسات
`FounderDashboard.jsx:1372` يقرأ `localStorage.settings.plan_*_price`، والأسعار المعروضة في `PLANS` (`1375`) مشتقة منها. النتيجة: سعر تعدّله في متصفحك **لا يظهر** لعميل/مدير آخر، ولا يُحفظ على الخادم.

## 12. حالة ميتة: `pricingPlans` (`1934`) والأسعار الحقيقية مفصولة
الـ CRUD على `pricingPlans` (إضافة/تعديل/حذف باقة) منفصل تمامًا عن ما يُعرض. حذف باقة من `pricingPlans` **لا يُخفي** سعرها من الواجهة.

## 13. أخطاء مُبتلَعة تُظهر لوحة فارغة بدل تحذير انتهاء الجلسة
```js
catch { return [] }   // في كل استعلامات القوائم
```
`markAuthErr` فقط في `972`. **مفقود في:** `teacherStudentRequests` (`1225`)، الأسعار (`1238`)، اشتراكات المعلمين (`1254`)، إيصالات الدفع (`1269`) → المستخدم يرى لوحة فارغة صامتة بدل لافتة انتهاء الجلسة.

**إضافي:** `supportAuth()` (`1299`) يرتد إلى `portal_jwt_token`/`jwt_token` عند غياب `founder_token` → **رمز بدور خاطئ** يُرسَل إلى نقاط نهاية خاصة بالمؤسس.

## 14. `buildPortalDeepLink` ينشئ روابط بوابات بمدرسة خاطئة
`FounderDashboard.jsx:2572–2578` و `portalNavigation.js:77–85`
```js
buildPortalDeepLink({ role, identifier, school: r.school_id })
```
جدول `registration_requests` **لا يملك عمود `school_id`** → القيمة `undefined` → يعود الدالة إلى `readSchoolSlug()` خاص بالمؤسس من `localStorage`. **روابط الطلاب/المعلمين المُولَّدة تحمل المدرسة الخطأ أو لا تحملها.** (وحلقة إضافية: `school.trim()` في `portalNavigation.js` سيرمي استثناءً إن كانت `school_id` رقمية.)

---

# 🟡 الفئة المتوسطة

## 15. خطأ بناء قاتل في ملف يتيم — `ParentFinesTab.jsx`
```
Duplicate declaration: const confirmPayment
→ esbuild: The symbol "confirmPayment" has already been declared (سطران 83 و 117)
```
**غير حجب** — صفر مستوردين، لا يُدرَج في الحزمة أبدًا. **التوصية: حذف الملف** (لا إصلاح).

## 16. `BranchContext.activeBranch` دائمًا `null`
`BranchContext.jsx:40–43`
```js
const activeBranch = useMemo(
  () => branches.find(b => b.id === activeBranchId) || null,
  [branches, activeBranchId]
);
```
`activeBranchId` نص من `localStorage` بينما `b.id` رقمي/UUID → **مطابقة حرفية تفشل دائمًا**. يكسر `BranchSelector.jsx:69` و `BranchManagement.jsx:308,375`.

## 17. البيانات لا تتحدّث تلقائيًا أبدًا
`query-client.js:14`
```js
staleTime: 5 * 60 * 1000,
refetchOnMount: false,
refetchOnWindowFocus: false,
```
النتيجة: **لا إعادة جلب** عند العودة للنافذة أو تبديل التبويب إلا بـ invalidate يدوي. المستخدم يرى أرقامًا قديمة دون أي مؤشر.

## 18. سجلّات تصحيح أخطاء في الإنتاج — `api.js:3408–3409`
كتلة مكرّرة ميتة تُسجّل **سطر الطلب كاملًا + `origin` + قيمة ترويسة `x-founder-auth` + `content-type`** في كل طلب `RegistrationRequest`. إجمالي `console.log`/`console.debug` في `api.js` = **82**.

## 19. أولوية ترويسة خاطئة في عميل البيانات
`dbClient.js:20`
```js
const token = portal_jwt_token || jwt_token || auth_token || token;
```
رمز البوابة القديم يظِل رمز المدير الجديد. ورمز المؤسس يُرفق فقط على مسارات `/founder*` (`22–23`).

## 20. `AuthContext.checkAppState` يسجّل الدخول من `localStorage` بلا تحقق
`AuthContext.jsx:141–152` — يعمل بالمسار البديل اعتمادًا على `portal_role` + `portal_user_id` في `localStorage` **دون أي تحقّق من الرمز**. كذلك `isLoadingPublicSettings` مُهيّأ `false` (`357`) ولا يُضبط `true` أبدًا (ميت).

## 21. أولوية ترويسة `x-branch-id` — `dbClient.js:31–34`
يُرسَل دائمًا بلا ربط بمزامنة التبديل → طلبات من فروع قديمة تُعامل كأنها للفرع الحالي.

## 22. 6 استيرادات غير مستخدمة في `Sidebar.jsx`
`src/components/layout/Sidebar.jsx` — **6 استيرادات ميتة** تُشير إلى **ترحيل نصف مكتمل** في الهيكل العام.

---

# ⚪ الفئة المنخفضة

## 23. ~60 استيرادًا غير مستخدمًا عبر 20 ملفًا
`npx eslint . --quiet` → خطأ تحليل واحد (`ParentFinesTab`) + ~60 خطأ `no-unused-vars`.
**إيجابي:** `no-undef` و `react/jsx-no-undef` و `react-hooks/rules-of-hooks` **لم تُطلق أبدًا** → **لا توجد أخطاء معرّفات غير معرّفة** (أي bugs الـ blank-page).

## 24. 48 صفحة بلا `useAuth`
حماية على مستوى المسار فقط في `RoleGate`. قائمة مختصرة: `Attendance` · `AuditLog` · `Departments` · `Grades` · `HRReports` · `Library` · `StaffPayroll` · `StudentDirectory` · `TeacherDashboard` · `TeacherPortal` وغيرها.

## 25. ضجيج `typecheck` — 67 خطأ في 13 ملفًا
```
FounderDashboard 26 · Settings 20 · portalNavigation 3 · StaffPayroll 3
RenewSubscription 2 · BusRouteManagement 2 · FinancialOverviewCard 2
LandingContentEditor 2 · TeacherDashboard 1 · GradeDistributionChart 1
FounderLogin 1 · AuthContext 1
```
**تقييم صادق:** أغلبها **ليس أخطاء حقيقية** — ت destructuring لـ `mutationFn` غير مُنمَّط يُنتج `void`، ووسائط `{}` افتراضية غير مُنمَّطة. **لكن** يجب إصلاحها لتفعيل فحص الأنواع. **استثناء**: خطأ `portalNavigation.js` (`.trim()` على قيمة قد تكون رقمية) هو خطأ حقيقي محتمل.

## 26. تحذير حجم حزمة
```
vendor-pdf-DGSpA-Kx.js   829.37 kB │ gzip: 289.14 kB   ← تجاوز 800 kB
```

## 27. مسارات روابط داخلية / أهداف `fetch()` — **نظيفة** ✅
- 37 هدف رابط داخلي مقابل مسارات `App.jsx` → **0 غير محلول**
- 31 هدف `fetch()` أمامي مقابل مسارات الخلفية → **0 غير محلول**
- كل الكيانات الـ85 في `dbClient.js` لها مدخل في `ENTITY_TABLE_MAP`

---

# ✅ ما سليم (للحفاظ عليه)

| المكوّن | الحالة |
|---|---|
| `vite build` | ✅ ينجح — `✓ built in 50.15s` |
| سلسلة مصادقة المؤسس | ✅ سليمة: JWT `{role:'founder',email}` 12 ساعة، يفشل مغلقًا بلا متغيرات، `JWT_SECRET` يرفض الإقلاع في الإنتاج بدونه |
| `FounderGuard.jsx` | ✅ نظيف (36 سطرًا) |
| `.env` و `.env*.local` | ✅ مُستثنيان في git وغير متتبَّعين |
| `ProtectedRoute.jsx` | ✅ نظيف (37 سطرًا) |
| `portalNavigation.js` | ✅ نظيف (145 سطرًا) |
| CORS في `server.js:16–37` | ✅ قائمة سماح صريحة |
| تواريخ `jwt.sign` | ✅ كل الـ9 مواقع تُحدّد `expiresIn` |

---

# 🎯 صفحة المؤسس أولًا — ملخّص مُصنَّف

*(متطلّب: التدقيق يبدأ من صفحة المؤسس)*

## الواجهة الصحيحة
- `POST /api/founder-login` ✅ — JWT موقّع 12 ساعة، تحقق bcrypt
- `FounderGuard.jsx` ✅
- فحص إصدار النظام، مؤشرات التنبيه، الجداول الإحصائية، سجل النشاط ✅

## أعطال مؤكدة في `FounderDashboard.jsx` (3808 سطر / 271 KB)

| # | العطل | السطور | الخطورة |
|---|---|---|---|
| 1 | تغيير كلمة المرور **مزيّف** — لا يتجاهل الحالي فقط، بل يخزّن **نصًا صريحًا**، ولا يُستخدم إطلاقًا، ويطبع `430655` في الواجهة | 3271–3278 | 🔴 حرجة |
| 2 | `setShowAddPlan` لا يُستدعى إلا بـ `false` → نافذة الباقات ميتة | 1141, 3551, 3602 | 🟠 عالية |
| 3 | `setViewTeacherSubDetail` لا يُستدعى إلا بـ `null` → **تدفّق موافقة اشتراكات المعلمين ميت** | 1088, 1112, 3683 | 🟠 عالية |
| 4 | 4 معرّفات DOM مكرّرة، محرّران يتنافسان على نفس `localStorage` | 2936–2940 / 3232–3255 | 🟠 عالية |
| 5 | الأسعار في `localStorage` فقط → لا تُشارَك بين الجلسات | 1372, 1375 | 🟠 عالية |
| 6 | `pricingPlans` حالة ميتة — CRUD مفصول عن العرض | 1934 | 🟠 عالية |
| 7 | `supportAuth()` يرتد إلى رمز بportal خاطئ الدور | 1299 | 🟠 عالية |
| 8 | `buildPortalDeepLink` بمدرسة خاطئة (عمود غير موجود) | 2572–2578 | 🟠 عالية |
| 9 | استعلامات تبتلع الأخطاء بلا `markAuthErr` | 1225, 1238, 1254, 1269 | 🟡 متوسطة |
| 10 | `filteredTeacherSubRequests` معرَّف لا يُصيَّر | 1481 | ⚪ منخفضة |
| 11 | `subscriptionPricing` + `pricingFetching` ميتة + طلب شبكة بلا فائدة | 1230–1231 | ⚪ منخفضة |
| 12 | `setTeacherSubRequests`/`setTeacherSubLoading` لا تُستدعى | 1944–1945 | ⚪ منخفضة |

---

# 📋 ترتيب التنفيذ المقترح

## المرحلة ١ — إيقاف النزيف (يوم واحد)
1. `server.js` — أضف `authenticate` قبل `apiHandler`؛ ارفض أي `req.user === null` على جداول الـ72
2. `api.js:3652` — احذف الشرط `&& req.user` من حارس multitenant
3. `api.js:620–662` — عطّل بذر بيانات الدخول الافتراضية
4. `RoleLogin.jsx:602–621, 801–818` + `StaffPortal.jsx:268–284` — احذف مسارات منح الجلسة الذاتيّة
5. `FounderDashboard.jsx:3271–3278` — احذف الزر؛ أضف نقطة نهاية خادمية حقيقية

## المرحلة ٢ —Properly Authenticate (يومان)
6. أضف `AuthGuard` لكل بوابة من الـ5 (استبدل المعرّفات الاحتياطية `S-505` / `T-202` / `parent-default` بخطأ)
7. احذف `/student-portal` من `PUBLIC_PATHS`
8. أضف `school_id` لكل استعلام `.list()` في مجلد `portal/`
9. `dbClient.js:20` — رتّب الأولوية بحيث يتفوّق رمز المدير على رمز البوابة القديم

## المرحلة ٣ — إصلاح الواجهة (يومان)
10. `PlanAccessGuard.jsx:57–60` — أضف `setLoadingPlan(false)`
11. `App.jsx` — احذف المسارات المكرّرة 144–149
12. `RoleGate.jsx` — انقل فحص `isPublicPath` بعد المصادقة، أو افصل تسجيل التسجيل العام
13. `FounderDashboard.jsx` — نطّق مجدول الأسعار، أكمل `setShowAddPlan(true)`، احذف الميت
14. `BranchContext.jsx:40–43` — استخدم `String(b.id) === activeBranchId`
15. `query-client.js:14` — فعّل `refetchOnWindowFocus`

## المرحلة ٤ — التنظيف (يوم واحد)
16. احذف `ParentFinesTab.jsx` (غير مستخدم)
17. احذف كتلة التصحيح الميتة `api.js:3408–3409`، غطّي ما تبقّى بـ logger
18. احذف ~60 استيرادًا ميتًا
19. `npm run typecheck` ← صفر
20. احذف سكربتات التصحيح غير المتتبَّعة في جذر المستودع (`_check_*.mjs/cjs`، `matches.txt`، `*.log`)

---

# ملاحظات منهجية

- **لم يُعدَّل أي ملف.** شجرة العمل نظيفة.
- **مشكلة ترميز ضوضية:** التالف الظاهر في مخرجات `Select-String` هو **أثر ترميز الطرفية (console artifact)** — الملفات تحتوي العربية الصحيحة (تحقّقت عبر `read`).
- **نطاق التحقق:**
  - `npx eslint . --quiet` (~دقيقتان) → 1 خطأ تحليل + ~60 استيراد غير مستخدم
  - `npx tsc -p ./jsconfig.json` → 67 سطر خطأ
  - `npx vite build` (~50 ثانية) → ✅ نجاح
  - `npx esbuild <file> --outfile=nul.js` → أسرع فحص تركيب لملف مفرد
- `server/api.js` يستخدم مطابقة Node HTTP خام (`req.url ===`) لا Express router.
- `eslint.config.js` (71 سطرًا) يُفعّل `no-undef` + `react/jsx-no-undef` — لذلك Establishing hallazgos like "صفحة بلا حارس" احتاج grep لا lint.