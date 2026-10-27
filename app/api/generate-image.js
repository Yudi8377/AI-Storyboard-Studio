import { ai } from 'hatchable';

export const access = 'user';
export const methods = ['POST'];

function decodeDataUrl(value) {
  if (typeof value !== 'string' || value.length > 7_000_000) return null;
  const match = value.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

function encodeBytes(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + 0x8000, bytes.length)));
  }
  return btoa(binary);
}

function aspectRatio(value) {
  return ({ '16:9': '16:9', '9:16': '9:16', '1:1': '1:1', '4:3': '4:3', '3:2': '3:2' })[value] || '16:9';
}

export default async function (req, res) {
  const body = req.body || {};
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  const aspect = aspectRatio(body.aspect);
  const count = Math.max(1, Math.min(2, Number(body.count) || 1));
  if (!prompt || prompt.length > 4000) return res.status(400).json({ error: 'Prompt wajib diisi dan maksimal 4.000 karakter.' });
  if (body.confirmed !== true) return res.status(400).json({ error: 'Konfirmasi generasi dan potensi biaya/kredit wajib disetujui.' });

  const refs = Array.isArray(body.references) ? body.references : [];
  if (refs.length > 4) return res.status(400).json({ error: 'Maksimal empat gambar referensi.' });
  const images = [];
  let totalBytesApprox = 0;
  for (const raw of refs) {
    const image = decodeDataUrl(raw);
    if (!image) return res.status(400).json({ error: 'Gambar referensi tidak valid atau terlalu besar. Gunakan JPG, PNG, atau WebP dengan ukuran maksimal 5 MB per gambar.' });
    totalBytesApprox += image.data.length;
    if (totalBytesApprox > 8_000_000) return res.status(413).json({ error: 'Total gambar referensi terlalu besar. Gunakan gambar yang lebih kecil (total maksimal sekitar 6 MB).' });
    images.push(image);
  }

  try {
    const generated = [];
    for (let i = 0; i < count; i++) {
      const parts = [{ text: `Generate one polished, production-quality image based on this art direction. Aspect ratio: ${aspect}. Do not add unwanted text, watermarks, or logos.\n\nArt direction:\n${prompt}${images.length ? '\n\nUse the attached reference image(s) to guide subject identity, visual style, palette, and composition. Create a new image, not a description of the references.' : ''}` }];
      for (const image of images) parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
      const result = await ai.fetch({
        provider: 'google',
        path: '/v1beta/models/gemini-2.5-flash-image:generateContent',
        body: { contents: [{ parts }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: aspect } } },
        purpose: 'generate-image',
        timeoutMs: 170_000,
      });
      if (!result.ok) {
        console.error('image-gen-provider-failed', { status: result.status, code: result.error?.code || 'provider_error' });
        if (result.status === 412) return res.status(503).json({ error: 'Provider Google AI belum dikonfigurasi atau kredit AI tidak tersedia. Pemilik proyek perlu menyelesaikan pengaturan AI di Hatchable.' });
        if (result.status === 429) return res.status(429).json({ error: 'Batas penggunaan atau kredit AI tercapai. Tinjau pengaturan penggunaan sebelum mencoba lagi.' });
        return res.status(502).json({ error: 'Provider gambar gagal memproses permintaan. Coba lagi nanti.' });
      }
      const data = await result.json();
      const inline = data.candidates?.[0]?.content?.parts?.find(part => part.inlineData)?.inlineData;
      if (!inline?.data) return res.status(502).json({ error: 'Model tidak mengembalikan data gambar.' });
      const bytes = Uint8Array.from(atob(inline.data), char => char.charCodeAt(0));
      generated.push({ mimeType: inline.mimeType || 'image/png', dataUrl: `data:${inline.mimeType || 'image/png'};base64,${encodeBytes(bytes)}`, index: i + 1 });
    }
    return res.json({ images: generated, aspect, count: generated.length, usedReferences: images.length, note: 'Gambar dibuat oleh model AI.' });
  } catch (error) {
    console.error('image-generation-failed', error && error.code ? error.code : 'provider_error');
    const code = String(error && (error.code || error.message) || '');
    if (/setup_required|provider|api key|configured|412/i.test(code)) return res.status(503).json({ error: 'Provider Google AI belum dikonfigurasi. Pemilik proyek perlu menyiapkan provider/kredit di pengaturan Hatchable.' });
    if (/spend.limit|limit_reached|credit|429/i.test(code)) return res.status(429).json({ error: 'Batas biaya/kredit AI tercapai. Tinjau pengaturan penggunaan sebelum mencoba lagi.' });
    return res.status(502).json({ error: 'Generasi gambar gagal sementara. Tidak ada gambar yang dinyatakan berhasil dibuat.' });
  }
}