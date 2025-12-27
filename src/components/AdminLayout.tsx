import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "../lib/auth";
import { useSite } from "@/lib/site";
import { Badge } from "@/components/ui/badge";

function NavItem({ to, label }: { to: string; label: string }) {
  const { pathname } = useLocation();
  const active =
    to === "/"
      ? pathname === "/"
      : pathname === to || pathname.startsWith(`${to}/`);

  return (
    <Link
      to={to}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
        active ? "bg-cyan-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      {label}
    </Link>
  );
}

function HeaderBar() {
  const { admin, logout } = useAuth();
  const { activeSite, sites, selectSite } = useSite();

  return (
    <header className="border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-lg font-semibold text-white">
            SC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className="text-base font-semibold text-slate-900">Sapphire CMS</div>
              <Badge variant="secondary" className="hidden md:inline-flex">
                Portal
              </Badge>
            </div>
            <div className="text-xs text-slate-500">
              {activeSite ? `Active: ${activeSite.name}` : "Choose a site"}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2  px-3 py-1.5">
            <label className="text-xs font-medium text-slate-500" htmlFor="site-selector">
              Active Site
            </label>
            <select
              id="site-selector"
              className="rounded-full border border-slate-200  bg-white px-2 py-1 text-sm text-slate-800 focus:outline-none"
              value={activeSite?.id || ""}
              onChange={(e) => selectSite(e.target.value)}
            >
              <option value="" disabled>
                Select…
              </option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
           
          </div>
          <nav className="hidden items-center gap-2 md:flex">
            <NavItem to="/" label="Dashboard" />
            <NavItem to="/posts" label="Posts" />
            <NavItem to="/sites" label="Sites" />
            {admin?.role === "SUPER_ADMIN" ? <NavItem to="/super-admin" label="Super Admin" /> : null}
            
          </nav>
          <Separator orientation="vertical" className="hidden h-6 md:block" />
          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white">
              {admin?.name?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div className="hidden text-sm leading-tight text-slate-700 sm:block">
              <div className="font-medium">{admin?.name ?? "Admin User"}</div>
              <div className="text-xs text-slate-500">{admin?.role ?? "Administrator"}</div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <HeaderBar />
      <div className="mx-auto  px-4 py-8">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">{children}</div>
      </div>
    </div>
  );
}
