/**
 * 字体下载脚本
 *
 * 从 Google Fonts 下载 woff2 字体到 public/fonts/，
 * 并生成 app/styles/fonts.css 包含所有 @font-face 声明。
 *
 * 中文字体：从 GitHub releases 下载完整 woff2 文件（不分片）
 * 英文字体：从 Google Fonts CSS API 下载
 *
 * 用法：
 *   直接运行：node scripts/download-fonts.mjs
 *   使用代理：set HTTPS_PROXY=http://127.0.0.1:7890 && node scripts/download-fonts.mjs
 */

import { mkdirSync, existsSync, writeFileSync, readdirSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { EnvHttpProxyAgent, setGlobalDispatcher } from "undici";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = join(__dirname, "..", "public", "fonts");
const CSS_PATH = join(__dirname, "..", "app", "styles", "fonts.css");

// ─── 代理支持 ────────────────────────────────────────────
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
if (proxyUrl) {
  console.log(`使用代理: ${proxyUrl}\n`);
  setGlobalDispatcher(new EnvHttpProxyAgent());
}

// ─── 下载工具 ────────────────────────────────────────────

async function downloadFile(url, dest) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buffer);
  return buffer.length;
}

async function downloadWithRetry(url, dest, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await downloadFile(url, dest);
    } catch (err) {
      if (i < retries) {
        await new Promise((r) => setTimeout(r, 1000));
      } else {
        console.warn(`  ✗ ${err.message} <- ${url}`);
        return null;
      }
    }
  }
}



// ─── 下载字体（通过 gwfh API 获取完整 woff2） ─────────────

/**
 * 通过 google-webfonts-helper API 获取字体的完整 woff2 文件
 * 该 API 返回按子集（subset）合并的完整字体，而非 unicode-range 分片
 * 中文字体使用 chinese-simplified 子集，英文字体使用 latin 子集
 */
async function downloadFont(family, weights, prefix, label, subset = "latin") {
  const allFaces = [];
  let totalSize = 0;

  // 从 gwfh API 获取字体信息
  const fontId = family.toLowerCase().replace(/\s+/g, "-");
  const apiUrl = `https://gwfh.mranftl.com/api/fonts/${fontId}?subsets=${subset}`;

  let fontInfo;
  try {
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    fontInfo = await res.json();
  } catch (err) {
    console.warn(`  ✗ 无法获取字体信息: ${err.message}`);
    return false;
  }

  // 构建 weight -> variant 映射
  const variantMap = new Map();
  for (const v of fontInfo.variants) {
    const w = v.fontWeight;
    if (!variantMap.has(w)) variantMap.set(w, v);
  }

  for (const weight of weights) {
    const variant = variantMap.get(String(weight));
    if (!variant || !variant.woff2) {
      console.warn(`  ✗ 未找到字重 ${weight} 的 woff2: ${family}`);
      return false;
    }

    const filename = `${prefix}-${weight}.woff2`;
    const dest = join(FONTS_DIR, filename);

    if (existsSync(dest)) {
      const { statSync } = await import("fs");
      totalSize += statSync(dest).size;
      console.log(`  ✓ ${filename} (已存在)`);
    } else {
      const size = await downloadWithRetry(variant.woff2, dest);
      if (size === null) {
        console.warn(`  ✗ 下载失败: ${family} ${weight}`);
        return false;
      }
      totalSize += size;
      console.log(`  ✓ ${filename}`);
    }

    allFaces.push({
      family,
      weight: String(weight),
      style: "normal",
      display: "swap",
      filename,
      format: "woff2",
    });
  }

  const sizeMB = (totalSize / 1024 / 1024).toFixed(1);
  console.log(`  合计: ${allFaces.length} 文件, ${sizeMB} MB`);
  return allFaces;
}

// ─── 生成 fonts.css ──────────────────────────────────────

function generateCSS(allFontFaces) {
  let css = `/**
 * Web 字体声明（由 scripts/download-fonts.mjs 自动生成）
 *
 * 重新生成：node scripts/download-fonts.mjs
 */\n\n`;

  for (const face of allFontFaces) {
    css += `@font-face {\n`;
    css += `  font-family: "${face.family}";\n`;
    css += `  font-weight: ${face.weight};\n`;
    css += `  font-style: ${face.style};\n`;
    css += `  font-display: ${face.display};\n`;
    css += `  src: url("/fonts/${face.filename}") format("${face.format}");\n`;
    css += `}\n\n`;
  }

  return css;
}

