"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";

import { toolDefinitions } from "@/lib/tools/registry";

import { PulseShell } from "./pulse-shell";
import { HomePhysicsLab } from "./home-physics-lab";
import { ToolIcon } from "./tool-icon";

const productPrinciples = [
  {
    label: "无需登录",
    detail: "打开即用，不建立账号体系。",
  },
  {
    label: "本地处理",
    detail: "文本和图片不上传到服务器。",
  },
  {
    label: "始终免费",
    detail: "当前工具无需付费即可使用。",
  },
];

const homeSlides = [
  { src: "/home-carousel/01_glass_pebble_master.webp", alt: "阳光下的半透明玻璃圆石" },
  { src: "/home-carousel/01_paper_topography_master.webp", alt: "层叠起伏的白色纸艺" },
  { src: "/home-carousel/02_ceramic_calm.webp", alt: "嵌有镜面的白色陶瓷圆环" },
  { src: "/home-carousel/02_glass_ribbon.webp", alt: "阳光下弯曲的透明玻璃缎带" },
  { src: "/home-carousel/03_frosted_layers.webp", alt: "层叠的半透明磨砂玻璃" },
  { src: "/home-carousel/03_sunlit_gallery.webp", alt: "安静明亮的日光展厅" },
  { src: "/home-carousel/04_prism_arch.webp", alt: "半透明玻璃拱门" },
  { src: "/home-carousel/04_water_ripples.webp", alt: "带有水波纹理的白色圆盘" },
  { src: "/home-carousel/05_linen_fold.webp", alt: "柔和起伏的亚麻织物" },
  { src: "/home-carousel/06_pale_moon_wall.webp", alt: "墙面上的淡蓝月影" },
  { src: "/home-carousel/09_orbital_ring.webp", alt: "悬浮的半透明轨道圆环" },
  { src: "/home-carousel/10_silica_cube.webp", alt: "阳光下的半透明硅石方块" },
  { src: "/home-carousel/11_cloud_capsule.webp", alt: "柔和透明的云状胶囊" },
  { src: "/home-carousel/12_soft_spiral.webp", alt: "半透明的柔和螺旋造型" },
] as const;

