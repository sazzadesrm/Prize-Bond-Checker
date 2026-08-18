import React from 'react';
import logoImg from '../assets/images/bd_gov_seal_1787076307064.jpg';

interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  lang?: 'en' | 'bn';
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  className = '',
  showText = false,
  lang = 'bn'
}) => {
  const sizeMap = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <div
        className={`relative ${sizeMap[size]} rounded-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 p-0.5 shadow-sm overflow-hidden flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200`}
      >
        <img
          src={logoImg}
          alt="Government of Bangladesh Seal Logo"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-screen dark:brightness-105"
        />
      </div>

      {showText && (
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
              {lang === 'bn' ? 'প্রাইজবন্ড চেকার' : 'Prize Bond Checker'}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {lang === 'bn' ? '১০০ ৳' : '100 Tk.'}
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {lang === 'bn' ? 'সরকারি ড্র ফলাফল ও পোর্টফোলিও' : 'Official Draw Result Verifier'}
          </p>
        </div>
      )}
    </div>
  );
};

