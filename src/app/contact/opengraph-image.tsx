import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #0b1f3a 0%, #071426 50%, #0b1f3a 100%)",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "-200px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "600px",
          background:
            "radial-gradient(ellipse at center, rgba(10,132,255,0.18) 0%, transparent 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "15%",
          right: "15%",
          height: "3px",
          background:
            "linear-gradient(to right, transparent, #0a84ff 30%, #0a84ff 70%, transparent)",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          marginBottom: "40px",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            background: "linear-gradient(135deg, #0a84ff 0%, #0057d9 100%)",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "26px",
            fontWeight: 900,
            color: "white",
            letterSpacing: "-1px",
            boxShadow: "0 8px 32px rgba(10,132,255,0.4)",
          }}
        >
          BT
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span
            style={{
              color: "#0a84ff",
              fontSize: "18px",
              fontWeight: 800,
              letterSpacing: "6px",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            BESPOKE
          </span>
          <span
            style={{
              color: "#fdfdfd",
              fontSize: "18px",
              fontWeight: 800,
              letterSpacing: "6px",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            TECHNOLOGIES
          </span>
        </div>
      </div>
      <div
        style={{
          background: "rgba(10,132,255,0.12)",
          border: "1px solid rgba(10,132,255,0.3)",
          borderRadius: "99px",
          padding: "6px 20px",
          marginBottom: "24px",
          color: "#0a84ff",
          fontSize: "14px",
          fontWeight: 700,
          letterSpacing: "3px",
          textTransform: "uppercase",
        }}
      >
        Get in Touch
      </div>
      <h1
        style={{
          fontSize: "64px",
          fontWeight: 800,
          color: "#fdfdfd",
          textAlign: "center",
          lineHeight: 1.1,
          margin: 0,
          marginBottom: "18px",
          letterSpacing: "-1px",
        }}
      >
        Let&apos;s Talk About{" "}
        <span style={{ color: "#0a84ff" }}>Your Project</span>
      </h1>
      <p
        style={{
          fontSize: "22px",
          color: "#8a94a3",
          textAlign: "center",
          margin: 0,
          maxWidth: "680px",
          lineHeight: 1.4,
        }}
      >
        From early idea to production — we&apos;re here to help you build
        something exceptional.
      </p>
      <div
        style={{
          marginTop: "36px",
          width: "60px",
          height: "3px",
          background: "#0a84ff",
          borderRadius: "99px",
        }}
      />
    </div>,
    { ...size },
  );
}
