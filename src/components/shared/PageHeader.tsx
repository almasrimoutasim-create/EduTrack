import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

/**
 * @param {{ title: string, subtitle?: string, children?: React.ReactNode, className?: string }} props
 */
export default function PageHeader({ title, subtitle = null, children = null, className = "" }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10", className)}
    >
      <div className="relative">
        <div className="absolute -left-4 rtl:left-auto rtl:-right-4 top-0 bottom-0 w-1 bg-primary/20 rounded-full hidden md:block" />
        <h1 className="font-display text-3xl md:text-4xl font-black text-foreground tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground mt-2 text-sm md:text-base font-medium opacity-80">
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3 flex-wrap"
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}