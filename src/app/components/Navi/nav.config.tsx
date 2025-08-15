// app/nav.config.tsx
import { ReactNode } from "react";

export type NavItem = {
  label: string;
  href: string;
  icon?: ReactNode;
  match?: "exact" | "startsWith"; // アクティブ判定方法
  children?: NavItem[];
};

export const NAV: NavItem[] = [
  { label: "3Dタイル", href: "/feature/3d_tiles", match: "startsWith" },
//   {
//     label: "設定",
//     href: "/settings",
//     match: "startsWith",
//     children: [
//       { label: "プロフィール", href: "/settings/profile", match: "exact" },
//       { label: "連携", href: "/settings/integrations", match: "startsWith" },
//     ],
//   },
];
