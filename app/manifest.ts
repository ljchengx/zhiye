import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "知页 - 免费的浏览器本地工具箱",
    short_name: "知页",
    description: "在浏览器本地处理文本、数据与图片，内容不离开你的设备。",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f9fa",
    theme_color: "#405a50",
    icons: [
      {
        src: "/icon.png",
        sizes: "256x256",
        type: "image/png",
      },
    ],
  };
}
