/**
 * 字体下载脚本
 *
 * 从 CDN 下载 woff2 字体文件到 public/fonts/。
 * 优先使用中国可访问的镜像源，失败后回退到官方源。
 *
 * 用法：node scripts/download-fonts.mjs
 *
 * 下载的字体对应 app/lib/fonts.ts 中定义的 files 配置。
 * 如需添加新字体，请同时更新 fonts.ts 和此脚本。
 */

import { mkdirSync, existsSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = join(__dirname, "..", "public", "fonts");

// ─── 下载工具 ────────────────────────────────────────────

async function downloadFile(url, dest) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buffer);
}

async function downloadWithRetry(url, dest, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      await downloadFile(url, dest);
      return true;
    } catch (err) {
      if (i < retries) {
        await new Promise((r) => setTimeout(r, 1000));
      } else {
        console.warn(`  ✗ ${err.message} <- ${url}`);
        return false;
      }
    }
  }
}

// ─── Google Fonts CSS 解析（支持镜像） ────────────────────

const GFONTS_MIRRORS = [
  "https://fonts.loli.net",    // loli.net 镜像（中国可用）
  "https://fonts.googleapis.com", // 官方源
];

const GSTATIC_MIRRORS = [
  "https://gstatic.loli.net",    // loli.net gstatic 镜像
  "https://fonts.gstatic.com",   // 官方源
];

async function fetchGoogleFontsCSS(family, weight) {
  const query = `family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;

  for (const mirror of GFONTS_MIRRORS) {
    try {
      const res = await fetch(`${mirror}/css2?${query}`, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      });
      if (res.ok) {
        const css = await res.text();
        // 替换 gstatic 域名为镜像
        let finalCss = css;
        if (mirror.includes("loli.net")) {
          finalCss = css.replace(/fonts\.gstatic\.com/g, "gstatic.loli.net");
        }
        return finalCss;
      }
    } catch {
      continue;
    }
  }
  return null;
}

function extractFontUrls(css) {
  // 优先提取 woff2，其次 ttf
  const woff2 = [...css.matchAll(/url\((https?:\/\/[^)]+\.woff2)\)/g)].map((m) => m[1]);
  if (woff2.length > 0) return { urls: woff2, format: "woff2" };

  const ttf = [...css.matchAll(/url\((https?:\/\/[^)]+\.ttf)\)/g)].map((m) => m[1]);
  if (ttf.length > 0) return { urls: ttf, format: "ttf" };

  return { urls: [], format: null };
}

async function downloadFromGoogleFonts(family, weights, destPrefix) {
  const results = [];

  for (const weight of weights) {
    const dest = join(FONTS_DIR, `${destPrefix}-${weight}.woff2`);
    const destTtf = join(FONTS_DIR, `${destPrefix}-${weight}.ttf`);

    // 如果 woff2 或 ttf 已存在，跳过
    if (existsSync(dest)) {
      console.log(`  ✓ ${destPrefix}-${weight}.woff2 (已存在)`);
      results.push(true);
      continue;
    }
    if (existsSync(destTtf)) {
      console.log(`  ✓ ${destPrefix}-${weight}.ttf (已存在)`);
      results.push(true);
      continue;
    }

    const css = await fetchGoogleFontsCSS(family, weight);
    if (!css) {
      console.warn(`  ✗ 无法获取 CSS: ${family} ${weight}`);
      results.push(false);
      continue;
    }

    const { urls, format } = extractFontUrls(css);
    if (urls.length === 0) {
      console.warn(`  ✗ 未找到字体 URL: ${family} ${weight}`);
      results.push(false);
      continue;
    }

    // 下载包含 CJK 字符的分片（通常是最大的那个，或最后一个）
    const cjkUrl = urls[urls.length - 1];
    const finalDest = format === "woff2" ? dest : destTtf;
    const ok = await downloadWithRetry(cjkUrl, finalDest);
    if (ok) {
      const ext = format === "woff2" ? "woff2" : "ttf";
      console.log(`  ✓ ${destPrefix}-${weight}.${ext}`);
    }
    results.push(ok);
  }

  return results.every(Boolean);
}

// ─── GitHub 下载（通过 jsDelivr CDN） ────────────────────

async function downloadFromJsDelivr(repo, tag, path, dest) {
  if (existsSync(dest)) {
    console.log(`  ✓ ${dest} (已存在)`);
    return true;
  }
  const url = `https://cdn.jsdelivr.net/gh/${repo}@${tag}/${path}`;
  return downloadWithRetry(url, dest);
}

