import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { getPublishedReviewByIdSafe } from "@/features/admin/reviews/repository";

export const runtime = "nodejs";

/**
 * Social share card for a published review — a designed 1200×630 surface so
 * shared links look intentional on WhatsApp and social platforms.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const review = await getPublishedReviewByIdSafe(id);
  if (!review) return new NextResponse(null, { status: 404 });

  const origin = new URL(request.url).origin;
  const excerpt =
    review.body.length > 180 ? `${review.body.slice(0, 177).trimEnd()}…` : review.body;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#ffffff",
          padding: "64px 72px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Top accent rule */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "10px",
            background: "linear-gradient(90deg, #0057d9 0%, #0a84ff 55%, #0b1f3a 100%)",
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "0.18em",
                color: "#0057d9",
              }}
            >
              CLIENT REVIEW
            </div>
            <div style={{ display: "flex", marginTop: 18, fontSize: 44 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  style={{ color: star <= review.rating ? "#f5a524" : "#e8edf3", marginRight: 6 }}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
          {review.logoKey ? (
            // eslint-disable-next-line @next/next/no-img-element -- ImageResponse requires plain img
            <img
              src={`${origin}/api/reviews/${review.id}/logo`}
              alt=""
              width={110}
              height={110}
              style={{ borderRadius: 24, border: "1px solid #e8edf3", objectFit: "cover" }}
            />
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 46,
            lineHeight: 1.3,
            fontWeight: 600,
            color: "#0b1f3a",
            maxWidth: "1000px",
          }}
        >
          “{excerpt}”
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#0b1f3a" }}>
              {review.reviewerName}
            </div>
            <div style={{ display: "flex", marginTop: 6, fontSize: 24, color: "#66707d" }}>
              {review.projectName}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", fontSize: 28, fontWeight: 800 }}>
            <span style={{ color: "#0a84ff" }}>BESPOKE</span>
            <span style={{ color: "#111318", marginLeft: 10 }}>TECHNOLOGIES</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    },
  );
}
