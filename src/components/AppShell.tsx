'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  LayoutDashboard,
  Users,
  Layers,
  PhoneCall,
  BarChart3,
  ShieldCheck,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Bot,
  Radio,
  ArrowUpRight,
} from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  companyName?: string;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Check auth state
  useEffect(() => {
    let mounted = true;
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.success && data.data?.user) {
            setUser({
              ...data.data.user,
              companyName: data.data.companyProfile?.name || 'CloudScale Consulting',
            });
          }
        }
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setAuthChecked(true);
      }
    }
    checkAuth();
    return () => {
      mounted = false;
    };
  }, [pathname]);

  // Track scroll for pill navbar opacity
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push(`/${locale}/login`);
    } catch {
      router.push(`/${locale}/login`);
    }
  };

  // Determine route context
  const cleanPath = pathname.replace(new RegExp(`^/${locale}`), '') || '/';
  const isLandingPage = cleanPath === '/' || cleanPath === '';
  const isAuthPage = cleanPath.startsWith('/login') || cleanPath.startsWith('/register') || cleanPath.startsWith('/unauthorized');
  const isWorkspacePage = !isLandingPage && !isAuthPage;

  // Workspace Navigation Items (with strict RBAC: Administration hidden for CLIENT)
  const workspaceNavItems = [
    {
      label: 'Dashboard',
      href: `/${locale}/dashboard`,
      icon: LayoutDashboard,
      badge: undefined,
    },
    {
      label: 'Leads',
      href: `/${locale}/leads`,
      icon: Users,
      badge: 'Live',
    },
    {
      label: 'Campaigns',
      href: `/${locale}/campaigns`,
      icon: Layers,
      badge: undefined,
    },
    {
      label: 'Voice AI',
      href: `/${locale}/voice`,
      icon: PhoneCall,
      badge: 'SDR',
    },
    {
      label: 'Analytics',
      href: `/${locale}/analytics`,
      icon: BarChart3,
      badge: undefined,
    },
  ];

  const adminNavItems = [
    {
      label: 'Administration',
      href: `/${locale}/admin`,
      icon: ShieldCheck,
      adminOnly: true,
      badge: user?.role === 'ADMIN' ? 'RBAC' : undefined,
    },
    {
      label: 'Settings',
      href: `/${locale}/settings`,
      icon: Settings,
      adminOnly: false,
    },
  ];

  // Helper to determine if a workspace nav item is active
  const isItemActive = (href: string) => {
    const itemClean = href.replace(new RegExp(`^/${locale}`), '') || '/';
    return cleanPath === itemClean || (itemClean !== '/' && cleanPath.startsWith(itemClean));
  };

  // -------------------------------------------------------------
  // MODE 1: PUBLIC LANDING & AUTH PAGES (Pill Floating Navbar + Footer)
  // -------------------------------------------------------------
  if (!isWorkspacePage) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F2F0FF] text-[#0F0F12] selection:bg-[#E5C158]/30 selection:text-[#0F0F12]">
        {/* Floating Pill Public Navbar */}
        <header className="sticky top-3 z-50 px-4 sm:px-6 w-full max-w-6xl mx-auto transition-all duration-300">
          <nav
            className={`flex items-center justify-between px-4 sm:px-6 py-2.5 rounded-full transition-all duration-300 ${
              isScrolled
                ? 'bg-[#E6F0FA]/92 backdrop-blur-xl shadow-glass-md border border-[#5C1D3A]/20'
                : 'bg-[#E6F0FA]/80 backdrop-blur-md shadow-glass-sm border border-[#5C1D3A]/15'
            }`}
            aria-label="Global"
          >
            {/* Logo */}
            <Link
              href={`/${locale}`}
              className="flex items-center space-x-2.5 font-bold tracking-tight text-[#0F0F12] group"
            >
              <div className="w-8 h-8 rounded-xl bg-[#0F0F12] border border-[#E5C158]/40 flex items-center justify-center text-[#F6E27A] shadow-xs group-hover:scale-105 transition-transform">
                <Bot className="w-4 h-4 text-[#F6E27A]" />
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-base font-extrabold tracking-tight text-[#0F0F12]">
                  LeadPoint<span className="text-[#5C1D3A] font-bold">.AI</span>
                </span>
                <span className="hidden md:inline-flex text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F2F0FF] text-[#5C1D3A] border border-[#5C1D3A]/20">
                  Sales Agent
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-1 text-xs font-semibold text-[#475569]">
              <a
                href="#solutions"
                className="px-3.5 py-1.5 rounded-full hover:text-[#0F0F12] hover:bg-[#F2F0FF]/80 transition"
              >
                Solutions
              </a>
              <a
                href="#features"
                className="px-3.5 py-1.5 rounded-full hover:text-[#0F0F12] hover:bg-[#F2F0FF]/80 transition"
              >
                Product
              </a>
              <a
                href="#how-it-works"
                className="px-3.5 py-1.5 rounded-full hover:text-[#0F0F12] hover:bg-[#F2F0FF]/80 transition"
              >
                How It Works
              </a>
              <a
                href="#intelligence"
                className="px-3.5 py-1.5 rounded-full hover:text-[#0F0F12] hover:bg-[#F2F0FF]/80 transition"
              >
                AI Intelligence
              </a>
              <a
                href="#handoff"
                className="px-3.5 py-1.5 rounded-full hover:text-[#0F0F12] hover:bg-[#F2F0FF]/80 transition"
              >
                Human Handoff
              </a>
            </div>

            {/* Right Action Stack: Language + Auth CTAs */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <LanguageSwitcher />

              {user ? (
                <Link
                  href={`/${locale}/dashboard`}
                  className="btn-primary-black text-xs py-1.5 px-4 rounded-full shadow-xs"
                >
                  <span>Workspace</span>
                  <ArrowUpRight className="w-3.5 h-3.5 ml-1 text-[#F6E27A]" />
                </Link>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    href={`/${locale}/login`}
                    className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-semibold text-[#475569] hover:text-[#0F0F12] hover:bg-[#F2F0FF] rounded-full transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    href={`/${locale}/register`}
                    className="btn-primary-black text-xs py-1.5 px-4 rounded-full shadow-xs"
                  >
                    <span>Get Started</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-0.5 text-[#F6E27A]" />
                  </Link>
                </div>
              )}

              {/* Mobile Menu Hamburger */}
              <button
                type="button"
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                className="lg:hidden p-1.5 rounded-full text-[#475569] hover:text-[#0F0F12] hover:bg-[#F2F0FF] transition"
                aria-label="Toggle navigation menu"
              >
                {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </nav>

          {/* Mobile Drawer (Slide down / fade in) */}
          {mobileNavOpen && (
            <div className="lg:hidden mt-2 p-4 bg-[#E6F0FA]/95 backdrop-blur-xl rounded-2xl border border-[#5C1D3A]/20 shadow-glass-lg space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex flex-col space-y-1 text-sm font-semibold text-[#0F0F12]">
                <a
                  href="#solutions"
                  onClick={() => setMobileNavOpen(false)}
                  className="px-3 py-2 rounded-xl hover:bg-[#F2F0FF] transition"
                >
                  Solutions
                </a>
                <a
                  href="#features"
                  onClick={() => setMobileNavOpen(false)}
                  className="px-3 py-2 rounded-xl hover:bg-[#F2F0FF] transition"
                >
                  Product Capabilities
                </a>
                <a
                  href="#how-it-works"
                  onClick={() => setMobileNavOpen(false)}
                  className="px-3 py-2 rounded-xl hover:bg-[#F2F0FF] transition"
                >
                  8-Stage Pipeline
                </a>
                <a
                  href="#intelligence"
                  onClick={() => setMobileNavOpen(false)}
                  className="px-3 py-2 rounded-xl hover:bg-[#F2F0FF] transition"
                >
                  Lead Intelligence
                </a>
                <a
                  href="#handoff"
                  onClick={() => setMobileNavOpen(false)}
                  className="px-3 py-2 rounded-xl hover:bg-[#F2F0FF] transition"
                >
                  Human Handoff & Calendly
                </a>
              </div>

              <div className="pt-3 border-t border-[#5C1D3A]/15 flex flex-col space-y-2">
                {user ? (
                  <Link
                    href={`/${locale}/dashboard`}
                    onClick={() => setMobileNavOpen(false)}
                    className="btn-primary-black w-full py-2.5 text-center text-xs font-semibold rounded-xl"
                  >
                    <span>Go to Workspace Dashboard</span>
                  </Link>
                ) : (
                  <>
                    <Link
                      href={`/${locale}/login`}
                      onClick={() => setMobileNavOpen(false)}
                      className="btn-secondary-glass w-full py-2.5 text-center text-xs font-semibold rounded-xl"
                    >
                      Sign In
                    </Link>
                    <Link
                      href={`/${locale}/register`}
                      onClick={() => setMobileNavOpen(false)}
                      className="btn-primary-black w-full py-2.5 text-center text-xs font-semibold rounded-xl"
                    >
                      <span>Get Started</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </header>

        {/* Content Body */}
        <main className="flex-1">{children}</main>

        {/* Multi-Column SaaS Footer (Dark Charcoal #0F0F12 with Gold Accents) */}
        {isLandingPage && (
          <footer className="border-t border-[#5C1D3A]/30 bg-[#0F0F12] text-slate-300 pt-16 pb-12 mt-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-slate-800">
                {/* Brand Column */}
                <div className="col-span-2 space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 border border-[#E5C158]/50 flex items-center justify-center text-[#F6E27A]">
                      <Bot className="w-4 h-4" />
                    </div>
                    <span className="text-base font-extrabold text-white tracking-tight">
                      LeadPoint<span className="text-[#E5C158]">.AI</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                    Autonomous B2B sales intelligence and lead orchestration platform. Discover buying signals, qualify prospects across multi-turn voice conversations, and hand qualified leads directly to your sales team.
                  </p>
                  <div className="pt-2 flex items-center space-x-2 text-[11px] text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse"></span>
                    <span className="text-slate-300 font-medium">Gemini Telephony Engine Operational</span>
                  </div>
                </div>

                {/* Column 2: Product */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#F6E27A]">Product</h4>
                  <ul className="space-y-2 text-xs text-slate-400">
                    <li>
                      <Link href={`/${locale}/leads`} className="hover:text-[#F6E27A] transition">
                        Lead Intelligence
                      </Link>
                    </li>
                    <li>
                      <Link href={`/${locale}/voice`} className="hover:text-[#F6E27A] transition">
                        Autonomous Voice SDR
                      </Link>
                    </li>
                    <li>
                      <Link href={`/${locale}/campaigns`} className="hover:text-[#F6E27A] transition">
                        Campaign Management
                      </Link>
                    </li>
                    <li>
                      <Link href={`/${locale}/analytics`} className="hover:text-[#F6E27A] transition">
                        Pipeline Analytics
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Column 3: Solutions */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#F6E27A]">Solutions</h4>
                  <ul className="space-y-2 text-xs text-slate-400">
                    <li>
                      <a href="#how-it-works" className="hover:text-[#F6E27A] transition">
                        Lead Qualification
                      </a>
                    </li>
                    <li>
                      <a href="#solutions" className="hover:text-[#F6E27A] transition">
                        Sales Automation
                      </a>
                    </li>
                    <li>
                      <a href="#handoff" className="hover:text-[#F6E27A] transition">
                        Human Handoff
                      </a>
                    </li>
                    <li>
                      <a href="#handoff" className="hover:text-[#F6E27A] transition">
                        Meeting Conversion
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Column 4: Resources */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#F6E27A]">Resources</h4>
                  <ul className="space-y-2 text-xs text-slate-400">
                    <li>
                      <a href="#how-it-works" className="hover:text-[#F6E27A] transition">
                        How It Works
                      </a>
                    </li>
                    <li>
                      <Link href={`/${locale}/leads`} className="hover:text-[#F6E27A] transition">
                        CSV Lead Import Schema
                      </Link>
                    </li>
                    <li>
                      <Link href={`/${locale}/voice`} className="hover:text-[#F6E27A] transition">
                        Twilio Telephony & Voice
                      </Link>
                    </li>
                    <li>
                      <Link href={`/${locale}/login`} className="hover:text-[#F6E27A] transition">
                        Portal Login
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Bottom Copyright & Legal */}
              <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
                <div className="flex items-center space-x-4">
                  <span>© {new Date().getFullYear()} LeadPoint-AI Inc. All rights reserved.</span>
                  <span className="hidden sm:inline">·</span>
                  <span className="hover:text-[#F6E27A] cursor-pointer">Privacy Policy</span>
                  <span className="hidden sm:inline">·</span>
                  <span className="hover:text-[#F6E27A] cursor-pointer">Terms of Service</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-[11px] text-slate-400">Language:</span>
                  <LanguageSwitcher />
                </div>
              </div>
            </div>
          </footer>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // MODE 2: AUTHENTICATED SaaS WORKSPACE SHELL
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F2F0FF] text-[#0F0F12] flex flex-col lg:flex-row antialiased">
      {/* Desktop Sidebar (Ice-Blue Glass, 256px wide, fixed height, sticky) */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#E6F0FA]/85 backdrop-blur-xl border-r border-[#5C1D3A]/15 h-screen sticky top-0 z-40 select-none shadow-glass-sm">
        {/* Workspace Brand Header */}
        <div className="p-4 border-b border-[#5C1D3A]/12 flex items-center justify-between">
          <Link href={`/${locale}/dashboard`} className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[#0F0F12] border border-[#E5C158]/40 flex items-center justify-center text-[#F6E27A] shadow-xs group-hover:scale-105 transition-transform">
              <Bot className="w-4 h-4 text-[#F6E27A]" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#0F0F12] tracking-tight flex items-center space-x-1">
                <span>LeadPoint</span>
                <span className="text-[#5C1D3A]">.AI</span>
              </div>
              <div className="text-[10px] text-[#64748B] truncate max-w-[140px] font-medium">
                {user?.companyName || 'CloudScale Consulting'}
              </div>
            </div>
          </Link>
        </div>

        {/* Live Operational Status Banner (Mint Green Active Indicator) */}
        <div className="px-4 py-2 bg-[#E6F0FA]/95 border-b border-[#5C1D3A]/10 flex items-center justify-between text-[11px]">
          <div className="flex items-center space-x-1.5 text-[#475569] font-medium">
            <Radio className="w-3 h-3 text-[#34D399] animate-pulse" />
            <span>Voice SDR Engine</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#065F46] border border-[#34D399]/40 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-ping" />
            <span>ONLINE</span>
          </span>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Core Workflow Links */}
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
              Pipeline Workspace
            </div>
            {workspaceNavItems.map((item) => {
              const active = isItemActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-[#F2F0FF] text-[#0F0F12] font-bold border border-[#5C1D3A]/25 shadow-glass-sm'
                      : 'text-[#475569] hover:text-[#0F0F12] hover:bg-[#F2F0FF]/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-4 h-4 ${active ? 'text-[#5C1D3A]' : 'text-[#64748B]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                        active
                          ? 'bg-[#E5C158]/30 text-[#0F0F12] border border-[#E5C158]/50'
                          : 'bg-[#E6F0FA] text-[#64748B] border border-[#5C1D3A]/10'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Administration & System (Strictly Role-Guarded: ADMIN only) */}
          <div className="space-y-1 pt-2 border-t border-[#5C1D3A]/10">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
              Management & Controls
            </div>
            {adminNavItems.map((item) => {
              if (item.adminOnly && user?.role !== 'ADMIN') {
                return null;
              }
              const active = isItemActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-[#F2F0FF] text-[#0F0F12] font-bold border border-[#5C1D3A]/25 shadow-glass-sm'
                      : 'text-[#475569] hover:text-[#0F0F12] hover:bg-[#F2F0FF]/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-4 h-4 ${active ? 'text-[#5C1D3A]' : 'text-[#64748B]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FBBF24]/40">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* User Profile Card & Logout */}
        <div className="p-3 border-t border-[#5C1D3A]/12 bg-[#E6F0FA]/60">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#E6F0FA]/90 border border-[#5C1D3A]/18 shadow-glass-sm">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#0F0F12] border border-[#E5C158]/50 flex items-center justify-center text-[#F6E27A] font-bold text-xs shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#0F0F12] truncate">
                  {user?.name || 'Authorized User'}
                </div>
                <div className="flex items-center space-x-1 mt-0.5">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                      user?.role === 'ADMIN'
                        ? 'bg-[#F3E8FF] text-[#6B21A8] border border-[#C084FC]/40'
                        : user?.role === 'SDR'
                        ? 'bg-[#ECFDF5] text-[#065F46] border border-[#34D399]/40'
                        : 'bg-[#F2F0FF] text-[#475569] border border-[#5C1D3A]/15'
                    }`}
                  >
                    {user?.role || 'CLIENT'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 text-[#64748B] hover:text-[#F87171] hover:bg-[#FEF2F2] rounded-lg transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen">
        {/* Top App Header (Ice-blue glass, compact & functional) */}
        <header className="sticky top-0 z-30 bg-[#E6F0FA]/80 backdrop-blur-md border-b border-[#5C1D3A]/15 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-glass-sm">
          {/* Left: Mobile Drawer Trigger & Breadcrumb */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-[#475569] hover:bg-[#F2F0FF] transition"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-xs font-medium text-[#64748B]">
              <span className="hidden sm:inline font-semibold text-[#0F0F12]">
                {user?.companyName || 'CloudScale'}
              </span>
              <ChevronRight className="hidden sm:inline w-3 h-3 text-[#64748B]" />
              <span className="capitalize font-bold text-[#0F0F12]">
                {cleanPath.replace(/^\//, '').split('/')[0] || 'Dashboard'}
              </span>
            </div>
          </div>

          {/* Right: Quick actions, Live SDR status, Language Switcher, User */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-[#34D399]/40 text-[#065F46] text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse"></span>
              <span>Gemini Telephony Live</span>
            </div>

            <LanguageSwitcher />

            <Link
              href={`/${locale}/voice`}
              className="hidden sm:inline-flex btn-primary-black text-xs py-1.5 px-3 rounded-xl shadow-xs"
            >
              <PhoneCall className="w-3 h-3 mr-1.5 text-[#F6E27A]" />
              <span>Launch SDR Call</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 text-[#64748B] hover:text-[#F87171] hover:bg-[#FEF2F2] rounded-lg transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile Slide-Over Sidebar Drawer */}
        {mobileNavOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-[#0F0F12]/40 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileNavOpen(false)}
            />

            {/* Sidebar panel */}
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#E6F0FA]/95 backdrop-blur-xl border-r border-[#5C1D3A]/20 shadow-2xl p-4 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#5C1D3A]/15">
                <div className="flex items-center space-x-2 font-bold text-[#0F0F12] text-sm">
                  <div className="w-6 h-6 rounded-lg bg-[#0F0F12] border border-[#E5C158]/40 flex items-center justify-center text-[#F6E27A]">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <span>LeadPoint.AI</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="p-1.5 text-[#64748B] hover:text-[#0F0F12] rounded-lg hover:bg-[#F2F0FF]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] px-3 pb-1">
                  Navigation
                </div>
                {workspaceNavItems.map((item) => {
                  const active = isItemActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileNavOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                        active
                          ? 'bg-[#F2F0FF] text-[#0F0F12] font-bold border border-[#5C1D3A]/20 shadow-xs'
                          : 'text-[#475569] hover:bg-[#F2F0FF]'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className="w-4 h-4 text-[#5C1D3A]" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-[#E5C158]/30 text-[#0F0F12] border border-[#E5C158]/40">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}

                <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] px-3 pt-3 pb-1 border-t border-[#5C1D3A]/10 mt-2">
                  System
                </div>
                {adminNavItems.map((item) => {
                  if (item.adminOnly && user?.role !== 'ADMIN') return null;
                  const active = isItemActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileNavOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                        active
                          ? 'bg-[#F2F0FF] text-[#0F0F12] font-bold border border-[#5C1D3A]/20 shadow-xs'
                          : 'text-[#475569] hover:bg-[#F2F0FF]'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className="w-4 h-4 text-[#5C1D3A]" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FBBF24]/40">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Mobile Drawer Logout */}
              <div className="pt-3 border-t border-[#5C1D3A]/15">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-[#F2F0FF] hover:bg-[#FEF2F2] hover:text-[#F87171] text-[#0F0F12] text-xs font-semibold transition border border-[#5C1D3A]/12"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
