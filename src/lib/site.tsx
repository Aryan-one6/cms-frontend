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
  subscription?: {
    plan: string;
    status: string;
    expiresAt?: string | null;
    startedAt?: string | null;
  } | null;
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
  refreshSites: () => Promise<Site[]>;
  createSite: (
    data: { name: string; domain?: string; domains?: string[]; defaultLocale?: string }
  ) => Promise<string | undefined>;
  deleteSite: (siteId: string) => Promise<void>;
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

  async function refreshSites(): Promise<Site[]> {
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
      return newSites;
    } catch (err) {
      console.error("Failed to load sites", err);
      setSites([]);
      return [];
    } finally {
      setLoading(false);
    }
  }

  async function createSite(
    data: { name: string; domain?: string; domains?: string[]; defaultLocale?: string }
  ): Promise<string | undefined> {
    const payload = {
      name: data.name,
      domains: data.domain ? [data.domain] : data.domains ?? [],
      defaultLocale: data.defaultLocale,
    };

    const res = await api.post("/admin/sites", payload);
    const newId = res.data.site?.id as string | undefined;
    await refreshSites();

    // ensure a siteDomain is created so verification can proceed
    if (newId && data.domain) {
      try {
        await api.post(`/admin/sites/${newId}/domains`, { domain: data.domain });
      } catch (err) {
        console.error("Failed to add domain during site creation", err);
        throw err;
      }
    }

    if (newId) selectSite(newId);
    return newId;
  }

  async function deleteSite(siteId: string) {
    await api.delete(`/admin/sites/${siteId}`);
    const newSites = await refreshSites();
    if (!newSites.length) {
      setActiveSiteId(null);
      if (typeof window !== "undefined") localStorage.removeItem(SITE_STORAGE_KEY);
      return;
    }
    if (!newSites.some((s) => s.id === activeSiteId)) {
      selectSite(newSites[0].id);
    }
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
        deleteSite,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  return useContext(SiteContext);
}
