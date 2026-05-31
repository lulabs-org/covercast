import { ImageResponse } from "next/og";

export const alt = "Covercast — 直播背景编辑器";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f3f5f9",
          padding: 60,
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 20,
            background: "#2764f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontSize: 48,
            fontWeight: 900,
            marginBottom: 32,
          }}
        >
          C
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 900,
            color: "#152033",
            marginBottom: 16,
          }}
        >
          Covercast
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#65728a",
            textAlign: "center",
            maxWidth: 800,
            lineHeight: 1.4,
          }}
        >
          开源直播室背景编辑器 · 支持 SVG 渲染与 OBS 浏览器源接入
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
