/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { HelpCircle } from "lucide-react";

interface FormTooltipProps {
  content: string;
}

export default function FormTooltip({ content }: FormTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span 
      className="relative inline-flex items-center align-middle"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        className="text-slate-400 hover:text-amber-500 transition-colors focus:outline-none p-0.5 cursor-pointer"
        aria-label="مساعدة"
      >
        <HelpCircle className="w-3.5 h-3.5 stroke-[1.8]" />
      </button>

      {isOpen && (
        <span className="absolute bottom-full mb-2 right-1/2 translate-x-1/2 z-[100] w-56 rounded-xl bg-slate-900 dark:bg-slate-950 border border-slate-700/80 dark:border-slate-800 p-2.5 text-[10px] font-bold text-slate-200 leading-relaxed shadow-2xl text-right animate-in fade-in zoom-in-95 duration-100 pointer-events-none">
          {content}
          <span className="absolute top-full right-1/2 translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-slate-950"></span>
        </span>
      )}
    </span>
  );
}
