import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Covercast — 直播背景编辑器",
  description:
    "Covercast 是一款开源的直播室背景编辑器，专为竖屏直播间设计。支持拖拽编辑、SVG 渲染、OBS 浏览器源接入，内置多套场景模板，让直播背景制作变得简单高效。",
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Covercast",
    description:
      "Covercast 是一款开源的直播室背景编辑器，专为竖屏直播间设计。支持拖拽编辑、SVG 渲染、OBS 浏览器源接入，内置多套场景模板。",
    url: "https://covercast.vercel.app",
    applicationCategory: "DesignApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "CNY",
    },
    author: {
      "@type": "Organization",
      name: "陆向谦实验室",
      url: "https://www.lulabs.org/zh",
    },
    license: "https://github.com/lulabs-org/covercast/blob/main/LICENSE",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main
      style={{
        minHeight: "100dvh",
        background: "var(--background)",
        color: "var(--foreground)",
        fontFamily:
          '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", Arial, Helvetica, sans-serif',
      }}
    >
      <header
        style={{
          position: "relative",
          zIndex: 10,
          borderBottom: "1px solid rgba(217,224,238,0.6)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Image
              src="/covercast-logo.png"
              alt="Covercast Logo"
              width={32}
              height={32}
              style={{ borderRadius: 8, objectFit: "contain" }}
            />
            <span
              style={{ fontSize: 17, fontWeight: 900, color: "var(--foreground)", letterSpacing: "-0.3px" }}
            >
              Covercast
            </span>
          </div>
          <nav style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link
              href="https://github.com/lulabs-org/covercast"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link"
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
                color: "var(--muted)",
                textDecoration: "none",
                transition: "all 0.2s ease",
              }}
            >
              GitHub
            </Link>
            <Link
              href="/editor"
              className="nav-cta"
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 800,
                color: "#fff",
                textDecoration: "none",
                background: "linear-gradient(135deg, #2764f6 0%, #174ac6 100%)",
                boxShadow: "0 1px 2px rgba(39,100,246,0.15), 0 0 0 1px rgba(39,100,246,0.08)",
                transition: "all 0.2s ease",
              }}
            >
              进入编辑器
            </Link>
          </nav>
        </div>
      </header>

      <section
        style={{
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(39,100,246,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 60%, rgba(39,100,246,0.04) 0%, transparent 50%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.4,
            backgroundImage:
              "linear-gradient(rgba(39,100,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(39,100,246,0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            pointerEvents: "none",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black 0%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 60% at 50% 30%, black 0%, transparent 70%)",
          }}
        />

        <div
          style={{
            position: "relative",
            maxWidth: 1100,
            margin: "0 auto",
            padding: "96px 24px 80px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 40,
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 140,
                height: 140,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(39,100,246,0.12) 0%, transparent 70%)",
                filter: "blur(20px)",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: 200,
                height: 200,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(39,100,246,0.06) 0%, transparent 60%)",
                filter: "blur(40px)",
              }}
            />
            <Image
              src="/covercast-logo.png"
              alt="Covercast Logo"
              width={88}
              height={88}
              style={{
                position: "relative",
                borderRadius: 20,
                objectFit: "contain",
                filter: "drop-shadow(0 8px 24px rgba(39,100,246,0.2)) drop-shadow(0 2px 8px rgba(39,100,246,0.15))",
              }}
            />
          </div>

          <h1
            style={{
              fontSize: "clamp(36px, 5.5vw, 56px)",
              fontWeight: 900,
              lineHeight: 1.1,
              margin: "0 0 20px",
              letterSpacing: "-0.8px",
              background: "linear-gradient(135deg, #152033 0%, #2d3e5f 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            为直播间打造专业背景
          </h1>
          <p
            style={{
              fontSize: "clamp(17px, 2.2vw, 21px)",
              color: "var(--muted)",
              lineHeight: 1.7,
              maxWidth: 640,
              margin: "0 auto 40px",
              fontWeight: 400,
            }}
          >
            Covercast 是一款开源的直播室背景编辑器。默认画布为 941×1672，适合竖屏直播间；所有元素以 SVG 渲染，可通过 OBS「浏览器源」直接引入直播间。
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/editor"
              className="hero-primary-btn"
              style={{
                padding: "14px 28px",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 800,
                color: "#fff",
                textDecoration: "none",
                background: "linear-gradient(135deg, #2764f6 0%, #174ac6 100%)",
                boxShadow:
                  "0 4px 14px rgba(39,100,246,0.25), 0 1px 3px rgba(39,100,246,0.15), inset 0 1px 0 rgba(255,255,255,0.15)",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              开始使用
            </Link>
            <Link
              href="https://github.com/lulabs-org/covercast"
              target="_blank"
              rel="noopener noreferrer"
              className="hero-secondary-btn"
              style={{
                padding: "14px 28px",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 800,
                color: "var(--foreground)",
                textDecoration: "none",
                background: "var(--panel)",
                border: "1px solid rgba(217,224,238,0.8)",
                boxShadow:
                  "0 1px 3px rgba(21,32,51,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              查看源码
            </Link>
          </div>
        </div>
      </section>

      <section
        style={{
          position: "relative",
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 24px 96px",
        }}
      >
        <h2
          style={{
            fontSize: 28,
            fontWeight: 900,
            textAlign: "center",
            margin: "0 0 40px",
            letterSpacing: "-0.4px",
            background: "linear-gradient(135deg, #152033 0%, #2d3e5f 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          核心功能
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {[
            {
              title: "画布编辑",
              desc: "拖拽移动、缩放调整、属性面板精确定位，支持图层管理与快捷键操作。",
            },
            {
              title: "丰富元素",
              desc: "文字、矩形、椭圆、图片多种元素，支持渐变填充、圆角、描边与透明度设置。",
            },
            {
              title: "模板系统",
              desc: "内置 5 套常用直播场景模板，支持保存自定义模板到本地存储，随时套用。",
            },
            {
              title: "OBS 接入",
              desc: "一键生成浏览器源 URL，OBS 直接引入；多源管理，每个源独立场景互不干扰。",
            },
            {
              title: "实时预览",
              desc: "/live 页面每秒自动拉取最新场景，无需手动刷新，直播画面实时同步。",
            },
            {
              title: "灵活导出",
              desc: "支持导出 PNG、JPG、SVG 与模板 JSON，图片素材自动转为内联 base64。",
            },
          ].map((item, index) => (
            <div
              key={item.title}
              className="feature-card"
              style={{
                position: "relative",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 100%)",
                border: "1px solid rgba(217,224,238,0.6)",
                borderRadius: 14,
                padding: "28px",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(39,100,246,0.15) 50%, transparent 100%)",
                }}
              />
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background:
                    "linear-gradient(135deg, rgba(39,100,246,0.08) 0%, rgba(39,100,246,0.03) 100%)",
                  border: "1px solid rgba(39,100,246,0.1)",
                  display: "grid",
                  placeItems: "center",
                  marginBottom: 16,
                  fontSize: 14,
                  fontWeight: 800,
                  color: "var(--accent)",
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  margin: "0 0 10px",
                  color: "var(--foreground)",
                  letterSpacing: "-0.2px",
                }}
              >
                {item.title}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: "var(--muted)",
                  margin: 0,
                }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 24px 96px",
        }}
      >
        <div
          style={{
            position: "relative",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 100%)",
            border: "1px solid rgba(217,224,238,0.6)",
            borderRadius: 16,
            padding: "40px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 32,
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 1,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(39,100,246,0.12) 50%, transparent 100%)",
            }}
          />
          <div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 900,
                margin: "0 0 12px",
                letterSpacing: "-0.3px",
              }}
            >
              由陆向谦实验室开源
            </h2>
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.7,
                color: "var(--muted)",
                margin: "0 0 24px",
              }}
            >
              陆向谦实验室致力于通过项目式学习培养具备全球视野与创新精神的复合型人才。Covercast 是实验室开源工具系列的一员，欢迎 Star 与贡献。
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link
                href="https://www.lulabs.org/zh"
                target="_blank"
                rel="noopener noreferrer"
                className="lab-link"
                style={{
                  padding: "10px 18px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--accent)",
                  textDecoration: "none",
                  border: "1px solid rgba(39,100,246,0.15)",
                  background:
                    "linear-gradient(180deg, rgba(39,100,246,0.04) 0%, rgba(39,100,246,0.02) 100%)",
                  transition: "all 0.2s ease",
                }}
              >
                陆向谦实验室官网
              </Link>
              <Link
                href="https://github.com/lulabs-org/covercast"
                target="_blank"
                rel="noopener noreferrer"
                className="lab-link"
                style={{
                  padding: "10px 18px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--accent)",
                  textDecoration: "none",
                  border: "1px solid rgba(39,100,246,0.15)",
                  background:
                    "linear-gradient(180deg, rgba(39,100,246,0.04) 0%, rgba(39,100,246,0.02) 100%)",
                  transition: "all 0.2s ease",
                }}
              >
                GitHub 仓库
              </Link>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
            }}
          >
            <div
              style={{
                position: "relative",
                padding: 8,
                borderRadius: 16,
                background:
                  "linear-gradient(135deg, rgba(39,100,246,0.08) 0%, rgba(39,100,246,0.02) 100%)",
              }}
            >
              <Image
                src="/covercast-logo.png"
                alt="Covercast Logo"
                width={72}
                height={72}
                style={{
                  borderRadius: 14,
                  objectFit: "contain",
                  filter: "drop-shadow(0 4px 12px rgba(39,100,246,0.15))",
                }}
              />
            </div>
            <span style={{ color: "var(--muted)", fontSize: 20, opacity: 0.4 }}>
              ×
            </span>
            <div
              style={{
                position: "relative",
                padding: 8,
                borderRadius: 16,
                background:
                  "linear-gradient(135deg, rgba(21,32,51,0.06) 0%, rgba(21,32,51,0.02) 100%)",
              }}
            >
              <Image
                src="/lulabs-logo.png"
                alt="陆向谦实验室 Logo"
                width={72}
                height={72}
                style={{
                  borderRadius: 14,
                  objectFit: "contain",
                  filter: "drop-shadow(0 4px 12px rgba(21,32,51,0.1))",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <footer
        style={{
          borderTop: "1px solid rgba(217,224,238,0.5)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 100%)",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "32px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: "var(--muted)",
              margin: 0,
              opacity: 0.8,
            }}
          >
            © {new Date().getFullYear()} Covercast — 陆向谦实验室开源项目
          </p>
          <div style={{ display: "flex", gap: 20 }}>
            <Link
              href="https://github.com/lulabs-org/covercast"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
              style={{
                fontSize: 13,
                color: "var(--muted)",
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
            >
              GitHub
            </Link>
            <Link
              href="https://www.lulabs.org/zh"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
              style={{
                fontSize: 13,
                color: "var(--muted)",
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
            >
              陆向谦实验室
            </Link>
          </div>
        </div>
      </footer>
    </main>
    </>
  );
}
