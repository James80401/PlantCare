export const UA = 'PlantCare/1.0 (species catalog; educational use)';
export const FILE_MIN_BYTES = 6_000;

export function photoIdFromMeta(meta) {
  if (meta.inatPhotoId) return String(meta.inatPhotoId);
  const idMatch = meta.url?.match(/photos\/(\d+)\//);
  return idMatch?.[1] ?? null;
}

export function candidateUrls(meta) {
  const id = photoIdFromMeta(meta);
  const urls = [];
  if (id) {
    urls.push(`https://inaturalist-open-data.s3.amazonaws.com/photos/${id}/original.jpg`);
    urls.push(`https://static.inaturalist.org/photos/${id}/original.jpg`);
    urls.push(`https://static.inaturalist.org/photos/${id}/large.jpg`);
    urls.push(`https://static.inaturalist.org/photos/${id}/medium.jpg`);
  }
  if (meta.url) {
    urls.push(meta.url);
    if (meta.url.includes('static.inaturalist.org')) {
      urls.push(
        meta.url
          .replace('/square.', '/large.')
          .replace('/medium.', '/large.')
          .replace('/small.', '/large.'),
      );
    }
  }
  return [...new Set(urls)];
}

export async function validatePhotoHit(hit) {
  for (const url of candidateUrls(hit)) {
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        headers: { 'User-Agent': UA, Referer: 'https://www.inaturalist.org/' },
      });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < FILE_MIN_BYTES) continue;
      return { ...hit, url };
    } catch {
      /* try next */
    }
  }
  return null;
}
