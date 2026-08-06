import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Future Interiors";

/**
 * The social card, drawn rather than photographed.
 *
 * A photograph would have been the obvious choice, but the hero image is a
 * local file that only exists once someone supplies one — an OG tag pointing at
 * a missing file is worse than a generated card. This needs no asset at all.
 *
 * Latin only, in both locales: the wordmark is Latin everywhere on the site
 * anyway (§8.1), and rendering Arabic here would mean shipping a font file into
 * the edge runtime to get the shaping right.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#1a1d1c",
          padding: "0 96px",
        }}
      >
        <div
          style={{
            fontSize: 168,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "#ffffff",
            lineHeight: 1,
          }}
        >
          FUTURE.
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 54,
            letterSpacing: "0.3em",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          INTERIORS
        </div>
        {/* The single accent touch the palette allows. */}
        <div style={{ marginTop: 56, width: 132, height: 3, background: "#c6a664" }} />
      </div>
    ),
    size,
  );
}
