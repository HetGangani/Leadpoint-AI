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
  Building2,
} from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  companyName?: string;
}

export default function Navbar() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('Nav');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data?.user) {
            setUser({
              ...data.data.user,
              companyName: data.data.companyProfile?.name,
            });
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
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

  interface NavItem {
    href: string;
    label: string;
    icon: any;
    requiresAuth: boolean;
    badge?: string;
    adminOnly?: boolean;
  }

  // Base links visible to all authenticated users
  const baseNavLinks: NavItem[] = [
    {
      href: `/${locale}`,
      label: t('home'),
      icon: Zap,
      requiresAuth: false,
    },
    {
      href: `/${locale}/analytics`,
      label: t('analytics'),
      icon: BarChart3,
      requiresAuth: true,
    },
    {
      href: `/${locale}/leads`,
      label: t('leads'),
      icon: Target,
      requiresAuth: true,
    },
    {
      href: `/${locale}/voice`,
      label: t('voice'),
      icon: PhoneCall,
      requiresAuth: true,
    },
  ];

  // Admin-only link (strictly visible to ADMIN role)
  const adminNavLink: NavItem = {
    href: `/${locale}/admin`,
    label: t('admin'),
    icon: ShieldCheck,
    badge: 'Superadmin',
    requiresAuth: true,
    adminOnly: true,
  };

  const navLinks: NavItem[] = [
    ...baseNavLinks,
    ...(user?.role === 'ADMIN' ? [adminNavLink] : []),
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}` || href === `/`) {
      return pathname === href || pathname === `/${locale}`;
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <Link href={`/${locale}`} className="flex items-center space-x-2.5 group">
              <div className="bg-indigo-600 text-white p-2 rounded-lg shadow-sm group-hover:bg-indigo-700 transition">
                <Zap className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900">
                LeadPoint <span className="text-indigo-600">AI</span>
              </span>
            </Link>
            <span className="hidden sm:inline-flex text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md">
              B2B Sales Intelligence
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    active
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-indigo-600' : 'text-slate-500'}`} />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="text-[10px] font-semibold uppercase bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded">
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
                  <div className="hidden sm:flex items-center space-x-3 pl-3 border-l border-slate-200">
                    <div className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      {user.companyName ? (
                        <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                      ) : (
                        <User className="h-3.5 w-3.5 text-indigo-600" />
                      )}
                      <div className="flex flex-col text-left">
                        <span className="font-semibold text-slate-800 max-w-[130px] truncate leading-tight">
                          {user.name}
                        </span>
                        {user.companyName && (
                          <span className="text-[10px] text-slate-500 truncate max-w-[130px] leading-tight">
                            {user.companyName}
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase ${
                        user.role === 'ADMIN'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold transition"
                      aria-label="Sign Out"
                    >
                      <LogOut className="h-3.5 w-3.5 text-slate-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="hidden sm:flex items-center space-x-2 pl-3 border-l border-slate-200">
                    <Link
                      href={`/${locale}/login`}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                    >
                      <LogIn className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Sign In</span>
                    </Link>
                    <Link
                      href={`/${locale}/register`}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
                    >
                      <span>Get Started</span>
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-1.5 shadow-md">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                  active
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="text-[10px] font-semibold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-3 border-t border-slate-200 mt-2">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg text-xs">
                  <div>
                    <div className="font-semibold text-slate-800">{user.name}</div>
                    <div className="text-slate-500">{user.email}</div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                    {user.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-sm font-medium hover:bg-rose-100 transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/${locale}/login`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center space-x-1.5 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
                >
                  <LogIn className="h-4 w-4 text-indigo-600" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href={`/${locale}/register`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center space-x-1.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition"
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