// ─── 清理旧文件 ──────────────────────────────────────────

function cleanOldFiles() {
  if (!existsSync(FONTS_DIR)) return;
  const files = readdirSync(FONTS_DIR);
  let count = 0;
  for (const file of files) {
    // 删除分片文件（含 -数字.woff2 或 -数字.ttf 模式，如 noto-sans-sc-400-0.woff2）
    // 也删除旧的 Google Fonts CSS API 下载的带版本号的文件
    if (/-\d+\.(woff2|ttf)$/.test(file) || /-v\d+/.test(file)) {
      unlinkSync(join(FONTS_DIR, file));
      count++;
    }
  }
  if (count > 0) console.log(`  清理了 ${count} 个旧文件`);
}

// ─── 主下载流程 ──────────────────────────────────────────

async function main() {
  console.log("Covercast 字体下载工具");
  console.log("══════════════════════\n");

  if (!existsSync(FONTS_DIR)) {
    mkdirSync(FONTS_DIR, { recursive: true });
    console.log(`创建目录: ${FONTS_DIR}\n`);
  }

  // 清理旧分片文件
  console.log("清理旧分片文件...");
  cleanOldFiles();
  console.log("");

  let success = 0;

  let failed = 0;
  const allFontFaces = [];

  // 中文字体（chinese-simplified 子集）
  const cjkFonts = [
    { family: "Noto Sans SC", weights: [400, 700, 900], prefix: "noto-sans-sc", label: "思源黑体", subset: "chinese-simplified" },
    { family: "Noto Serif SC", weights: [400, 700, 900], prefix: "noto-serif-sc", label: "思源宋体", subset: "chinese-simplified" },
    { family: "ZCOOL KuaiLe", weights: [400], prefix: "zcool-kuaile", label: "站酷快乐体", subset: "chinese-simplified" },
    { family: "ZCOOL QingKe HuangYou", weights: [400], prefix: "zcool-qingke", label: "站酷高端黑", subset: "chinese-simplified" },
    { family: "ZCOOL XiaoWei", weights: [400], prefix: "zcool-xiaowei", label: "站酷文艺体", subset: "chinese-simplified" },
  ];

  // 英文字体（latin 子集）
  const latinFonts = [
    { family: "Fira Code", weights: [400, 700], prefix: "fira-code", label: "Fira Code", subset: "latin" },
    { family: "JetBrains Mono", weights: [400, 700], prefix: "jetbrains-mono", label: "JetBrains Mono", subset: "latin" },
    { family: "Inter", weights: [400, 700, 900], prefix: "inter", label: "Inter", subset: "latin" },
    { family: "Montserrat", weights: [400, 700, 900], prefix: "montserrat", label: "Montserrat", subset: "latin" },
    { family: "Playfair Display", weights: [400, 700, 900], prefix: "playfair-display", label: "Playfair Display", subset: "latin" },
    { family: "Pacifico", weights: [400], prefix: "pacifico", label: "Pacifico", subset: "latin" },
    { family: "Bebas Neue", weights: [400], prefix: "bebas-neue", label: "Bebas Neue", subset: "latin" },
  ];

  // 下载中文字体
  console.log("── 中文字体 ──\n");
  for (const { family, weights, prefix, label, subset } of cjkFonts) {
    console.log(`▸ ${label} / ${family}`);
    const result = await downloadFont(family, weights, prefix, label, subset);
    if (result) {
      allFontFaces.push(...result);
      success++;
    } else {
      failed++;
    }
  }

  // 下载英文字体
  console.log("\n── 英文/其他字体 ──\n");
  for (const { family, weights, prefix, label, subset } of latinFonts) {
    console.log(`▸ ${label} / ${family}`);
    const result = await downloadFont(family, weights, prefix, label, subset);
    if (result) {
      allFontFaces.push(...result);
      success++;
    } else {
      failed++;
    }
  }

  // 生成 fonts.css
  if (allFontFaces.length > 0) {
    const css = generateCSS(allFontFaces);
    writeFileSync(CSS_PATH, css);
    console.log(`\n已生成: ${CSS_PATH}`);
  }

  // 汇总
  console.log("\n══════════════════════");
  console.log(`下载完成: ${success} 成功, ${failed} 失败`);
  console.log("\n注意：阿里巴巴普惠体、优设标题黑、等距更纱黑体为手动托管字体，");
  console.log("      不由此脚本下载，其 @font-face 声明需在 fonts.css 中手动维护。");

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
