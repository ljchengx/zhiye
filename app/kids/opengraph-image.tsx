import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "知页启蒙";
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
          <span style={{ display: "flex", width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 9, background: "#e45d45", color: "#fff", fontSize: 22 }}>知</span>
          知页启蒙
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", fontSize: 58, fontWeight: 700 }}>把每天一点练习，变成看得见的进步</div>
          <div style={{ display: "flex", color: "#6f7c81", fontSize: 26 }}>从一张 A4 数学练习单开始</div>
        </div>
        <div style={{ display: "flex", width: "100%", borderTop: "2px solid #dce3e6", paddingTop: 22, color: "#49a078", fontSize: 24 }}>
          每天一点 · 难度递进 · 打印方便 · 本地生成
        </div>
      </div>
    ),
    size,
  );
}
