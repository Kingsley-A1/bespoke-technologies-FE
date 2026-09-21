import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Bespoke Business Audit — How ready is your business for the digital revolution?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BLUE = "#0a84ff";
const WHITE = "#fdfdfd";
const GRAY = "#8a94a3";

export default async function Image() {
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
          background: "linear-gradient(135deg, #0b1f3a 0%, #071426 50%, #0b1f3a 100%)",
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
            background: "radial-gradient(ellipse at center, rgba(10,132,255,0.18) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "15%",
            right: "15%",
            height: "3px",
            background: "linear-gradient(to right, transparent, #0a84ff 30%, #0a84ff 70%, transparent)",
          }}
        />

        {/* Brand lockup */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "36px" }}>
          <svg width="64" height="64" viewBox="0 0 1536 1536">
            <path
              d="M768 268 L1200 513 L1200 1017 L765 1266 L336 1018 L336 513 Z M768 352 L411 558 L412 974 L765 1179 L1124 973 L1124 557 Z"
              fill={WHITE}
              fillRule="evenodd"
            />
            <path d="M582 755 L636 786 L636 1040 L493 955 L493 806 Z" fill={BLUE} />
            <path d="M767 615 L838 656 L838 1072 L765 1116 L680 1066 L680 666 Z" fill={BLUE} />
            <path d="M882 480 L1032 568 L1032 955 L883 1045 Z" fill={BLUE} />
          </svg>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span
              style={{
                color: BLUE,
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
                color: WHITE,
                fontSize: "18px",
                fontWeight: 800,
                letterSpacing: "4px",
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              BUSINESS AUDIT
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
            color: BLUE,
            fontSize: "14px",
            fontWeight: 700,
            letterSpacing: "3px",
            textTransform: "uppercase",
          }}
        >
          Free · Six Questions · One Report
        </div>

        <h1
          style={{
            fontSize: "56px",
            fontWeight: 800,
            color: WHITE,
            textAlign: "center",
            lineHeight: 1.12,
            margin: 0,
            marginBottom: "18px",
            letterSpacing: "-1px",
            maxWidth: "920px",
          }}
        >
          How ready is your business for the <span style={{ color: BLUE }}>digital revolution</span>?
        </h1>
        <p
          style={{
            fontSize: "22px",
            color: GRAY,
            textAlign: "center",
            margin: 0,
            maxWidth: "680px",
            lineHeight: 1.4,
          }}
        >
          A readiness score, a six-dimension breakdown, and the priorities that matter next.
        </p>

        <div style={{ marginTop: "40px", display: "flex", alignItems: "flex-end", gap: "14px" }}>
          <div style={{ width: 26, height: 56, background: "rgba(10,132,255,0.55)", borderRadius: 4 }} />
          <div style={{ width: 26, height: 88, background: "rgba(10,132,255,0.75)", borderRadius: 4 }} />
          <div style={{ width: 26, height: 124, background: BLUE, borderRadius: 4 }} />
        </div>
      </div>
    ),
    { ...size },
  );
}
