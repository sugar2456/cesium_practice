// app/components/NavList.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, NavItem } from "@/app/components/navi/nav.config";

function isActive(pathname: string, item: NavItem) {
  return item.match === "exact"
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(item.href + "/");
}

export default function NavComponent() {
  const pathname = usePathname();

  return (
    <nav aria-label="主要ナビゲーション">
      <ul className="space-y-1">
        {NAV.map((item) => {
          const active = isActive(pathname, item);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex items-center rounded-xl px-3 py-2 text-sm transition",
                  active
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                ].join(" ")}
              >
                {item.icon ?? <span className="mr-2">•</span>}
                <span>{item.label}</span>
              </Link>

              {item.children?.length ? (
                <ul className="mt-1 ml-6 space-y-1">
                  {item.children.map((c) => {
                    const subActive = isActive(pathname, c);
                    return (
                      <li key={c.href}>
                        <Link
                          href={c.href}
                          aria-current={subActive ? "page" : undefined}
                          className={[
                            "block rounded-lg px-3 py-1.5 text-sm",
                            subActive
                              ? "bg-gray-200 text-gray-900"
                              : "text-gray-600 hover:bg-gray-100"
                          ].join(" ")}
                        >
                          {c.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
