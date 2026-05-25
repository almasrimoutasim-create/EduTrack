import * as React from "react"
import Datepicker from "react-tailwindcss-datepicker"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

// A robust Error Boundary to ensure that if the third-party datepicker fails
// due to environment, package resolution, or runtime mismatch, it falls back
// gracefully to a standard styled HTML date input, preventing a "white screen of death" crash.
class DatePickerErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("DatePicker component crashed. Falling back to native date input.", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { value, onChange, className, disabled, placeholder } = this.props;
      return (
        <div className={cn("relative w-full", className)} dir="rtl">
          <input
            type="date"
            value={value || ""}
            onChange={(e) => onChange && onChange(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl h-11 px-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all text-right"
          />
        </div>
      );
    }

    return this.props.children;
  }
}

// 1. Full Date Picker Component (based on react-tailwindcss-datepicker)
export function DatePicker(props) {
  const { value, onChange, className, disabled, placeholder = "اختر تاريخاً" } = props;
  
  // Format the date properly for react-tailwindcss-datepicker.
  // It expects { startDate, endDate }, which can be strings (YYYY-MM-DD), Date objects, or null.
  const val = value ? { startDate: value, endDate: value } : { startDate: null, endDate: null };

  const handleChange = (newValue) => {
    if (onChange) {
      // Pass the selected ISO-like date string back to the parent form (e.g. "2026-05-25")
      onChange(newValue?.startDate || "");
    }
  };

  return (
    <DatePickerErrorBoundary {...props}>
      <div className={cn("relative w-full", className)} dir="rtl">
        <Datepicker
          useRange={false}
          asSingle={true}
          value={val}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          i18n="ar"
          displayFormat={"YYYY-MM-DD"}
          inputClassName="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl h-11 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all rtl:pr-10 ltr:pl-10 text-right"
          toggleClassName="absolute right-0 h-full px-3 text-stone-400 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
        />
      </div>
    </DatePickerErrorBoundary>
  )
}

// 2. Month & Year Picker Component (built using Popover and customized grid layout)
// Designed to replace native <input type="month" /> with a beautiful premium layout.
// Expects and returns string values in format "YYYY-MM" (e.g. "2026-05").
export function MonthPicker({ value, onChange, className, disabled, placeholder = "اختر شهراً وسنة" }) {
  const [isOpen, setIsOpen] = React.useState(false);
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-indexed

  let initialYear = currentYear;
  let initialMonth = null;

  if (value && typeof value === "string") {
    const parts = value.split("-");
    if (parts.length === 2) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(y)) initialYear = y;
      if (!isNaN(m)) initialMonth = m;
    }
  }

  const [visibleYear, setVisibleYear] = React.useState(initialYear);

  // Sync visibleYear if value changes from outside
  React.useEffect(() => {
    if (value && typeof value === "string") {
      const parts = value.split("-");
      if (parts.length === 2) {
        const y = parseInt(parts[0], 10);
        if (!isNaN(y)) {
          setVisibleYear(y);
        }
      }
    }
  }, [value]);

  const monthsAr = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

  const handlePrevYear = (e) => {
    e.stopPropagation();
    setVisibleYear(prev => prev - 1);
  };

  const handleNextYear = (e) => {
    e.stopPropagation();
    setVisibleYear(prev => prev + 1);
  };

  const handleMonthSelect = (monthIndex) => {
    const mStr = String(monthIndex).padStart(2, "0");
    const newValue = `${visibleYear}-${mStr}`;
    if (onChange) {
      onChange(newValue);
    }
    setIsOpen(false);
  };

  const formattedValue = initialMonth 
    ? `${monthsAr[initialMonth - 1]} ${visibleYear}` 
    : "";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "relative flex items-center justify-between w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl h-11 px-3 text-sm font-semibold text-stone-700 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-right shadow-sm hover:bg-stone-50/50 cursor-pointer",
            className
          )}
        >
          <span className="flex-1 text-right">
            {formattedValue || placeholder}
          </span>
          <CalendarIcon className="h-4 w-4 text-stone-400 mr-2 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl z-[200]" align="end">
        <div className="flex items-center justify-between mb-4 border-b border-stone-100 dark:border-stone-800 pb-2">
          <button
            type="button"
            onClick={handlePrevYear}
            className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg text-stone-500 dark:text-stone-400 transition-colors cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" /> {/* Swapped for RTL: prev is right, next is left */}
          </button>
          <span className="text-sm font-black text-stone-800 dark:text-stone-100 num-en">
            {visibleYear}
          </span>
          <button
            type="button"
            onClick={handleNextYear}
            className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg text-stone-500 dark:text-stone-400 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" /> {/* Swapped for RTL: prev is right, next is left */}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {monthsAr.map((monthName, idx) => {
            const monthNum = idx + 1;
            const isSelected = initialYear === visibleYear && initialMonth === monthNum;
            const isCurrent = currentYear === visibleYear && currentMonth === monthNum;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleMonthSelect(monthNum)}
                className={cn(
                  "py-2 px-1 text-xs font-bold rounded-xl transition-all text-center cursor-pointer",
                  isSelected
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : isCurrent
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
                )}
              >
                {monthName}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
