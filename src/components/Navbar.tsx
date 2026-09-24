'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  Zap,
  BarChart3,
  Target,
  PhoneCall,
  ShieldCheck,
  Menu,
  X,
  LogIn,
  LogOut,
  User,
} from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('Nav');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data?.user) {
            setUser(data.data.user);
          }
        }
      } catch {
        setUser(null);
      } finally {
        setAuthChecked(true);
      }
    }
    checkAuth();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.href = `/${locale}/login`;
    } catch {
      window.location.href = `/${locale}/login`;
    }
  };

  const navLinks = [
    {
      href: `/${locale}`,
      label: t('home'),
      icon: Zap,
    },
    {
      href: `/${locale}/analytics`,
      label: t('analytics'),
      icon: BarChart3,
    },
    {
      href: `/${locale}/leads`,
      label: t('leads'),
      icon: Target,
    },
    {
      href: `/${locale}/voice`,
      label: t('voice'),
      icon: PhoneCall,
    },
    {
      href: `/${locale}/admin`,
      label: t('admin'),
      icon: ShieldCheck,
      badge: 'Superadmin',
    },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}` || href === `/`) {
      return pathname === href || pathname === `/${locale}`;
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <Link href={`/${locale}`} className="flex items-center space-x-2.5 group">
              <div className="bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-2 rounded-xl shadow-lg shadow-blue-500/20 group-hover:scale-105 transition">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent">
                LeadPoint AI
              </span>
            </Link>
            <span className="hidden sm:inline-flex text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-semibold">
              ENTERPRISE
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                    active
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-md">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions & Auth / Language Switcher */}
          <div className="flex items-center space-x-3">
            <LanguageSwitcher />

            {authChecked && (
              <>
                {user ? (
                  <div className="hidden sm:flex items-center space-x-3 pl-2 border-l border-slate-800">
                    <div className="flex items-center space-x-2 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                      <User className="h-3.5 w-3.5 text-blue-400" />
                      <span className="font-semibold text-white max-w-[120px] truncate">{user.name}</span>
                      <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-slate-400 uppercase">
                        {user.role}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold transition"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-slate-800">
                    <Link
                      href={`/${locale}/login`}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition"
                    >
                      <LogIn className="h-3.5 w-3.5 text-blue-400" />
                      <span>Sign In</span>
                    </Link>
                    <Link
                      href={`/${locale}/register`}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md transition"
                    >
                      <span>Register</span>
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2 animate-in slide-in-from-top-2 duration-150">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                  active
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-2 border-t border-slate-800/80">
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out ({user.name})</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/${locale}/login`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm font-medium"
                >
                  <LogIn className="h-4 w-4 text-blue-400" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href={`/${locale}/register`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium"
                >
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
