import React from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages, ChevronDown } from 'lucide-react';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="h-10 px-3.5 rounded-xl border-2 border-stone-200 bg-white hover:bg-stone-50 hover:border-stone-400 flex items-center gap-2 text-stone-800 text-xs font-bold shadow-sm cursor-pointer transition-all"
          title={language === 'en' ? 'Switch Language' : 'تغيير اللغة'}
        >
          <Languages className="h-4 w-4 text-stone-500 shrink-0" />
          <span>{language === 'en' ? 'English' : 'العربية'}</span>
          <ChevronDown className="h-3 w-3 text-stone-400 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl border-stone-150 p-1 shadow-lg">
        <DropdownMenuItem 
          onClick={() => setLanguage('en')} 
          className={`rounded-lg text-xs font-bold cursor-pointer py-2 px-3 ${language === 'en' ? 'bg-stone-100 text-stone-900' : 'text-stone-600'}`}
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setLanguage('ar')} 
          className={`rounded-lg text-xs font-bold cursor-pointer py-2 px-3 ${language === 'ar' ? 'bg-stone-100 text-stone-900' : 'text-stone-600'}`}
        >
          العربية
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
