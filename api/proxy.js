export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { url: videoUrl } = req.query;
  if (!videoUrl) return res.status(400).json({ success: false, message: "URL missing" });

  try {
    const result = await tryYoutubeDownloader(videoUrl);
    if (result) return res.status(200).json({ success: true, mediaInfo: result });
    throw new Error("No result");
  } catch (e) {
    return res.status(503).json({ success: false, message: "Error: " + e.message });
  }
}

async function tryYoutubeDownloader(url) {
  const apiUrl = "https://youtube-video-and-shorts-downloader.p.rapidapi.com/download?url=" + encodeURIComponent(url);

  const res = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "x-rapidapi-key": "8573c3a5a4msh17b0edce5836123p15a406jsnf2cf5e558202",
      "x-rapidapi-host": "youtube-video-and-shorts-downloader.p.rapidapi.com"
    }
  });

  const data = await res.json();
  console.log("API Response:", JSON.stringify(data));

  if (!data) throw new Error("Empty response");

  // Links collect karo
  const links = [];

  // Formats array
  if (Array.isArray(data.formats)) {
    data.formats.forEach(f => {
      if (f.url) links.push({ url: f.url, quality: f.qualityLabel || f.quality || f.ext || "Download" });
    });
  }

  // Direct video/audio
  if (data.url)      links.push({ url: data.url,      quality: "Video Download" });
  if (data.videoUrl) links.push({ url: data.videoUrl, quality: "Video Download" });
  if (data.audioUrl) links.push({ url: data.audioUrl, quality: "Audio MP3" });

  // medias / links array
  if (Array.isArray(data.medias)) data.medias.forEach(m => { if (m.url) links.push({ url: m.url, quality: m.quality || "Download" }); });
  if (Array.isArray(data.links))  data.links.forEach(l  => { if (l.url) links.push({ url: l.url,  quality: l.quality  || "Download" }); });

  if (links.length === 0) throw new Error("No download links in response");

  return {
    title:     data.title     || data.videoTitle || "YouTube Video",
    platform:  "YouTube",
    thumbnail: data.thumbnail || data.thumb      || "",
    duration:  data.duration  || "",
    links,
    videoUrl:  links[0].url,
  };
}
