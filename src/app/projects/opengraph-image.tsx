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
          "linear-gradient(135deg, #080e1a 0%, #0b1120 50%, #080e1a 100%)",
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
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "-200px",
          right: "-200px",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle at center, rgba(10,132,255,0.1) 0%, transparent 70%)",
          borderRadius: "50%",
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
            "linear-gradient(to right, transparent, #f5a524 30%, #f5a524 70%, transparent)",
          opacity: 0.7,
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
          background: "rgba(245,165,36,0.12)",
          border: "1px solid rgba(245,165,36,0.4)",
          borderRadius: "99px",
          padding: "6px 20px",
          marginBottom: "24px",
          color: "#f5a524",
          fontSize: "14px",
          fontWeight: 700,
          letterSpacing: "3px",
          textTransform: "uppercase",
        }}
      >
        Accomplished Works
      </div>
      <h1
        style={{
          fontSize: "62px",
          fontWeight: 800,
          color: "#fdfdfd",
          textAlign: "center",
          lineHeight: 1.1,
          margin: 0,
          marginBottom: "18px",
          letterSpacing: "-1px",
        }}
      >
        Built With Precision.{" "}
        <span style={{ color: "#0a84ff" }}>Deployed With Purpose.</span>
      </h1>
      <p
        style={{
          fontSize: "22px",
          color: "#8a94a3",
          textAlign: "center",
          margin: 0,
          maxWidth: "700px",
          lineHeight: 1.4,
        }}
      >
        11+ projects shipped — from government portals to fashion platforms.
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
