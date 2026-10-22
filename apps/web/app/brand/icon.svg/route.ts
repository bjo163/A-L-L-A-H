import { empireFaviconSvg } from "@empire/ui/brand-assets";

export function GET() {
  return new Response(empireFaviconSvg, {
    headers: {
      "Cache-Control": "public, max-age=86400",
      "Content-Type": "image/svg+xml; charset=utf-8",
    },
  });
}
