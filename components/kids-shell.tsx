"use client";

import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { getKidsToolHref, kidsToolDefinitions, type KidsToolSlug } from "@/lib/tools/kids-registry";

import styles from "./kids-shell.module.css";

interface KidsShellProps {
  activeTool?: KidsToolSlug;
  children: ReactNode;
}

export function KidsShell({ activeTool, children }: KidsShellProps) {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const firstTool = kidsToolDefinitions[0];
  const primaryHref = firstTool ? getKidsToolHref(firstTool) : "/kids";
  const currentTool = activeTool ? kidsToolDefinitions.find((tool) => tool.slug === activeTool) : undefined;

  const closeNavigation = () => setNavigationOpen(false);

  return (
    <div className={`${styles.shell} kids-shell`}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/kids" onClick={closeNavigation} aria-label="一程一成长首页">
          <span className={styles.brandMark} aria-hidden="true">
            <img src="/kids/logo.webp" alt="" />
          </span>
          <span>
            <strong>一程一成长</strong>
            <small>每天一点，慢慢会</small>
          </span>
        </Link>

        <nav className={styles.nav} aria-label="一程一成长导航">
          <Link href="/kids#tools" onClick={closeNavigation}>全部启蒙工具</Link>
          <Link href="/kids#approach" onClick={closeNavigation}>学习方式</Link>
        </nav>

        <div className={styles.actions}>
          <Link className={styles.actionLink} href={currentTool ? getKidsToolHref(currentTool) : primaryHref} onClick={closeNavigation}>
            {currentTool ? "当前工具" : "开始数学练习"}
            <ArrowRight aria-hidden="true" size={16} strokeWidth={1.8} />
          </Link>
          <button
            className={styles.menuButton}
            type="button"
            aria-label={navigationOpen ? "关闭导航" : "打开导航"}
            aria-controls="kids-navigation"
            aria-expanded={navigationOpen}
            onClick={() => setNavigationOpen((open) => !open)}
          >
            {navigationOpen ? <X aria-hidden="true" size={20} /> : <Menu aria-hidden="true" size={20} />}
          </button>
        </div>

        <div className={`${styles.mobileNav} ${navigationOpen ? styles.mobileNavOpen : ""}`} id="kids-navigation">
          <Link href="/kids#tools" onClick={closeNavigation}>全部启蒙工具</Link>
          <Link href="/kids#approach" onClick={closeNavigation}>学习方式</Link>
          <Link href={currentTool ? getKidsToolHref(currentTool) : primaryHref} onClick={closeNavigation}>
            {currentTool ? "当前工具" : "开始数学练习"}
          </Link>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
