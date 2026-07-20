import { ImageResponse } from "next/og";
import { getBrandIconDataUri } from "@/lib/brand-logo";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const brandIcon = await getBrandIconDataUri();

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
        <img
          src={brandIcon}
          alt=""
          width={72}
          height={72}
          style={{
            width: 72,
            height: 72,
            borderRadius: "16px",
            backgroundColor: "#ffffff",
            boxShadow: "0 8px 32px rgba(10,132,255,0.4)",
          }}
        />
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
        Client Reviews
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
        Words from Those <span style={{ color: "#0a84ff" }}>We Serve</span>
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
        Real feedback from real projects — 99% client satisfaction.
      </p>
      <div style={{ marginTop: "36px", display: "flex", gap: "8px" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <svg key={star} width="28" height="28" viewBox="0 0 24 24" fill="#f5a524">
            <path d="M12 2l2.95 5.96 6.58.96-4.77 4.64 1.13 6.55L12 17.02l-5.89 3.09 1.13-6.55-4.77-4.64 6.58-.96L12 2z" />
          </svg>
        ))}
      </div>
    </div>,
    { ...size },
  );
}
