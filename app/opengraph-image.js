import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "خِزانة — كل أدوات بيتك في مكان واحد";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
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
          background: "#F5FAFA",
        }}
      >
        <div
          style={{
            fontSize: 110,
            fontWeight: 700,
            color: "#087C80",
            marginBottom: 20,
          }}
        >
          خِزانة
        </div>
        <div style={{ fontSize: 38, color: "#1D2424" }}>
          كل أدوات بيتك في مكان واحد
        </div>
        <div
          style={{
            marginTop: 44,
            padding: "14px 36px",
            borderRadius: 999,
            background: "#08A6A6",
            color: "#FFFFFF",
            fontSize: 28,
          }}
        >
          توصيل لجميع محافظات مصر
        </div>
      </div>
    ),
    { ...size }
  );
}
