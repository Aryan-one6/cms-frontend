import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "../lib/auth";
import { useSite } from "@/lib/site";

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
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600 text-lg font-semibold text-white">
            SC
          </div>
          <div>
            <div className="text-base font-semibold text-slate-900">Sapphire CMS</div>
            <div className="text-xs text-slate-500">
              {activeSite ? `Site: ${activeSite.name}` : "Choose a site"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm sm:flex">
            <label className="text-xs font-medium text-slate-500" htmlFor="site-selector">
              Active site
            </label>
            <select
              id="site-selector"
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-800 focus:outline-none"
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
            <Button asChild variant="ghost" size="sm">
              <Link to="/sites">Manage</Link>
            </Button>
          </div>
          <nav className="hidden items-center gap-2 md:flex">
            <NavItem to="/" label="Dashboard" />
            <NavItem to="/posts" label="Blog Posts" />
            <NavItem to="/sites" label="Sites" />
          </nav>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-600 text-white">
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
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">{children}</div>
      </div>
    </div>
  );
}
