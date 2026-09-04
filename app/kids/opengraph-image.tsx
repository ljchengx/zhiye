import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "一程一成长";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function KidsOpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 84px",
          background: "#ffffff",
          color: "#263238",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, color: "#e45d45", fontSize: 30, fontWeight: 700 }}>
          <span style={{ display: "flex", width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 9, background: "#e45d45", color: "#fff", fontSize: 22 }}>程</span>
          一程一成长
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", fontSize: 58, fontWeight: 700 }}>陪孩子走好成长的每一步</div>
          <div style={{ display: "flex", color: "#6f7c81", fontSize: 26 }}>成长不必一蹴而就</div>
        </div>
        <div style={{ display: "flex", width: "100%", borderTop: "2px solid #dce3e6", paddingTop: 22, color: "#49a078", fontSize: 24 }}>
          每天一点 · 难度递进 · 打印方便 · 本地生成
        </div>
      </div>
    ),
    size,
  );
}
