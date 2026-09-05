"use client";

import { ArrowLeft, Eye, EyeOff, LockKeyhole, LogIn, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { MOCK_ORANGE_ACCOUNT, MOCK_ORANGE_PASSWORD } from "@/lib/kids/session";

import { useKidsAuth } from "./kids-auth-provider";
import styles from "./kids-login.module.css";

function getSafeNextHref() {
  const candidate = new URLSearchParams(window.location.search).get("next");
  if (!candidate || !candidate.startsWith("/kids") || candidate.startsWith("//") || candidate.startsWith("/kids/login")) return "/kids";
  return candidate;
}

export function KidsLogin() {
  const router = useRouter();
  const { login, status } = useKidsAuth();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") router.replace(getSafeNextHref());
  }, [router, status]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!account.trim() || !password) {
      setError("请输入账号和密码");
      return;
    }
    setPending(true);
    setError("");
    const result = await login(account, password);
    setPending(false);
    if (!result.ok) {
      setError(result.message ?? "登录失败，请重试");
      return;
    }
    router.replace(getSafeNextHref());
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/kids" aria-label="返回一程一成长首页">
          <span className={styles.brandMark} aria-hidden="true"><img src="/kids/logo.webp" alt="" /></span>
          <span><strong>一程一成长</strong><small>每天一点，慢慢会</small></span>
        </Link>
        <Link className={styles.back} href="/kids"><ArrowLeft aria-hidden="true" size={16} />返回首页</Link>
      </header>

      <main className={styles.main}>
        <section className={styles.accountIntro} aria-labelledby="kids-login-title">
          <div className={styles.orangeMark} aria-hidden="true">橙</div>
          <p>测试儿童账号</p>
          <h1 id="kids-login-title">登录橙子小朋友</h1>
          <span>登录后，互动探究中的探索足迹和作品会归入橙子的独立兴趣空间。数学和拼音打印工具不会记录这些信息。</span>
          <dl className={styles.credentials} aria-label="橙子小朋友测试账号">
            <div><dt>账号</dt><dd>{MOCK_ORANGE_ACCOUNT}</dd></div>
            <div><dt>密码</dt><dd>{MOCK_ORANGE_PASSWORD}</dd></div>
          </dl>
        </section>

        <section className={styles.formSection} aria-label="登录表单">
          <div className={styles.formHeading}>
            <p>兴趣空间账号</p>
            <h2>输入账号后继续探究</h2>
          </div>
          <form className={styles.form} noValidate onSubmit={handleSubmit}>
            <label htmlFor="kids-account">账号</label>
            <div className={styles.field}>
              <UserRound aria-hidden="true" size={18} />
              <input
                id="kids-account"
                name="account"
                type="text"
                autoComplete="username"
                value={account}
                aria-invalid={Boolean(error)}
                onChange={(event) => { setAccount(event.target.value); setError(""); }}
              />
            </div>

            <label htmlFor="kids-password">密码</label>
            <div className={styles.field}>
              <LockKeyhole aria-hidden="true" size={18} />
              <input
                id="kids-password"
                name="password"
                type={passwordVisible ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "kids-login-error" : undefined}
                onChange={(event) => { setPassword(event.target.value); setError(""); }}
              />
              <button type="button" aria-label={passwordVisible ? "隐藏密码" : "显示密码"} title={passwordVisible ? "隐藏密码" : "显示密码"} onClick={() => setPasswordVisible((visible) => !visible)}>
                {passwordVisible ? <EyeOff aria-hidden="true" size={17} /> : <Eye aria-hidden="true" size={17} />}
              </button>
            </div>

            <p className={styles.error} id="kids-login-error" role="alert">{error}</p>
            <button className={styles.submit} type="submit" disabled={pending || status === "loading"}>
              <LogIn aria-hidden="true" size={17} />
              {pending ? "正在登录…" : "登录"}
            </button>
          </form>
          <small className={styles.notice}>这是当前阶段的本机测试账号，不会向服务器发送账号或密码。</small>
        </section>
      </main>
    </div>
  );
}
