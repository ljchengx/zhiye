"use client";

import { ArrowLeft, Settings2, Volume2, VolumeX, X } from "lucide-react";
import Link from "next/link";
import { useRef, type MouseEvent, type ReactNode } from "react";

import { KidsUserBadge } from "./kids-user-badge";
import styles from "./kids-activity-shell.module.css";

export interface KidsActivityShellProps {
  title: string;
  instruction?: string;
  backHref?: string;
  soundEnabled?: boolean;
  onSoundToggle?: () => void;
  settings?: ReactNode;
  children: ReactNode;
}

export function KidsActivityShell({
  title,
  instruction,
  backHref = "/kids",
  soundEnabled,
  onSoundToggle,
  settings,
  children,
}: KidsActivityShellProps) {
  const settingsDialogRef = useRef<HTMLDialogElement>(null);

  const closeSettings = () => settingsDialogRef.current?.close();
  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) closeSettings();
  };

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link className={styles.back} href={backHref} aria-label="返回一程一成长">
          <ArrowLeft aria-hidden="true" size={20} />
        </Link>
        <div className={styles.heading}>
          <strong>{title}</strong>
          {instruction ? <span>{instruction}</span> : null}
        </div>
        <div className={styles.actions}>
          <KidsUserBadge />
          {onSoundToggle ? (
            <button type="button" aria-label={soundEnabled ? "关闭声音" : "打开声音"} title={soundEnabled ? "关闭声音" : "打开声音"} onClick={onSoundToggle}>
              {soundEnabled ? <Volume2 aria-hidden="true" size={19} /> : <VolumeX aria-hidden="true" size={19} />}
            </button>
          ) : null}
          {settings ? (
            <button type="button" aria-label="打开家长设置" title="家长设置" onClick={() => settingsDialogRef.current?.showModal()}>
              <Settings2 aria-hidden="true" size={19} />
            </button>
          ) : null}
        </div>
      </header>
      <main className={styles.main}>{children}</main>
      {settings ? (
        <dialog className={styles.dialog} ref={settingsDialogRef} aria-labelledby="kids-activity-settings-title" onClick={handleBackdropClick}>
          <header>
            <h2 id="kids-activity-settings-title">家长设置</h2>
            <button type="button" aria-label="关闭家长设置" title="关闭" onClick={closeSettings}><X aria-hidden="true" size={20} /></button>
          </header>
          <div className={styles.dialogBody}>{settings}</div>
        </dialog>
      ) : null}
    </div>
  );
}
