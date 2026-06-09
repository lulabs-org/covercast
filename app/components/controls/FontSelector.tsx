"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FONT_CATEGORY_ORDER,
  FONT_PREVIEW_TEXT,
  isWebFont,
  type FontCategory,
  type FontDefinition,
  type LocalFontEntry,
} from "../../lib/fonts";
import s from "./FontSelector.module.css";

// ────────────────────────────────────────────
// 类型
// ────────────────────────────────────────────

type FontSelectorProps = {
  value: string;
  onChange: (stack: string) => void;
  allFonts: FontDefinition[];
  fontsByCategory: Record<FontCategory, FontDefinition[]>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredFonts: FontDefinition[];
  localFonts: LocalFontEntry[];
  importLocalFont: (file: File) => Promise<LocalFontEntry | null>;
  removeLocalFont: (id: string) => void;
  renameLocalFont: (id: string, newName: string) => void;
  webFontsLoaded: boolean;
  findFontByStack: (stack: string) => FontDefinition | null;
};

// ────────────────────────────────────────────
// 主组件
// ────────────────────────────────────────────

export function FontSelector({
  value,
  onChange,
  allFonts,
  fontsByCategory,
  searchQuery,
  setSearchQuery,
  filteredFonts,
  localFonts,
  importLocalFont,
  removeLocalFont,
  renameLocalFont,
  webFontsLoaded,
  findFontByStack,
}: FontSelectorProps) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<FontCategory | "全部" | "本地字体">("推荐");
  const [customStackOpen, setCustomStackOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const currentFont = findFontByStack(value);
  const displayLabel = currentFont?.label ?? "自定义字体";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open]);

  const handleSelect = useCallback(
    (font: FontDefinition) => {
      onChange(font.stack);
      setCustomStackOpen(false);
      setOpen(false);
    },
    [onChange],
  );

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImporting(true);
      try {
        const entry = await importLocalFont(file);
        if (entry) {
          onChange(
            `"${entry.family}", "PingFang SC", "Microsoft YaHei", sans-serif`,
          );
          setOpen(false);
        }
      } finally {
        setImporting(false);
        e.target.value = "";
      }
    },
    [importLocalFont, onChange],
  );

  const displayFonts: FontDefinition[] = searchQuery.trim()
    ? filteredFonts
    : activeCategory === "全部"
      ? allFonts
      : activeCategory === "本地字体"
        ? localFonts.map((lf) => ({
            label: lf.name,
            family: lf.family,
            stack: `"${lf.family}", "PingFang SC", "Microsoft YaHei", sans-serif`,
            category: "推荐" as FontCategory,
          }))
        : (fontsByCategory[activeCategory as FontCategory] ?? []);

  const tabs: Array<FontCategory | "全部" | "本地字体"> = [
    "推荐",
    "全部",
    ...FONT_CATEGORY_ORDER.filter((c) => c !== "推荐"),
    "本地字体",
  ];

  return (
    <div className={s.root} ref={containerRef}>
      <label className="field">
        <span>字体</span>
        <button
          type="button"
          className={s.trigger}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className={s.triggerName} style={{ fontFamily: value }}>
            {displayLabel}
          </span>
          <span className={s.triggerArrow}>
            {open ? "\u25B2" : "\u25BC"}
          </span>
        </button>
      </label>

      {open ? (
        <div className={s.dropdown}>
          <div className={s.search}>
            <input
              type="text"
              placeholder="搜索字体..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              autoFocus
            />
          </div>

          {!searchQuery.trim() ? (
            <div className={s.tabs}>
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`${s.tab}${activeCategory === tab ? ` ${s.tabActive}` : ""}`}
                  onClick={() => setActiveCategory(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          ) : null}

          <div className={s.list} ref={listRef}>
            {displayFonts.map((font) => (
              <FontItem
                key={font.stack}
                font={font}
                selected={font.stack === value}
                onSelect={handleSelect}
                webFontsLoaded={webFontsLoaded}
              />
            ))}

            {activeCategory === "本地字体" && !searchQuery.trim() ? (
              <LocalFontSection
                localFonts={localFonts}
                onRemove={removeLocalFont}
                onRename={renameLocalFont}
                onSelect={handleSelect}
              />
            ) : null}

            {displayFonts.length === 0 && !localFonts.length ? (
              <div className={s.empty}>
                {searchQuery.trim() ? "未找到匹配的字体" : "该分类暂无字体"}
              </div>
            ) : null}
          </div>

          <div className={s.footer}>
            <button
              type="button"
              className={s.importBtn}
              onClick={handleImportClick}
              disabled={importing}
            >
              {importing ? "导入中..." : "+ 导入本地字体"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".ttf,.otf,.woff,.woff2"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <button
              type="button"
              className={s.customBtn}
              onClick={() => setCustomStackOpen((prev) => !prev)}
            >
              {customStackOpen ? "收起自定义" : "自定义字体栈"}
            </button>
          </div>

          {customStackOpen ? (
            <CustomStackInput value={value} onChange={onChange} />
          ) : null}
        </div>
      ) : null}

      <div className={s.preview} style={{ fontFamily: value }}>
        {FONT_PREVIEW_TEXT}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// 字体列表项
// ────────────────────────────────────────────

function FontItem({
  font,
  selected,
  onSelect,
  webFontsLoaded,
}: {
  font: FontDefinition;
  selected: boolean;
  onSelect: (font: FontDefinition) => void;
  webFontsLoaded: boolean;
}) {
  const hasWebFont = isWebFont(font);
  return (
    <button
      type="button"
      className={`${s.item}${selected ? ` ${s.itemSelected}` : ""}`}
      onClick={() => onSelect(font)}
      style={{ fontFamily: font.stack }}
    >
      <span className={s.itemLabel}>
        {font.label}
        {!hasWebFont && <span className={s.itemBadge}>需本地安装</span>}
      </span>
      <span className={s.itemPreview}>{FONT_PREVIEW_TEXT}</span>
      {hasWebFont && !webFontsLoaded ? (
        <span className={s.itemLoading}>加载中</span>
      ) : null}
    </button>
  );
}

// ────────────────────────────────────────────
// 本地字体区域
// ────────────────────────────────────────────

function LocalFontSection({
  localFonts,
  onRemove,
  onRename,
  onSelect,
}: {
  localFonts: LocalFontEntry[];
  onRemove: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onSelect: (font: FontDefinition) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  if (localFonts.length === 0) {
    return (
      <div className={s.empty}>
        尚未导入本地字体，点击下方按钮导入
      </div>
    );
  }

  return (
    <div className={s.localList}>
      {localFonts.map((lf) => (
        <div key={lf.id} className={s.localItem}>
          {editingId === lf.id ? (
            <input
              className={s.localRename}
              value={editName}
              onChange={(e) => setEditName(e.currentTarget.value)}
              onBlur={() => {
                if (editName.trim()) {
                  onRename(lf.id, editName.trim());
                }
                setEditingId(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && editName.trim()) {
                  onRename(lf.id, editName.trim());
                  setEditingId(null);
                }
                if (e.key === "Escape") setEditingId(null);
              }}
              autoFocus
            />
          ) : (
            <button
              type="button"
              className={s.item}
              style={{ fontFamily: `"${lf.family}"` }}
              onClick={() =>
                onSelect({
                  label: lf.name,
                  family: lf.family,
                  stack: `"${lf.family}", "PingFang SC", "Microsoft YaHei", sans-serif`,
                  category: "推荐",
                })
              }
            >
              <span className={s.itemLabel}>{lf.name}</span>
              <span className={s.itemPreview}>{FONT_PREVIEW_TEXT}</span>
            </button>
          )}
          <div className={s.localActions}>
            <button
              type="button"
              className={s.localAction}
              title="重命名"
              onClick={() => {
                setEditingId(lf.id);
                setEditName(lf.name);
              }}
            >
              ✎
            </button>
            <button
              type="button"
              className={`${s.localAction} ${s.localActionDanger}`}
              title="删除"
              onClick={() => onRemove(lf.id)}
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────
// 自定义字体栈输入
// ────────────────────────────────────────────

function CustomStackInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (stack: string) => void;
}) {
  return (
    <div className={s.customStack}>
      <input
        type="text"
        value={value}
        placeholder='如: "PingFang SC", sans-serif'
        onChange={(e) => onChange(e.currentTarget.value)}
      />
    </div>
  );
}
