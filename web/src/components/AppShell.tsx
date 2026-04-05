'use client';

import { Activity, AreaSearch, PlusCircle, Reports } from 'iconoir-react';
import { MiniKit } from '@worldcoin/minikit-js';
import { useMiniKit } from '@worldcoin/minikit-js/minikit-provider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

type NavItem = {
  href: string;
  label: string;
  matchers: string[];
  icon: typeof Activity;
};

const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Home',
    matchers: ['/'],
    icon: Activity,
  },
  {
    href: '/explore',
    label: 'Explore',
    matchers: ['/explore', '/agent', '/use', '/compose'],
    icon: AreaSearch,
  },
  {
    href: '/create',
    label: 'Create',
    matchers: ['/create'],
    icon: PlusCircle,
  },
  {
    href: '/dashboard',
    label: 'Dashboard',
    matchers: ['/dashboard'],
    icon: Reports,
  },
];

function getScreenTitle(pathname: string) {
  if (pathname === '/') {
    return 'A2A';
  }

  if (pathname.startsWith('/explore')) {
    return 'Explore';
  }

  if (pathname.startsWith('/create')) {
    return 'Create';
  }

  if (pathname.startsWith('/agent/')) {
    return 'Agent';
  }

  if (pathname.startsWith('/use/')) {
    return 'Use Agent';
  }

  if (pathname.startsWith('/compose/')) {
    return 'Compose';
  }

  if (pathname.startsWith('/dashboard')) {
    return 'Dashboard';
  }

  return 'A2A';
}

function isItemActive(pathname: string, item: NavItem) {
  if (item.href === '/') {
    return pathname === '/';
  }

  return item.matchers.some((matcher) => pathname.startsWith(matcher));
}

async function triggerSelectionHaptic() {
  try {
    await MiniKit.sendHapticFeedback({
      hapticsType: 'selection-changed',
    });
  } catch {
    // Ignore when outside World App or if haptics are unavailable.
  }
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isInstalled } = useMiniKit();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-12rem] h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(15,118,110,0.28),_rgba(15,118,110,0)_70%)]" />
        <div className="absolute bottom-[-10rem] right-[-6rem] h-[20rem] w-[20rem] rounded-full bg-[radial-gradient(circle,_rgba(255,107,87,0.2),_rgba(255,107,87,0)_70%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1100px] flex-col">
        <header className="sticky top-0 z-30 px-4 pb-3 pt-[calc(var(--safe-top)+0.875rem)] md:px-6">
          <div className="rounded-[30px] border border-white/70 bg-[rgba(255,249,241,0.92)] px-4 py-4 shadow-[0_18px_40px_rgba(19,34,28,0.08)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-800/70">
                  A2A mini app
                </p>
                <h1 className="font-[family:var(--font-space-grotesk)] text-lg font-semibold tracking-tight text-slate-950">
                  {getScreenTitle(pathname)}
                </h1>
              </div>
              <div
                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  isInstalled
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-white text-slate-600'
                }`}
              >
                {isInstalled ? 'World App' : 'Browser preview'}
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Verified AI agent marketplace
            </p>
          </div>
        </header>

        <div className="flex-1 px-4 pb-[calc(var(--safe-bottom)+6.75rem)] md:px-6 md:pb-10">
          {children}
        </div>

        <nav className="sticky bottom-0 z-30 px-4 pb-[calc(var(--safe-bottom)+0.875rem)] md:px-6">
          <div className="mx-auto max-w-[560px] rounded-[32px] border border-white/70 bg-[rgba(255,249,241,0.95)] p-2 shadow-[0_20px_45px_rgba(19,34,28,0.12)] backdrop-blur-xl">
            <div className="grid grid-cols-4 gap-1">
              {navItems.map((item) => {
                const active = isItemActive(pathname, item);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    className={`flex flex-col items-center gap-1 rounded-[24px] px-3 py-2.5 text-xs font-medium transition ${
                      active
                        ? 'bg-slate-950 text-white'
                        : 'text-slate-500 hover:bg-white/80 hover:text-slate-900'
                    }`}
                    href={item.href}
                    onClick={() => {
                      void triggerSelectionHaptic();
                    }}
                  >
                    <Icon height={20} width={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