// ─── 直接 URL 下载 ────────────────────────────────────────

async function downloadFromUrl(url, dest) {
  if (existsSync(dest)) {
    console.log(`  ✓ 已存在: ${dest}`);
    return true;
  }
  return downloadWithRetry(url, dest);
}

// ─── 主下载流程 ──────────────────────────────────────────

async function main() {
  console.log("Covercast 字体下载工具");
  console.log("══════════════════════\n");

  if (!existsSync(FONTS_DIR)) {
    mkdirSync(FONTS_DIR, { recursive: true });
    console.log(`创建目录: ${FONTS_DIR}\n`);
  }

  let success = 0;
  let skipped = 0;
  let failed = 0;

  // ─── Google Fonts 字体（自动下载） ─────────────────────

  const gfonts = [
    { family: "Noto Sans SC", weights: [400, 700, 900], prefix: "noto-sans-sc", label: "思源黑体" },
    { family: "Noto Serif SC", weights: [400, 700, 900], prefix: "noto-serif-sc", label: "思源宋体" },
    { family: "ZCOOL KuaiLe", weights: [400], prefix: "zcool-kuaile", label: "站酷快乐体" },
    { family: "ZCOOL QingKe HuangYou", weights: [400], prefix: "zcool-qingke", label: "站酷高端黑" },
    { family: "ZCOOL XiaoWei", weights: [400], prefix: "zcool-xiaowei", label: "站酷文艺体" },
    { family: "Fira Code", weights: [400, 700], prefix: "fira-code", label: "Fira Code" },
    { family: "JetBrains Mono", weights: [400, 700], prefix: "jetbrains-mono", label: "JetBrains Mono" },
    { family: "Inter", weights: [400, 700, 900], prefix: "inter", label: "Inter" },
    { family: "Montserrat", weights: [400, 700, 900], prefix: "montserrat", label: "Montserrat" },
    { family: "Playfair Display", weights: [400, 700, 900], prefix: "playfair-display", label: "Playfair Display" },
    { family: "Pacifico", weights: [400], prefix: "pacifico", label: "Pacifico" },
    { family: "Bebas Neue", weights: [400], prefix: "bebas-neue", label: "Bebas Neue" },
  ];

  for (const { family, weights, prefix, label } of gfonts) {
    console.log(`▸ ${label} / ${family}`);
    const ok = await downloadFromGoogleFonts(family, weights, prefix);
    ok ? success++ : failed++;
  }

  // ─── 需手动下载的字体 ──────────────────────────────────

  const manual = [
    {
      label: "阿里巴巴普惠体",
      instructions: [
        "1. 访问 https://fonts.alibabagroup.com/",
        "2. 下载 TTF 文件",
        "3. 转为 woff2（可用 cloudconvert.com/ttf-to-woff2）",
        "4. 重命名为 alibaba-puhuiti-{400,700,900}.woff2 放入 public/fonts/",
      ],
    },
    {
      label: "优设标题黑",
      instructions: [
        "1. 搜索下载 YouSheBiaoTiHei TTF",
        "2. 转为 woff2",
        "3. 重命名为 youshe-biaoti-400.woff2 放入 public/fonts/",
      ],
    },
    {
      label: "等距更纱黑体 / Sarasa Mono SC",
      instructions: [
        "1. 访问 https://github.com/be5invis/Sarasa-Gothic/releases",
        "2. 下载 SarasaMonoSC 字体包",
        "3. 提取 Regular 和 Bold 字重，转为 woff2",
        "4. 重命名为 sarasa-mono-sc-{400,700}.woff2 放入 public/fonts/",
      ],
    },
  ];

  for (const { label, instructions } of manual) {
    console.log(`▸ ${label}`);
    console.log("  ⚠ 需手动下载：");
    for (const line of instructions) {
      console.log(`    ${line}`);
    }
    skipped++;
  }

  // ─── 汇总 ───────────────────────────────────────────────
  console.log("\n══════════════════════");
  console.log(`下载完成: ${success} 成功, ${skipped} 需手动, ${failed} 失败`);

  if (failed > 0) {
    console.log("\n提示：如果因网络问题下载失败，可以：");
    console.log("  1. 设置代理后重新运行: set HTTPS_PROXY=http://127.0.0.1:7890 && node scripts/download-fonts.mjs");
    console.log("  2. 手动下载字体文件并放入 public/fonts/");
  }
}

main().catch((err) => {
  console.error("脚本执行出错:", err);
  process.exit(1);
});
