"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Search, Stamp, Share2, Users, Waypoints } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard/projects", label: "Dự án", icon: Building2 },
  { href: "/dashboard/customers", label: "Khách hàng", icon: Users },
  { href: "/dashboard/graph", label: "Sơ đồ", icon: Waypoints },
  { href: "/dashboard/search", label: "Tìm kiếm", icon: Search },
  { href: "/dashboard/legal", label: "Pháp lý", icon: Stamp },
  { href: "/dashboard/share-links", label: "Chia sẻ", icon: Share2 },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex h-14 items-stretch border-t border-line bg-paper-raised lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center justify-center gap-0.5"
          >
            <Icon
              size={24}
              strokeWidth={1.75}
              fill={active ? "currentColor" : "none"}
              className={active ? "text-ink" : "text-slate"}
              aria-hidden
            />
            <span
              className={`text-label font-display uppercase tracking-wide ${
                active ? "text-ink" : "text-slate"
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-line bg-paper-raised lg:flex lg:flex-col">
      <div className="px-5 py-6">
        <p className="text-title font-display font-bold text-ink">Project Knowledge Hub</p>
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex h-11 items-center gap-3 rounded-md px-3 text-body ${
                active ? "bg-paper text-ink font-medium" : "text-ink-soft hover:bg-paper"
              }`}
            >
              <Icon
                size={20}
                strokeWidth={1.75}
                fill={active ? "currentColor" : "none"}
                aria-hidden
              />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
