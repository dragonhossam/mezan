/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Shield, ShieldAlert, ShieldCheck, Check } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password?: string;
  email?: string;
}

export default function PasswordStrengthIndicator({ password = "", email = "" }: PasswordStrengthIndicatorProps) {
  if (!password) {
    return null;
  }

  // Calculate score (0-4)
  let score = 0;
  
  // Criteria checks
  const hasLength = password.length >= 8;
  const hasMixed = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (hasLength) score++;
  if (hasMixed) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;

  // Policy validation checks (matching validatePasswordPolicy rules in auth.ts)
  const pLower = password.toLowerCase();
  const identity = email ? email.trim().toLowerCase() : "";
  const blocklist = ["admin", "1234", "password", "123456", "12345678", "123456789", "qwerty", "12345"];
  
  let isPolicyViolated = false;
  let violationReason = "";

  if (identity && (pLower === identity || identity.includes(pLower) || pLower.includes(identity))) {
    isPolicyViolated = true;
    violationReason = "مطابقة لاسم الحساب أو البريد";
  }

  if (!isPolicyViolated && identity && identity.includes("@")) {
    const prefix = identity.split("@")[0];
    if (prefix && (pLower === prefix || prefix.includes(pLower) || pLower.includes(prefix))) {
      isPolicyViolated = true;
      violationReason = "مشابهة للبريد الإلكتروني";
    }
  }

  if (!isPolicyViolated && blocklist.some(weak => pLower.includes(weak) || weak.includes(pLower))) {
    isPolicyViolated = true;
    violationReason = "كلمة مرور شائعة وسهلة التخمين";
  }

  // If policy is violated, limit maximum score to 1 to show it's insecure
  if (isPolicyViolated) {
    score = Math.min(score, 1);
  }

  // Get color and text based on score and policy violation
  let strengthLabel = "";
  let barColor = "bg-slate-700";
  let textColor = "text-slate-400";
  let activeBars = 0;

  if (isPolicyViolated) {
    strengthLabel = `غير آمن (${violationReason})`;
    barColor = "bg-red-500/80";
    textColor = "text-red-400 font-bold";
    activeBars = 1;
  } else {
    switch (score) {
      case 0:
        strengthLabel = "ضعيف جداً";
        barColor = "bg-red-500";
        textColor = "text-red-500";
        activeBars = 1;
        break;
      case 1:
        strengthLabel = "ضعيف";
        barColor = "bg-rose-500";
        textColor = "text-rose-400";
        activeBars = 1;
        break;
      case 2:
        strengthLabel = "متوسط";
        barColor = "bg-amber-500";
        textColor = "text-amber-400";
        activeBars = 2;
        break;
      case 3:
        strengthLabel = "قوي";
        barColor = "bg-teal-500";
        textColor = "text-teal-400";
        activeBars = 3;
        break;
      case 4:
        strengthLabel = "قوي جداً وآمن";
        barColor = "bg-emerald-500";
        textColor = "text-emerald-400";
        activeBars = 4;
        break;
    }
  }

  return (
    <div className="space-y-2 mt-2 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-right">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 font-bold">مستوى قوة كلمة المرور:</span>
        <span className={`font-black ${textColor} flex items-center gap-1.5`}>
          {isPolicyViolated ? (
            <ShieldAlert className="w-4 h-4 text-red-500" />
          ) : score >= 3 ? (
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          ) : (
            <Shield className="w-4 h-4 text-amber-500" />
          )}
          <span>{strengthLabel}</span>
        </span>
      </div>

      {/* Segmented Strength Bar */}
      <div className="grid grid-cols-4 gap-2 h-1.5">
        {[1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className={`h-full rounded-full transition-all duration-300 ${
              index <= activeBars ? barColor : "bg-slate-800"
            }`}
          />
        ))}
      </div>

      {/* Guidelines checklist */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-slate-800/40 text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5 justify-start">
          {hasLength ? (
            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          ) : (
            <div className="w-3.5 h-3.5 border border-slate-700 rounded-full flex items-center justify-center text-slate-600 shrink-0">
              <span className="block w-1.5 h-1.5 rounded-full bg-slate-700" />
            </div>
          )}
          <span className={hasLength ? "text-slate-200 font-bold" : ""}>8 خانات أو أكثر</span>
        </div>

        <div className="flex items-center gap-1.5 justify-start">
          {hasMixed ? (
            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          ) : (
            <div className="w-3.5 h-3.5 border border-slate-700 rounded-full flex items-center justify-center text-slate-600 shrink-0">
              <span className="block w-1.5 h-1.5 rounded-full bg-slate-700" />
            </div>
          )}
          <span className={hasMixed ? "text-slate-200 font-bold" : ""}>حروف كبيرة وصغيرة</span>
        </div>

        <div className="flex items-center gap-1.5 justify-start">
          {hasNumber ? (
            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          ) : (
            <div className="w-3.5 h-3.5 border border-slate-700 rounded-full flex items-center justify-center text-slate-600 shrink-0">
              <span className="block w-1.5 h-1.5 rounded-full bg-slate-700" />
            </div>
          )}
          <span className={hasNumber ? "text-slate-200 font-bold" : ""}>يحتوي على أرقام</span>
        </div>

        <div className="flex items-center gap-1.5 justify-start">
          {hasSpecial ? (
            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          ) : (
            <div className="w-3.5 h-3.5 border border-slate-700 rounded-full flex items-center justify-center text-slate-600 shrink-0">
              <span className="block w-1.5 h-1.5 rounded-full bg-slate-700" />
            </div>
          )}
          <span className={hasSpecial ? "text-slate-200 font-bold" : ""}>رموز خاصة (!@#$)</span>
        </div>
      </div>
    </div>
  );
}
