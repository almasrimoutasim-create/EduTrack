import * as React from "react"

import { cn } from "@/lib/utils"

// ╔══════════════════════════════════════════════════════════════╗
// ║  🃏 مكوّن الكروت (Card)                                      ║
// ║  يُستخدم في كل بطاقات المنصة (إحصائيات, بيانات, الخ...)    ║
// ╚══════════════════════════════════════════════════════════════╝

/** @type {any} */
const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    // ─── تنسيق الكارت الأساسي ───────────────────────────────────
    // rounded-xl        ← انحناء زوايا الكارت (sm=خفيف, xl=واضح, 2xl=أكثر)
    // border            ← إظهار حد الكارت (احذفه لإزالة الحد)
    // bg-card           ← خلفية الكارت (مرتبط بـ --card في index.css)
    // text-card-foreground ← لون النص داخل الكارت (--card-foreground)
    // shadow            ← ظل الكارت (shadow-none=بدون, shadow=خفيف, shadow-lg=قوي)
    // ⚠️ لا توسيط: المحاذاة تبدأ من اليمين (RTL Start) — معيار التسلسل الهرمي البصري
    className={cn("rounded-xl border bg-card text-card-foreground shadow flex flex-col", className)}
    {...props} />
))
Card.displayName = "Card"

/** @type {any} */
const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    // ─── رأس الكارت ─────────────────────────────────────────────
    // p-6  ← الحشوة الداخلية لرأس الكارت (p-4=أضيق, p-8=أوسع)
    // space-y-1.5 ← المسافة بين عناصر الرأس عمودياً
    // items-start ← محاذاة عناصر الرأس من البداية (يمين في RTL)
    className={cn("flex flex-col space-y-1.5 p-6 items-start", className)}
    {...props} />
))
CardHeader.displayName = "CardHeader"

/** @type {any} */
const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    // ─── عنوان الكارت ───────────────────────────────────────────
    // font-semibold ← سماكة خط عنوان الكارت (medium, semibold, bold, extrabold)
    // leading-none  ← المسافة بين السطور (none=مضغوط, tight, normal, loose)
    // text-right    ← محاذاة يمين لعنوان الكارت (RTL)
    // w-full        ← يمتد لكامل العرض لضمان محاذاة صحيحة
    className={cn("font-semibold leading-none tracking-tight text-right w-full", className)}
    {...props} />
))
CardTitle.displayName = "CardTitle"

/** @type {any} */
const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    // ─── وصف / نص ثانوي في الكارت ──────────────────────────────
    // text-sm           ← حجم خط الوصف (xs=أصغر, sm=عادي, base=أكبر)
    // text-muted-foreground ← لون النص الخافت (--muted-foreground في index.css)
    // text-right        ← أي نص متعدد الأسطر يجب أن يكون محاذياً لليمين
    // w-full            ← يمتد لكامل العرض
    className={cn("text-sm text-muted-foreground text-right w-full", className)}
    {...props} />
))
CardDescription.displayName = "CardDescription"

/** @type {any} */
const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    // ─── محتوى الكارت ───────────────────────────────────────────
    // p-6   ← الحشوة الداخلية للمحتوى (p-4=أضيق, p-8=أوسع)
    // pt-0  ← لا حشوة علوية (لأن CardHeader يحتل الجزء العلوي)
    className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

/** @type {any} */
const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    // ─── ذيل / تذييل الكارت ─────────────────────────────────────
    // p-6   ← الحشوة الداخلية للتذييل
    // pt-0  ← لا حشوة علوية
    className={cn("flex items-center p-6 pt-0", className)}
    {...props} />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
