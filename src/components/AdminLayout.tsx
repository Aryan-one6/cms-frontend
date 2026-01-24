import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "../lib/auth";
import { useSite } from "@/lib/site";
import {
  LayoutGrid,
  PenLine,
  Globe,
  CreditCard,
  ShieldCheck,
  // Sparkles,
  LogOut,
  PlusCircle,
  UserCircle2,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  X,
} from "lucide-react";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

function buildNav(adminRole?: string): NavItem[] {
  const items: NavItem[] = [
    { to: "/app", label: "Dashboard", icon: LayoutGrid },
    { to: "/account", label: "Account", icon: UserCircle2 },
    { to: "/posts", label: "Posts", icon: PenLine },
    { to: "/sites", label: "Sites", icon: Globe },
    { to: "/pricing", label: "Pricing", icon: CreditCard },
  ];
  if (adminRole === "SUPER_ADMIN") {
    items.push({ to: "/super-admin", label: "Super Admin", icon: ShieldCheck });
  }
  return items;
}

function NavLink({
  item,
  variant = "sidebar",
  expanded = true,
  onNavigate,
}: {
  item: NavItem;
  variant?: "sidebar" | "top";
  expanded?: boolean;
  onNavigate?: () => void;
}) {
  const { pathname } = useLocation();
  const active = item.to === "/" ? pathname === "/" : pathname === item.to || pathname.startsWith(`${item.to}/`);
  const Icon = item.icon;

  const base =
    variant === "sidebar"
      ? "group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition"
      : "group flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition";

  const activeStyle =
    variant === "sidebar"
      ? "bg-slate-900 text-white shadow-sm"
      : "bg-slate-900 text-white";
  const idleStyle =
    variant === "sidebar"
      ? "text-slate-300 hover:bg-slate-800 hover:text-white"
      : "text-slate-300 hover:bg-slate-800 hover:text-white";

  return (
    <Link
      to={item.to}
      className={`${base} ${active ? activeStyle : idleStyle}`}
      title={item.label}
      aria-label={item.label}
      onClick={() => {
        if (variant === "sidebar") onNavigate?.();
      }}
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-2xl ${active ? "bg-white/15" : "bg-slate-800"}`}
      >
        <Icon className={`h-4 w-4 ${active ? "text-white" : "text-slate-400"}`} />
      </span>
      <span
        className={`whitespace-nowrap transition-all duration-200 ${
          expanded || variant === "top" ? "opacity-100" : "pointer-events-none w-0 opacity-0"
        }`}
      >
        {item.label}
      </span>
    </Link>
  );
}

function Sidebar({ expanded, onToggle, onNavigate }: { expanded: boolean; onToggle: () => void; onNavigate: () => void }) {
  const { admin, logout } = useAuth();
  const navItems = buildNav(admin?.role);
  const { activeSite, sites, selectSite } = useSite();

  return (
    <aside
      className={`hidden h-screen flex-none flex-col border-r border-slate-800 bg-[radial-gradient(100%_80%_at_0%_0%,rgba(14,165,233,0.18),transparent_70%),linear-gradient(180deg,#0f172a,#0b1223)] transition-all duration-300 lg:sticky lg:top-0 lg:flex ${
        expanded ? "w-64" : "w-20"
      }`}
    >
      <div className={`px-3 pb-4 pt-5 ${expanded ? "flex items-center justify-between" : "flex justify-center"}`}>
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="TRIAD logo"
            className="h-15 w-15 "
          />
          {expanded ? (
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">AI-Powered</div>
              <div className="font-display text-sm font-semibold text-white">TRIAD CMS</div>
            </div>
          ) : null}
        </div>
        {expanded ? (
          <Button variant="ghost" size="icon" className="rounded-full text-slate-300 hover:bg-slate-800" onClick={onToggle}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {!expanded ? (
        <div className="flex items-center justify-center pb-3">
          <Button variant="ghost" size="icon" className="rounded-full text-slate-300 hover:bg-slate-800" onClick={onToggle}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="px-3">
          
          <div className="mt-3 rounded-2xl ">
            <label className="text-[11px] pl-2 font-medium uppercase tracking-[0.18em] text-green-300" htmlFor="site-selector-desktop">
              Active site
            </label>
            <select
              id="site-selector-desktop"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none"
              value={activeSite?.id || ""}
              onChange={(e) => selectSite(e.target.value)}
            >
              <option value="" disabled>
                Select a site
              </option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <nav className={`mt-4 flex flex-1 flex-col gap-1.5 overflow-y-auto ${expanded ? "px-3" : "px-2"}`}>
        {navItems.map((item) => (
          <NavLink key={item.to} item={item} expanded={expanded} onNavigate={onNavigate} />
        ))}
      </nav>

      {expanded ? (
        <div className="px-3 pb-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 shadow-sm">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-400">AI workspace</div>
            <div className="mt-2 flex items-center justify-between text-sm font-semibold text-white">
              Model runtime
              <Badge className="bg-emerald-500/15 text-emerald-200">Live</Badge>
            </div>
            {/* <p className="mt-2 text-xs text-slate-400">Drafts, cover art, and SEO prompts are ready.</p> */}
          </div>
        </div>
      ) : null}

      <div className="mt-auto border-t border-slate-800 bg-slate-900/90 px-4 py-4">
     
        <Button
          variant="outline"
          className=" text-slate-950 hover:bg-cyan-400"
          onClick={() => {
            logout();
          }}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </aside>
  );
}

function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-[radial-gradient(100%_80%_at_0%_0%,rgba(14,165,233,0.18),transparent_70%),linear-gradient(180deg,#0f172a,#0b1223)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-screen-2xl items-center gap-3 px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full border border-slate-800 bg-slate-900 text-white hover:bg-slate-800 lg:hidden"
            onClick={onOpenMenu}
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-1 justify-center lg:hidden">
          <Link to="/app" className="flex items-center gap-2">
            <div className="flex h-auto w-auto items-center justify-center ">
              {/* <img src="/logo.png" alt="Triad CMS" className="h-12 w-full object-contain" /> */}
              Triad CMS
            </div>
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Button asChild size="sm" className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">
            <Link to="/posts/new" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              New post
            </Link>
          </Button>

          <Button
            variant="outline"
            className="border-slate-700  hover:bg-cyan-400 hidden sm:block"
            onClick={() => {
              logout();
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { admin, logout } = useAuth();
  const { activeSite, sites, selectSite } = useSite();
  const navItems = buildNav(admin?.role);

  return (
    <div className={`fixed inset-0 z-40 ${open ? "" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-slate-900/60 backdrop-blur transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-80 max-w-[90vw] flex-col border-l border-slate-800 bg-slate-900 shadow-2xl transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-right justify-end  px-4 py-1">
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close menu" className="text-slate-200 hover:bg-slate-800">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-2">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-1">
            {admin?.avatarUrl ? (
              <img
                src={admin.avatarUrl}
                alt={admin?.name ?? "Admin"}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-white">
                {admin?.name?.[0]?.toUpperCase() ?? "A"}
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">{admin?.name ?? "Admin User"}</div>
              <div className="text-xs text-slate-400">{admin?.role ?? "Administrator"}</div>
            </div>
          </div>

          <div className=" bg-slate-900 px-1 py-1">
            <label className="text-xs pl-2 font-medium text-green-300" htmlFor="site-selector-drawer">
              Active site
            </label>
            <select
              id="site-selector-drawer"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-white"
              value={activeSite?.id || ""}
              onChange={(e) => selectSite(e.target.value)}
            >
              <option value="" disabled>
                Select a site
              </option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

       

          <nav className="grid gap-2">
            {navItems.map((item) => (
              <NavLink key={item.to} item={item} expanded onNavigate={onClose} />
            ))}
          </nav>
        </div>

        <div className="border-t border-slate-800 px-4 py-4">
          <Button
            variant="outline"
            className="w-full gap-2  hover:bg-slate-800"
            onClick={() => {
              logout();
              onClose();
            }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const storageKey = "sapphire.sidebarExpanded";
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(storageKey) === "true";
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const updateSidebar = (value: boolean) => {
    setSidebarExpanded(value);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, value ? "true" : "false");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(storageKey, sidebarExpanded ? "true" : "false");
  }, [sidebarExpanded]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-[radial-gradient(120%_80%_at_50%_0%,rgba(14,165,164,0.08),transparent_65%),linear-gradient(180deg,#f8fafc,#eef2f7)]">
      <div className="flex min-h-screen">
        <Sidebar
          expanded={sidebarExpanded}
          onToggle={() => updateSidebar(!sidebarExpanded)}
          onNavigate={() => updateSidebar(true)}
        />
        <div className="flex min-h-screen flex-1 flex-col">
          <TopBar onOpenMenu={() => setMobileOpen(true)} />
          <main className="relative flex-1 overflow-x-hidden">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute right-12 top-16 h-32 w-32 rounded-full bg-cyan-700/70 blur-3xl" />
              <div className="absolute left-16 top-40 h-40 w-40 rounded-full bg-sky-300/60 blur-3xl" />
            </div>
            <div className="relative mx-auto w-full max-w-screen-3xl px-2 py-3 sm:px-2 lg:px-2">
              <div className="    p-3  sm:p-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </div>
  );
}
