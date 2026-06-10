"use client";

import { useState, useEffect, useRef, useCallback, type ChangeEvent } from "react";
import { FONT_GROUPS, findFontOption, type FontOption } from "../lib/fonts";
import { useFontLoader } from "../hooks/useFontLoader";

// 扩展 FontFaceSet 类型声明
declare global {
  interface FontFaceSet {
    add(font: FontFace): void;
  }
}

/** 本地导入的字体列表（运行时状态） */
const localFonts: FontOption[] = [];

export function FontFamilyField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const { loadFont, isLoading, isFailed } = useFontLoader();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const matchedOption = findFontOption(value);
  const loading = matchedOption ? isLoading(matchedOption.family) : false;
  const failed = matchedOption ? isFailed(matchedOption.family) : false;

  // 计算下拉框位置（fixed 定位，向左展示，搜索框底部对齐触发按钮）
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownWidth = 280;
    const maxHeight = Math.min(rect.height * 12, 420);

    // 下拉框底部 = 触发按钮底部 + 导入按钮高度(31) + gap(8) + padding-bottom(8) = +47
    const dropdownBottom = rect.bottom + 47;
    let top = dropdownBottom - maxHeight;

    // 边界检查
    const minTop = 8;
    if (top < minTop) {
      top = minTop;
    }

    setDropdownStyle({
      position: "fixed",
      left: rect.left - dropdownWidth - 8,
      top,
      width: dropdownWidth,
      height: maxHeight,
      zIndex: 9999,
    });
  }, []);

  const handleToggle = () => {
    if (open) {
      setOpen(false);
      setSearch("");
    } else {
      updatePosition();
      setOpen(true);
    }
  };

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (triggerRef.current?.contains(target)) return;
      if (target.closest(".font-dropdown")) return;
      setOpen(false);
      setSearch("");
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // 打开时聚焦搜索框
  useEffect(() => {
    if (open) {
      updatePosition();
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open, updatePosition]);

  // 窗口滚动/resize 时更新位置
  useEffect(() => {
    if (!open) return;
    const handle = () => updatePosition();
    window.addEventListener("scroll", handle, true);
    window.addEventListener("resize", handle);
    return () => {
      window.removeEventListener("scroll", handle, true);
      window.removeEventListener("resize", handle);
    };
  }, [open, updatePosition]);

  // ESC 关闭
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const handleSelect = (option: FontOption) => {
    setOpen(false);
    setSearch("");
    onChange(option.value);
    if (option.files.length > 0) loadFont(option);
  };

  const handleLocalImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const familyName = file.name.replace(/\.(ttf|otf|woff2|woff)$/i, "").trim();
    const url = URL.createObjectURL(file);

    try {
      const fontFace = new FontFace(familyName, `url(${url})`);
      const loaded = await fontFace.load();
      document.fonts.add(loaded);

      const newOption: FontOption = {
        label: familyName,
        family: familyName,
        value: `"${familyName}", sans-serif`,
        category: "sans-serif",
        license: "本地字体" as FontOption["license"],
        group: "本地字体",
        files: [],
      };

      if (!localFonts.some((f) => f.family === familyName)) {
        localFonts.push(newOption);
      }

      onChange(newOption.value);
    } catch {
      console.warn("字体加载失败:", familyName);
    }

    e.target.value = "";
  };

  // 搜索过滤
  const query = search.trim().toLowerCase();
  const filteredGroups: { label: string; options: FontOption[] }[] = [];

  if (localFonts.length > 0) {
    const filtered = query
      ? localFonts.filter(
          (f) => f.label.toLowerCase().includes(query) || f.family.toLowerCase().includes(query)
        )
      : localFonts;
    if (filtered.length > 0) filteredGroups.push({ label: "本地字体", options: filtered });
  }

  for (const group of FONT_GROUPS) {
    const filtered = query
      ? group.options.filter(
          (f) => f.label.toLowerCase().includes(query) || f.family.toLowerCase().includes(query)
        )
      : group.options;
    if (filtered.length > 0) filteredGroups.push({ label: group.label, options: filtered });
  }

  // 显示标签：优先使用匹配的字体名称，否则提取字体栈中的第一个字体
  const displayLabel = matchedOption?.label ?? (() => {
    // 从字体栈中提取第一个字体名称
    const firstFont = value.match(/"([^"]+)"/)?.[1] ?? value.split(",")[0].trim().replace(/"/g, "");
    return firstFont;
  })();

  return (
    <div className="font-family-field">
      <label className="field">
        <span>字体</span>
        <button
          ref={triggerRef}
          type="button"
          className={`font-trigger${open ? " font-trigger-open" : ""}`}
          onClick={handleToggle}
        >
          <span className="font-trigger-name" style={{ fontFamily: value }}>
            {displayLabel}
          </span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="font-trigger-arrow">
            <path d="M7.5 3L4.5 6L7.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </label>

      {open && (
        <div className="font-dropdown" style={dropdownStyle}>
          <div className="font-dropdown-list">
            {filteredGroups.map((group) => (
              <div key={group.label}>
                <div className="font-group-label">{group.label}</div>
                {group.options.map((option) => {
                  const isActive = matchedOption?.value === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`font-option${isActive ? " font-option-active" : ""}`}
                      onClick={() => handleSelect(option)}
                    >
                      <span className="font-option-preview" style={{ fontFamily: option.value }}>
                        {option.label}
                      </span>
                      <span className="font-badge" data-license={option.license}>
                        {option.license}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="font-dropdown-footer">
            <div className="font-dropdown-search">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="font-search-icon">
                <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8.5 8.5L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                ref={searchRef}
                type="text"
                value={search}
                placeholder="搜索字体…"
                onChange={(e) => setSearch(e.currentTarget.value)}
              />
            </div>
            <button
              type="button"
              className="font-import-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1.5V9.5M4 4.5L7 1.5L10 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1.5 9.5V11.5C1.5 12.05 1.95 12.5 2.5 12.5H11.5C12.05 12.5 12.5 12.05 12.5 11.5V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              导入本地字体
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".ttf,.otf,.woff2,.woff"
              style={{ display: "none" }}
              onChange={handleLocalImport}
            />
          </div>
        </div>
      )}

      <div className="font-preview-row">
        <div className="font-preview" style={{ fontFamily: value }}>
          {loading ? "加载中…" : failed ? "字体文件缺失" : "直播背景 Aa 123"}
        </div>
        {matchedOption ? (
          <span className="font-license-badge" data-license={matchedOption.license}>
            {matchedOption.license}
          </span>
        ) : null}
      </div>
    </div>
  );
}