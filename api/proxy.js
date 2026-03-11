export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { url: videoUrl } = req.query;
  if (!videoUrl) return res.status(400).json({ success: false, message: "URL missing" });

  const apis = [
    () => tryCobalt(videoUrl),
    () => tryYtApi(videoUrl),
    () => tryFallback(videoUrl),
  ];

  for (const api of apis) {
    try {
      const result = await api();
      if (result) return res.status(200).json({ success: true, mediaInfo: result });
    } catch (e) {
      console.log("API failed:", e.message);
    }
  }

  return res.status(503).json({ success: false, message: "Koi bhi API kaam nahi kar rahi. Thodi der baad try karo." });
}

// ── Cobalt ────────────────────────────────────────────────────────────────────
async function tryCobalt(url) {
  const res = await fetch("https://api.cobalt.tools/", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ url, videoQuality: "720", filenameStyle: "basic" }),
  });
  const data = await res.json();

  if (data.status === "stream" || data.status === "redirect") {
    return { title: "Video", platform: detectPlatform(url), videoUrl: data.url, thumbnail: "" };
  }
  if (data.status === "picker" && data.picker?.length > 0) {
    return {
      title: "Video", platform: detectPlatform(url),
      videoUrl: data.picker[0].url,
      links: data.picker.map((p, i) => ({ url: p.url, quality: "Option " + (i + 1) })),
      thumbnail: data.picker[0].thumb || "",
    };
  }
  throw new Error("Cobalt: " + (data.error?.code || "no link"));
}

// ── ytapi.me ──────────────────────────────────────────────────────────────────
async function tryYtApi(url) {
  const id = extractYTId(url);
  if (!id) throw new Error("Not YouTube");
  const res = await fetch(`https://ytapi.me/api/?videoid=${id}&format=json`);
  const data = await res.json();
  if (data?.url) {
    return {
      title: data.title || "YouTube Video", platform: "YouTube",
      videoUrl: data.url,
      thumbnail: data.thumbnail || `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    };
  }
  throw new Error("ytapi: no url");
}

// ── Fallback ──────────────────────────────────────────────────────────────────
async function tryFallback(url) {
  const id = extractYTId(url);
  return {
    title: "Video", platform: detectPlatform(url),
    videoUrl: `https://ssyoutube.com/en8/download?url=${encodeURIComponent(url)}`,
    thumbnail: id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "",
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function extractYTId(url) {
  const m = url.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function detectPlatform(url) {
  if (/youtube\.com|youtu\.be/.test(url)) return "YouTube";
  if (/instagram\.com/.test(url)) return "Instagram";
  if (/tiktok\.com/.test(url)) return "TikTok";
  if (/facebook\.com|fb\.watch/.test(url)) return "Facebook";
  if (/twitter\.com|x\.com/.test(url)) return "Twitter/X";
  return "Video";
}
