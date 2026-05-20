import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  Book, 
  Search, 
  Filter, 
  Plus, 
  Bookmark, 
  User, 
  Layers,
  History,
  CheckCircle2,
  Clock,
  MoreVertical,
  Edit2,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import LibraryBookFormDialog from "@/components/shared/LibraryBookFormDialog";
import { toast } from "sonner";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed";

export default function Library() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  const { data: books = [], isLoading } = useQuery({ 
    queryKey: ["library-books"], 
    // @ts-ignore
    queryFn: () => base44.entities.LibraryBook.list("-created_at", {}, 50) 
  });

  const filteredBooks = books.filter(book => 
    book.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    book.author?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedBook(null);
    setDialogOpen(true);
  };

  const handleDelete = async (book) => {
    try {
      await base44.entities.LibraryBook.delete(book.id);
      toast.success(isRTL ? "تم حذف الكتاب" : "Book deleted");
    } catch (err) {
      toast.error(isRTL ? "فشل الحذف" : "Failed to delete");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  return (
    <div className="space-y-6 pb-20" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader 
        title={t("common.library", language)} 
        subtitle={isRTL ? "استكشف مجموعة واسعة من الكتب والموارد المعرفية" : "Explore a vast collection of books and knowledge resources"}
      >
        <div className="flex gap-3">
          <button className={`${btnOutline} h-11 px-5`}>
            <History size={18} />
            <span>{isRTL ? "سجل الاستعارة" : "Lending History"}</span>
          </button>
          <button onClick={handleAdd} className={`${btnPrimary} h-11 px-5`}>
            <Plus size={18} />
            <span>{isRTL ? "إضافة كتاب جديد" : "Add New Book"}</span>
          </button>
        </div>
      </PageHeader>

      {/* Library Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: isRTL ? "إجمالي الكتب" : "Total Books", value: books.length, icon: Book, color: "text-primary", bg: "bg-primary/10" },
          { label: isRTL ? "كتب مستعارة" : "Borrowed Books", value: 42, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
          { label: isRTL ? "الفئات" : "Categories", value: 15, icon: Layers, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((stat, i) => (
          <Card key={i} className="p-5 border shadow-sm bg-white rounded-xl flex items-center gap-5">
            <div className={`h-14 w-14 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-stone-400 text-[10px] font-semibold uppercase tracking-wide mb-0.5">{stat.label}</p>
              <h4 className="text-2xl font-bold text-stone-900 num-en">{stat.value}</h4>
            </div>
          </Card>
        ))}
      </div>

      {/* Search & Collection */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <Card className="flex-1 w-full p-2 border shadow-sm bg-white rounded-xl">
            <div className="relative">
              <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-stone-400`} size={18} />
              <Input 
                placeholder={isRTL ? "ابحث عن عنوان كتاب، مؤلف، أو تصنيف..." : "Search for book title, author, or category..."} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`h-12 ${isRTL ? 'pr-12' : 'pl-12'} border-none bg-transparent text-base font-medium focus-visible:ring-0`}
                dir={isRTL ? "rtl" : "ltr"}
              />
            </div>
          </Card>
          <div className="flex gap-2 w-full md:w-auto">
            <button className={`${btnOutline} h-12 px-5`}>
              <Filter size={18} />
              <span>{isRTL ? "تصفية" : "Filter"}</span>
            </button>
            <button className={`${btnOutline} h-12 px-5`}>
              <Bookmark size={18} />
              <span>{isRTL ? "المحفوظات" : "Saved"}</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="h-96 bg-stone-100 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredBooks.map((book) => (
                <motion.div
                  key={book.id}
                  layout
                  variants={{ hidden: { scale: 0.95, opacity: 0 }, visible: { scale: 1, opacity: 1 } }}
                  whileHover={{ y: -6 }}
                  className="group"
                >
                  <Card className="p-0 border shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl bg-white overflow-hidden h-full flex flex-col">
                    {/* Book Cover Placeholder */}
                    <div className="h-56 bg-gradient-to-br from-stone-100 to-stone-200 relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                      <div className="absolute inset-0 flex items-center justify-center text-stone-300">
                        <Book size={64} className="group-hover:scale-110 transition-transform duration-500 opacity-20" />
                      </div>
                      <div className={`absolute top-5 ${isRTL ? 'left-5' : 'right-5'} flex items-center gap-1.5 z-10`}>
                        <Badge className="bg-white/90 backdrop-blur-md text-stone-900 border-none rounded-lg font-bold text-[10px] px-2.5 py-1 shadow-md">
                          {book.subject_name || (isRTL ? "عام" : "General")}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="bg-white/90 hover:bg-white backdrop-blur-md text-stone-800 h-7 w-7 rounded-lg flex items-center justify-center shadow-md cursor-pointer transition-colors">
                              <MoreVertical size={13} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-32">
                            <DropdownMenuItem onClick={() => { setSelectedBook(book); setDialogOpen(true); }} className="flex items-center gap-2 cursor-pointer text-stone-700">
                              <Edit2 size={12} />
                              <span className="text-xs">{isRTL ? "تعديل" : "Edit"}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                if (confirm(isRTL ? "هل أنت متأكد من حذف هذا الكتاب؟" : "Are you sure you want to delete this book?")) {
                                  handleDelete(book);
                                }
                              }} 
                              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 size={12} />
                              <span className="text-xs">{isRTL ? "حذف" : "Delete"}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {book.status === 'available' && (
                        <div className={`absolute bottom-5 ${isRTL ? 'left-5' : 'right-5'} bg-emerald-500 text-white h-9 w-9 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30`}>
                          <CheckCircle2 size={18} />
                        </div>
                      )}
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      <h5 className="text-lg font-bold text-stone-900 mb-1.5 leading-tight group-hover:text-primary transition-colors">
                        {book.title}
                      </h5>
                      <div className="flex items-center gap-2 text-stone-400 mb-5">
                        <User size={14} />
                        <span className="text-xs font-semibold">{book.author || (isRTL ? "مؤلف مجهول" : "Unknown Author")}</span>
                      </div>

                      <div className="mt-auto space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wide">
                          <span className="text-stone-300">{isRTL ? "الموقع" : "Location"}</span>
                          <span className="text-stone-600 num-en">{book.location || 'A-12'}</span>
                        </div>
                        <div className="h-px bg-stone-100" />
                        <div className="flex gap-2">
                          <button className={`flex-1 ${btnPrimary.split(' ').filter(c => !c.includes('shadow')).join(' ')} h-11`}>
                            {isRTL ? "استعارة" : "Borrow"}
                          </button>
                          <button className={`${btnOutline} h-11 w-11 p-0`}>
                            <Bookmark size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      {filteredBooks.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-stone-300">
          <Book size={80} className="mb-5 opacity-5" />
          <h4 className="text-xl font-bold text-stone-400">{isRTL ? "لم نجد هذا الكتاب في مكتبتنا" : "Book not found in our library"}</h4>
          <p className="mt-2 text-stone-400">{isRTL ? "حاول البحث باستخدام اسم المؤلف أو الرقم التسلسلي." : "Try searching by author name or ISBN."}</p>
        </div>
      )}
      <LibraryBookFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} book={selectedBook} />
    </div>
  );
}
