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
        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#E6F0FA]/85 hover:bg-[#E6F0FA] border border-[#5C1D3A]/20 text-[#0F0F12] backdrop-blur-md transition-all shadow-glass-sm hover:border-[#5C1D3A]/35"
        aria-label="Switch Language"
        aria-expanded={isOpen}
      >
        <Globe className="h-3.5 w-3.5 text-[#E5C158]" />
        <span className="text-sm leading-none">{currentLang.flag}</span>
        <span className="font-semibold text-[#0F0F12]">{currentLang.short}</span>
        <ChevronDown className="h-3 w-3 text-[#64748B]" />
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-2xl shadow-glass-md bg-[#E6F0FA]/95 backdrop-blur-xl border border-[#5C1D3A]/20 divide-y divide-[#5C1D3A]/10 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
          <div className="py-1.5 px-1" role="menu">
            <div className="px-3 py-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
              Language
            </div>
            {LOCALES.map((locale) => {
              const isActive = locale.code === currentLocale;
              return (
                <button
                  key={locale.code}
                  onClick={() => handleLocaleChange(locale.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-[#F2F0FF] text-[#0F0F12] font-bold border border-[#5C1D3A]/15 shadow-xs'
                      : 'text-[#475569] hover:bg-[#F2F0FF]/60 hover:text-[#0F0F12]'
                  }`}
                  role="menuitem"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-base leading-none">{locale.flag}</span>
                    <span>{locale.label}</span>
                  </div>
                  {isActive && <Check className="h-3.5 w-3.5 text-[#E5C158]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