export function HomeExperience() {
  const reducedMotion = useReducedMotion() ?? false;
  const carouselStageRef = useRef<HTMLDivElement>(null);
  const tiltFrameRef = useRef<number | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);

  useEffect(() => {
    if (reducedMotion || carouselPaused) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % homeSlides.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [carouselPaused, reducedMotion]);

  useEffect(() => () => {
    if (tiltFrameRef.current) {
      window.cancelAnimationFrame(tiltFrameRef.current);
    }
  }, []);

  const showPreviousSlide = () => {
    setActiveSlide((current) => (current - 1 + homeSlides.length) % homeSlides.length);
  };

  const showNextSlide = () => {
    setActiveSlide((current) => (current + 1) % homeSlides.length);
  };

  const updateCarouselTilt = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (reducedMotion || window.matchMedia("(max-width: 900px), (pointer: coarse)").matches) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const horizontal = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const vertical = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;

    if (tiltFrameRef.current) {
      window.cancelAnimationFrame(tiltFrameRef.current);
    }
    tiltFrameRef.current = window.requestAnimationFrame(() => {
      carouselStageRef.current?.style.setProperty("--carousel-rotate-x", `${1 - vertical * 1.5}deg`);
      carouselStageRef.current?.style.setProperty("--carousel-rotate-y", `${-2 + horizontal * 2.5}deg`);
    });
  };

  const resetCarouselTilt = () => {
    if (tiltFrameRef.current) {
      window.cancelAnimationFrame(tiltFrameRef.current);
    }
    tiltFrameRef.current = window.requestAnimationFrame(() => {
      carouselStageRef.current?.style.removeProperty("--carousel-rotate-x");
      carouselStageRef.current?.style.removeProperty("--carousel-rotate-y");
    });
  };

  return (
    <PulseShell surface="home">
      <div className="zhiye-product-home">
        <header className="zhiye-product-nav">
          <Link href="/" className="zhiye-product-brand" aria-label="知页首页">
            知页
          </Link>
          <nav aria-label="首页导航">
            <a href="#about">关于知页</a>
            <a href="#principles">产品原则</a>
            <Link href="/tools">工作台</Link>
          </nav>
          <div className="zhiye-product-nav__actions">
            <a
              href="https://github.com/ljchengx/zhiye"
              className="zhiye-product-nav__github"
              target="_blank"
              rel="noreferrer"
              aria-label="在 GitHub 查看知页源码"
              title="GitHub"
            >
              <span className="zhiye-product-nav__github-mark" aria-hidden="true" />
            </a>
            <Link href="/tools" className="zhiye-product-nav__cta">
              进入工作台
              <ArrowRight aria-hidden="true" size={16} strokeWidth={1.8} />
            </Link>
          </div>
        </header>

        <main>
          <section className="zhiye-product-hero" id="about" aria-labelledby="home-title">
            <motion.div
              className="zhiye-product-hero__copy"
              initial={{ opacity: 0, y: reducedMotion ? 0 : 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.44 }}
            >
              <p className="zhiye-product-kicker">知页 / 浏览器本地工具</p>
              <h1 id="home-title">
                把琐碎处理，<br />
                留在<span>这一页</span>。
              </h1>
              <p>
                在线处理 JSON、Base64、Markdown、时间戳与图片水印，数据留在浏览器本地。
              </p>
              <div className="zhiye-product-hero__actions">
                <Link href="/tools" className="zhiye-product-primary">
                  进入工作台
                  <ArrowRight aria-hidden="true" size={17} strokeWidth={1.85} />
                </Link>
                <a href="#principles" className="zhiye-product-secondary">了解知页</a>
              </div>
              <ul aria-label="知页产品承诺">
                {productPrinciples.map((principle) => (
                  <li key={principle.label}>
                    <Check aria-hidden="true" size={14} strokeWidth={2.1} />
                    {principle.label}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="zhiye-product-hero__physics"
              initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reducedMotion ? 0 : 0.55, delay: reducedMotion ? 0 : 0.08 }}
            >
              <HomePhysicsLab placement="hero" />
            </motion.div>
          </section>

          <section className="zhiye-product-intro" aria-label="知页简介">
            <p>不是堆叠功能的工具站。</p>
            <h2>每一个工具，都只解决一个常见问题。</h2>
            <span>需要使用时进入工作台，选择工具后直接处理。</span>
          </section>

          <section className="zhiye-product-gallery" aria-label="知页视觉展示区">
            <div className="zhiye-product-gallery__copy">
              <p>本地处理</p>
              <h2>内容留在浏览器，<br />处理止于这一页。</h2>
              <span>知页不建立账号体系，也不把输入内容发送到服务器。打开工具后即可处理，完成后直接带走结果。</span>
              <ul aria-label="知页本地处理说明">
                {productPrinciples.map((principle) => (
                  <li key={principle.label}>
                    <Check aria-hidden="true" size={14} strokeWidth={2.1} />
                    <span><strong>{principle.label}</strong>{principle.detail}</span>
                  </li>
                ))}
              </ul>
              <Link href="/tools" className="zhiye-product-gallery__action">
                进入工作台
                <ArrowRight aria-hidden="true" size={16} strokeWidth={1.8} />
              </Link>
            </div>
            <motion.div
              className="zhiye-product-hero__visual-shell"
              initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.18 }}
              transition={{ duration: reducedMotion ? 0 : 0.5 }}
            >
              <div
                ref={carouselStageRef}
                className="zhiye-product-hero__visual"
                role="region"
                aria-roledescription="轮播图"
                aria-label="知页视觉展示"
                tabIndex={0}
                onMouseMove={updateCarouselTilt}
                onMouseEnter={() => setCarouselPaused(true)}
                onMouseLeave={() => {
                  setCarouselPaused(false);
                  resetCarouselTilt();
                }}
                onFocus={() => setCarouselPaused(true)}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) {
                    setCarouselPaused(false);
                    resetCarouselTilt();
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowLeft") showPreviousSlide();
                  if (event.key === "ArrowRight") showNextSlide();
                }}
              >
                <div className="zhiye-product-carousel__track" style={{ transform: `translate3d(-${activeSlide * 100}%, 0, 0)` }}>
                  {homeSlides.map((slide, index) => (
                    <div className="zhiye-product-carousel__slide" key={slide.src} aria-hidden={index !== activeSlide}>
                      <img src={slide.src} alt="" loading={index < 2 ? "eager" : "lazy"} />
                    </div>
                  ))}
                </div>
                <div className="zhiye-product-carousel__dots" aria-label="选择展示图片">
                  {homeSlides.map((slide, index) => (
                    <button
                      type="button"
                      key={slide.src}
                      className={index === activeSlide ? "is-active" : ""}
                      onClick={() => setActiveSlide(index)}
                      aria-label={`查看第 ${index + 1} 张图片`}
                      aria-current={index === activeSlide ? "true" : undefined}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </section>

          <section className="zhiye-product-principles" id="principles" aria-labelledby="principles-title">
            <header>
              <p>产品原则</p>
              <h2 id="principles-title">少一点步骤，多一点确定性。</h2>
            </header>
            <div>
              {productPrinciples.map((principle, index) => (
                <article key={principle.label}>
                  <span>0{index + 1}</span>
                  <h3>{principle.label}</h3>
                  <p>{principle.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="zhiye-product-tools" aria-labelledby="tools-title">
            <header>
              <div>
                <p>工作台</p>
                <h2 id="tools-title">为手边的实际任务准备。</h2>
              </div>
              <Link href="/tools">
                查看全部工具
                <ArrowRight aria-hidden="true" size={16} strokeWidth={1.8} />
              </Link>
            </header>
            <div className="zhiye-product-tool-grid">
              {toolDefinitions.map((tool, index) => (
                <article key={tool.slug} className={`zhiye-product-tool-card zhiye-product-tool-card--${tool.accent}`}>
                  <Link href={`/${tool.path}`} aria-label={`打开${tool.title}`}>
                    <span className="zhiye-product-tool-card__number">0{index + 1}</span>
                    <span className="zhiye-product-tool-card__icon"><ToolIcon name={tool.icon} size={24} strokeWidth={1.45} /></span>
                    <h3>{tool.title}</h3>
                    <p>{tool.description}</p>
                    <span className="zhiye-product-tool-card__action">
                      打开工具
                      <ArrowRight aria-hidden="true" size={16} strokeWidth={1.8} />
                    </span>
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section className="zhiye-product-seo" aria-labelledby="home-seo-title">
            <div className="zhiye-product-seo__intro">
              <p>浏览器本地工具</p>
              <h2 id="home-seo-title">免费在线工具，处理留在浏览器。</h2>
              <span>
                知页提供 Base64 编解码、JSON 格式化、Markdown 清理、时间戳转换和图片水印等常用工具。
                无需注册或上传，支持在浏览器本地处理文本、数据与图片。
              </span>
            </div>
            <ul aria-label="知页工具说明">
              {toolDefinitions.map((tool) => (
                <li key={tool.slug}>
                  <Link href={`/${tool.path}`}>
                    <span className="zhiye-product-seo__tool-title">{tool.title}</span>
                    <span>{tool.seo.summary}</span>
                    <ArrowRight aria-hidden="true" size={16} strokeWidth={1.8} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="zhiye-product-cta" aria-labelledby="cta-title">
            <div>
              <p>准备开始</p>
              <h2 id="cta-title">从一个具体问题开始。</h2>
              <span>打开工作台，选择所需工具，即刻处理。</span>
            </div>
            <Link href="/tools">
              进入工作台
              <ArrowRight aria-hidden="true" size={17} strokeWidth={1.85} />
            </Link>
          </section>
        </main>

        <footer className="zhiye-product-footer">
          <span>知页</span>
          <p>聪明处理，止于本页。</p>
          <small>浏览器本地工具</small>
        </footer>
      </div>
    </PulseShell>
  );
}
