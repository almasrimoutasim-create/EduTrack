import React from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  Layout, 
  Palette, 
  Globe, 
  Zap, 
  ShieldCheck,
  ArrowRight,
  Star,
  TrendingUp
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-2xl shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";
const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer shadow-xl disabled:opacity-50 disabled:cursor-not-allowed";

export default function ArabicShowcase() {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="space-y-24 pb-48 overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
      {/* Hero Section */}
      <section className="relative pt-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-primary/10 to-transparent blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 text-center space-y-10 max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex justify-center"
          >
            <Badge variant="default" className="bg-white/50 backdrop-blur-xl border border-stone-200 text-stone-900 rounded-full px-6 py-2 font-black text-xs uppercase tracking-[0.2em] shadow-xl">
              <Sparkles className="mr-2 text-primary animate-pulse" size={14} />
              {isRTL ? "نظام التصميم الجديد" : "New Design System"}
            </Badge>
          </motion.div>

          <motion.h1 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-7xl md:text-8xl font-serif font-black text-stone-900 leading-tight"
          >
            {isRTL ? "فن التعليم بلغة" : "The Art of Education in"} <span className="text-primary italic">{isRTL ? "عصرية" : "Arabic"}</span>
          </motion.h1>

          <motion.p 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-stone-500 leading-relaxed max-w-2xl mx-auto font-medium"
          >
            {isRTL ? "نقدم لكم التجربة الجديدة كلياً لـ EduTrack. واجهة فاخرة، دعم كامل للغة العربية، وتجربة مستخدم لا تضاهى." : "Introducing the all-new EduTrack experience. Premium interface, full Arabic support, and an unparalleled user experience."}
          </motion.p>

          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col md:flex-row justify-center gap-6"
          >
            <button className={`${btnPrimary} h-16 px-10 text-lg`}>
              {isRTL ? "ابدأ جولتك الآن" : "Start the Tour"}
              <ArrowRight className={`ml-2 group-hover:translate-x-2 transition-transform ${isRTL ? 'rotate-180' : ''}`} size={20} />
            </button>
            <button className={`${btnOutline} h-16 px-10 text-lg`}>
              {isRTL ? "مشاهدة الفيديو" : "Watch Demo"}
            </button>
          </motion.div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
        {[
          { title: isRTL ? "أناقة بصرية" : "Visual Elegance", desc: isRTL ? "استخدام خطوط Cairo و Amiri لتعزيز الهوية العربية." : "Using Cairo and Amiri fonts to enhance Arabic identity.", icon: Palette },
          { title: isRTL ? "تفاعل سلس" : "Smooth Interaction", desc: isRTL ? "رسوم متحركة هادئة بفضل Framer Motion." : "Calm animations thanks to Framer Motion.", icon: Zap },
          { title: isRTL ? "ذكاء التصميم" : "Design Intelligence", desc: isRTL ? "توزيع العناصر بدقة RTL لتجربة فطرية." : "Precise RTL layout for an intuitive experience.", icon: Layout },
        ].map((item, i) => (
          <motion.div 
            key={i}
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="group"
          >
            <Card className="p-10 border-none shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[48px] bg-white h-full">
              <div className="h-16 w-16 rounded-[24px] bg-stone-50 text-stone-900 flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                <item.icon size={32} />
              </div>
              <h3 className="text-2xl font-serif font-black text-stone-900 mb-4">{item.title}</h3>
              <p className="text-stone-500 leading-relaxed font-medium">{item.desc}</p>
            </Card>
          </motion.div>
        ))}
      </section>

      {/* Component Showcase */}
      <section className="bg-stone-50 py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-serif font-black text-stone-900">{isRTL ? "مكونات فاخرة" : "Premium Components"}</h2>
            <p className="text-stone-400 font-bold uppercase tracking-widest">{isRTL ? "مصممة بعناية فائقة" : "Crafted with meticulous detail"}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
            {/* Sample Widgets */}
            <div className="space-y-10">
              <Card className="p-8 border-none shadow-2xl rounded-[48px] bg-white relative group overflow-hidden">
                <div className="flex justify-between items-start mb-10">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Star size={28} />
                  </div>
                  <Badge variant="default" className="bg-emerald-500 text-white border-none rounded-lg px-2 py-0.5 text-[8px] font-black uppercase">Active</Badge>
                </div>
                <h4 className="text-3xl font-serif font-black text-stone-900 mb-2">{isRTL ? "البطاقة الذكية" : "Smart Widget"}</h4>
                <p className="text-stone-400 text-sm mb-10 font-medium">{isRTL ? "تفاعل مع البيانات بلمسة عصرية وشعور بالفخامة." : "Interact with data with a modern touch and a premium feel."}</p>
                <div className="flex items-center gap-4 pt-8 border-t border-stone-50">
                   <div className="flex -space-x-3 rtl:space-x-reverse">
                      {[1,2,3,4].map(i => <div key={i} className="h-10 w-10 rounded-full border-4 border-white bg-stone-100 shadow-sm" />)}
                   </div>
                   <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "١٢٠+ طالباً" : "120+ Students"}</span>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-6">
                <Card className="p-8 border-none shadow-xl rounded-[40px] bg-stone-900 text-white">
                  <ShieldCheck size={32} className="text-emerald-400 mb-6" />
                  <h5 className="text-lg font-bold mb-2">{isRTL ? "أمن مطلق" : "Total Security"}</h5>
                  <p className="text-stone-400 text-xs leading-relaxed font-medium">{isRTL ? "حماية فائقة لبياناتك." : "High protection for your data."}</p>
                </Card>
                <Card className="p-8 border-none shadow-xl rounded-[40px] bg-white">
                  <TrendingUp size={32} className="text-indigo-600 mb-6" />
                  <h5 className="text-lg font-bold text-stone-900 mb-2">{isRTL ? "تحليل دقيق" : "Data Insights"}</h5>
                  <p className="text-stone-400 text-xs leading-relaxed font-medium">{isRTL ? "تقارير ذكية فورية." : "Instant smart reports."}</p>
                </Card>
              </div>
            </div>

            {/* Design Tokens */}
            <div className="space-y-12">
              <div className="space-y-8">
                <h4 className="text-2xl font-serif font-black text-stone-900">{isRTL ? "نظام الألوان" : "Color System"}</h4>
                <div className="flex flex-wrap gap-4">
                  {[
                    { name: "Primary", hex: "#D4AF37", bg: "bg-primary" },
                    { name: "Ink", hex: "#1C1917", bg: "bg-stone-900" },
                    { name: "Paper", hex: "#FAFAF9", bg: "bg-stone-50" },
                    { name: "Emerald", hex: "#10B981", bg: "bg-emerald-500" },
                    { name: "Indigo", hex: "#4F46E5", bg: "bg-indigo-600" },
                  ].map((color, i) => (
                    <div key={i} className="flex flex-col items-center gap-3">
                      <div className={`h-20 w-20 rounded-3xl ${color.bg} shadow-lg ring-4 ring-white transition-transform hover:scale-110`} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">{color.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-8">
                <h4 className="text-2xl font-serif font-black text-stone-900">{isRTL ? "الخطوط العربية" : "Arabic Typography"}</h4>
                <div className="space-y-6">
                  <div className="p-8 bg-white rounded-[32px] shadow-sm border border-stone-100">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4">Cairo (Sans-Serif)</p>
                    <p className="text-3xl font-black text-stone-900 font-sans">هذا النص مكتوب بخط كايرو العصري</p>
                  </div>
                  <div className="p-8 bg-white rounded-[32px] shadow-sm border border-stone-100">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4">Amiri (Serif)</p>
                    <p className="text-4xl font-black text-stone-900 font-serif">هذا النص مكتوب بخط أميري الفاخر</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="p-16 bg-stone-900 text-white rounded-[60px] shadow-2xl relative overflow-hidden group"
        >
          <div className="relative z-10 space-y-10">
            <h2 className="text-5xl md:text-6xl font-serif font-black leading-tight">
              {isRTL ? "هل أنت مستعد لتجربة" : "Ready to Experience"} <br/> <span className="text-primary italic">{isRTL ? "المستقبل؟" : "The Future?"}</span>
            </h2>
            <p className="text-stone-400 text-lg max-w-xl mx-auto font-medium">
              {isRTL ? "انضم إلى الآلاف من المؤسسات التعليمية التي اختارت التميز والابتكار." : "Join thousands of educational institutions that have chosen excellence and innovation."}
            </p>
            <button className="bg-primary hover:bg-primary/90 text-stone-900 rounded-full h-16 px-12 text-xl font-bold shadow-2xl shadow-primary/20 cursor-pointer">
              {isRTL ? "ابدأ الآن مجاناً" : "Get Started Free"}
            </button>
          </div>
          <div className="absolute top-0 right-0 p-20 opacity-10 group-hover:scale-110 transition-transform duration-1000">
            <Globe size={300} />
          </div>
        </motion.div>
      </section>
    </div>
  );
}
