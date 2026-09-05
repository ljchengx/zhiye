"use client";

import { LogIn, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useKidsAuth } from "./kids-auth-provider";
import styles from "./kids-user-badge.module.css";

export function KidsUserBadge({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const { child, logout, status } = useKidsAuth();
  const loginHref = pathname === "/kids/login" ? "/kids/login" : `/kids/login?next=${encodeURIComponent(pathname)}`;

  if (status === "loading") return <span className={styles.loading} aria-label="正在读取登录状态" />;
  if (!child) {
    return <Link className={styles.login} href={loginHref}><LogIn aria-hidden="true" size={16} />登录</Link>;
  }

  return (
    <div className={styles.account}>
      <div className={styles.badge} data-compact={compact || undefined} aria-label={`当前登录用户：${child.displayName}`} title="当前登录用户">
        <span className={styles.avatar} style={{ backgroundColor: child.avatarColor }} aria-hidden="true">{child.avatarInitial}</span>
        <span className={styles.copy}><strong>{child.displayName}</strong><small>已登录</small></span>
      </div>
      <button className={styles.logout} type="button" aria-label="退出橙子小朋友账号" title="退出登录" onClick={logout}><LogOut aria-hidden="true" size={15} /></button>
    </div>
  );
}
