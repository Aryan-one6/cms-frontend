import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, SITE_STORAGE_KEY } from "./api";
import { useAuth } from "./auth";

export type Site = {
  id: string;
  name: string;
  slug: string;
  domains?: string[];
  defaultLocale?: string | null;
  membershipRole?: string;
  siteDomains?: SiteDomain[];
};

export type SiteDomain = {
  id: string;
  domain: string;
  status: "PENDING" | "VERIFIED" | "FAILED";
  verificationToken: string;
  verifiedAt?: string | null;
};

type SiteContextValue = {
  sites: Site[];
  activeSite: Site | null;
  activeSiteId: string | null;
  loading: boolean;
  selectSite: (siteId: string) => void;
  refreshSites: () => Promise<void>;
  createSite: (data: { name: string; domains?: string[]; defaultLocale?: string }) => Promise<void>;
};

const SiteContext = createContext<SiteContextValue>(null!);

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const { admin } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSiteId, setActiveSiteId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(SITE_STORAGE_KEY);
  });

  const activeSite = useMemo(
    () => sites.find((s) => s.id === activeSiteId) ?? null,
    [activeSiteId, sites]
  );

  const selectSite = (siteId: string) => {
    setActiveSiteId(siteId);
    if (typeof window !== "undefined") {
      localStorage.setItem(SITE_STORAGE_KEY, siteId);
    }
  };

  async function refreshSites() {
    setLoading(true);
    try {
      const res = await api.get("/admin/sites");
      const newSites = res.data.sites as Site[];
      setSites(newSites);
      if (newSites.length && (!activeSiteId || !newSites.some((s) => s.id === activeSiteId))) {
        selectSite(newSites[0].id);
      }
      if (!newSites.length) {
        setActiveSiteId(null);
        if (typeof window !== "undefined") localStorage.removeItem(SITE_STORAGE_KEY);
      }
    } catch (err) {
      console.error("Failed to load sites", err);
      setSites([]);
    } finally {
      setLoading(false);
    }
  }

  async function createSite(data: { name: string; domains?: string[]; defaultLocale?: string }) {
    const res = await api.post("/admin/sites", data);
    const newId = res.data.site?.id as string | undefined;
    await refreshSites();
    if (newId) selectSite(newId);
  }

  useEffect(() => {
    if (admin) {
      refreshSites();
    } else {
      setSites([]);
      setActiveSiteId(null);
      if (typeof window !== "undefined") localStorage.removeItem(SITE_STORAGE_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin?.id]);

  return (
    <SiteContext.Provider
      value={{
        sites,
        activeSite,
        activeSiteId,
        loading,
        selectSite,
        refreshSites,
        createSite,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  return useContext(SiteContext);
}
