import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

// ╔══════════════════════════════════════════════════════════════╗
// ║  🔘 مكوّن الأزرار (Button)                                  ║
// ║  للتعديل: غيّر الكلاسات داخل كل variant أو size            ║
// ╚══════════════════════════════════════════════════════════════╝

const buttonVariants = cva(
  // ─── الكلاسات المشتركة بين جميع الأزرار ───────────────────────
  // rounded-xl     ← انحناء زوايا الزر (xl = كبير، lg = متوسط، full = دائري)
  // text-sm        ← حجم خط الزر (xs=صغير, sm=عادي, base=كبير, lg=أكبر)
  // font-semibold  ← سماكة الخط (normal, medium, semibold, bold, extrabold)
  // gap-2          ← المسافة بين الأيقونة والنص داخل الزر
  "inline-flex items-center justify-center text-center gap-2 rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // ── الزر الرئيسي (الأزرق الداكن) ──────────────────────────
        // bg-primary       ← لون خلفية الزر (مرتبط بـ --primary في index.css)
        // text-white       ← لون نص الزر الرئيسي
        // shadow-md        ← حجم الظل (sm=خفيف, md=متوسط, lg=كبير, xl=أكبر)
        // hover:bg-primary/90 ← لون الخلفية عند المرور (90% = شفافية 10%)
        default:
          "bg-primary text-white shadow-md hover:bg-primary/90 hover:shadow-lg",

        // ── زر الحذف / الخطر (الأحمر) ─────────────────────────────
        // bg-rose-600      ← لون خلفية زر الحذف (rose-500=فاتح, rose-700=داكن)
        // hover:bg-rose-700 ← لون الحذف عند المرور
        destructive:
          "bg-rose-600 text-white shadow-sm hover:bg-rose-700",

        // ── زر مُحدَّد بإطار (outline) ────────────────────────────
        // border-2         ← سماكة الإطار (border=1px, border-2=2px, border-4=4px)
        // border-stone-300 ← لون الإطار (stone-200=فاتح, stone-400=داكن)
        // bg-white         ← خلفية الزر المحدد بإطار
        outline:
          "border-2 border-stone-300 bg-white shadow-sm hover:bg-stone-50 hover:border-stone-400 hover:shadow",

        // ── الزر الثانوي (رمادي فاتح) ─────────────────────────────
        // bg-stone-100     ← خلفية الزر الثانوي (stone-50=أفتح, stone-200=أغمق)
        // text-stone-800   ← لون نص الزر الثانوي
        secondary:
          "bg-stone-100 text-stone-800 shadow-sm hover:bg-stone-200",

        // ── زر شفاف (ghost) ───────────────────────────────────────
        // يظهر بدون خلفية ويأخذ خلفية رمادية عند المرور فقط
        ghost: "hover:bg-stone-100 hover:text-stone-900",

        // ── زر رابط (link) ────────────────────────────────────────
        // يبدو كرابط نصي مع خط سفلي عند المرور
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // ── الحجم الافتراضي ────────────────────────────────────────
        // h-11   ← ارتفاع الزر (h-8=صغير, h-10=متوسط, h-12=كبير, h-14=أكبر)
        // px-5   ← الحشوة الأفقية (px-3=ضيق, px-5=عادي, px-8=واسع)
        // w-full ← الزر يمتد لكامل عرض الحاوية (احذفه لزر بعرض المحتوى)
        default: "h-11 px-5 py-2 w-full",

        // ── حجم صغير ──────────────────────────────────────────────
        // h-9    ← ارتفاع مخفّض للزر الصغير
        // text-xs ← خط أصغر للزر الصغير
        sm: "h-9 rounded-lg px-3 text-xs w-full",

        // ── حجم كبير ──────────────────────────────────────────────
        // h-12   ← ارتفاع أكبر للزر الكبير
        // text-base ← خط أكبر للزر الكبير
        lg: "h-12 rounded-xl px-8 text-base w-full",

        // ── زر أيقونة مربّع ───────────────────────────────────────
        // h-11 w-11 ← زر مربع متساوي الأبعاد للأيقونات
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/** @type {any} */
const Button = React.forwardRef(
  /** @param {any} props */
  ({ className, variant = "default", size = "default", asChild = false, children, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  const isOutline = variant === "outline"
  const isGhost = variant === "ghost"
  const isSecondary = variant === "secondary"
  const isDestructive = variant === "destructive"
  const hasText = typeof children === 'string' || (Array.isArray(children) && children.some(c => typeof c === 'string'))
  
  const textColor = (isOutline || isGhost || isSecondary) ? "#1c1917" : "#ffffff"
  
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      style={{ color: textColor }}
      {...props}>
      {children}
    </Comp>)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
