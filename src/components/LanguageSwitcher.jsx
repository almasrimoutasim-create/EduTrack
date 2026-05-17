import React from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 rounded-xl border-2 border-stone-300 bg-white hover:bg-stone-50"
          title={language === 'en' ? 'English' : 'العربية'}
        >
          <Globe className="h-5 w-5" style={{ color: '#1c1917' }} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLanguage('en')} className={language === 'en' ? 'bg-accent' : ''}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage('ar')} className={language === 'ar' ? 'bg-accent' : ''}>
          العربية
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
