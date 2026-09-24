'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Globe, ChevronDown, Check } from 'lucide-react';

export const LOCALES = [
  { code: 'en', label: 'English', flag: '🇺🇸', short: 'EN' },
  { code: 'es', label: 'Español', flag: '🇪🇸', short: 'ES' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳', short: 'HI' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', short: 'FR' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', short: 'DE' },
];

export default function LanguageSwitcher() {
  const currentLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = LOCALES.find((l) => l.code === currentLocale) || LOCALES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocaleChange = (newLocale: string) => {
    setIsOpen(false);
    if (newLocale === currentLocale) return;

    // Construct new pathname with updated locale prefix
    let newPath = pathname;
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length > 0 && LOCALES.some((l) => l.code === segments[0])) {
      // Current path has locale prefix, e.g. /es/analytics
      segments[0] = newLocale;
      newPath = '/' + segments.join('/');
    } else {
      // Path has no locale prefix, e.g. /analytics
      newPath = `/${newLocale}${pathname === '/' ? '' : pathname}`;
    }

    router.push(newPath);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium bg-slate-900 border border-slate-700/80 text-slate-200 hover:text-white hover:bg-slate-800/80 hover:border-slate-600 transition shadow-sm"
      >
        <Globe className="h-4 w-4 text-blue-400" />
        <span className="text-base leading-none">{currentLang.flag}</span>
        <span className="font-mono text-xs text-slate-300">{currentLang.short}</span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-2xl bg-slate-900 border border-slate-800 ring-1 ring-black/5 divide-y divide-slate-800 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
          <div className="py-1.5" role="menu">
            <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 font-mono tracking-wider uppercase">
              Select Language
            </div>
            {LOCALES.map((locale) => {
              const isActive = locale.code === currentLocale;
              return (
                <button
                  key={locale.code}
                  onClick={() => handleLocaleChange(locale.code)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-sm text-left transition ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-300 font-medium'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                  role="menuitem"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-lg leading-none">{locale.flag}</span>
                    <span>{locale.label}</span>
                  </div>
                  {isActive && <Check className="h-4 w-4 text-blue-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
