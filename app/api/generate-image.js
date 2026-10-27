import { ai } from 'hatchable';

export const access = 'user';
export const methods = ['POST'];

function toBase64(bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunkSize, bytes.length)));
  }
  return btoa(binary);
}

export default async function (req, res) {
  const body = req.body || {};
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  const aspect = ['16:9', '9:16', '1:1', '4:3', '3:2'].includes(body.aspect) ? body.aspect : '16:9';
  const count = Math.max(1, Math.min(2, Number(body.count) || 1));
  if (!prompt || prompt.length > 4000) {
    return res.status(400).json({ error: 'Prompt wajib diisi dan maksimal 4.000 karakter.' });
  }
  if (body.confirmed !== true) {
    return res.status(400).json({ error: 'Konfirmasi generasi dan potensi biaya/kredit wajib disetujui.' });
  }
  try {
    const images = [];
    for (let i = 0; i < count; i++) {
      const result = await ai.generateImage({
        prompt: `${prompt}\nAspect ratio: ${aspect}. Create a polished, production-quality image. Do not add unwanted text, watermarks, or logos.`,
        aspect,
      });
      if (!Array.isArray(result?.images) || !result.images.length) {
        return res.status(502).json({ error: 'Model tidak mengembalikan gambar. Coba lagi dengan prompt yang lebih sederhana.' });
      }
      const image = result.images[0];
      const bytes = image.data instanceof Uint8Array ? image.data : new Uint8Array(image.data || []);
      if (!bytes.length) return res.status(502).json({ error: 'Data gambar dari model kosong.' });
      images.push({
        mimeType: image.mimeType || 'image/png',
        dataUrl: `data:${image.mimeType || 'image/png'};base64,${toBase64(bytes)}`,
        index: i + 1,
      });
    }
    return res.json({ images, aspect, count: images.length, note: 'Gambar berhasil dibuat oleh model AI.' });
  } catch (error) {
    console.error('image-generation-failed', error && error.code ? error.code : 'provider_error');
    const code = String(error && (error.code || error.message) || '');
    if (/setup_required|provider|api key|configured|412/i.test(code)) {
      return res.status(503).json({ error: 'Provider AI gambar belum dikonfigurasi. Pemilik proyek perlu menyiapkan provider/kredit di pengaturan Hatchable.' });
    }
    if (/spend.limit|limit_reached|credit|429/i.test(code)) {
      return res.status(429).json({ error: 'Batas biaya/kredit AI tercapai. Tinjau pengaturan penggunaan sebelum mencoba lagi.' });
    }
    return res.status(502).json({ error: 'Generasi gambar gagal sementara. Tidak ada gambar yang dinyatakan berhasil dibuat.' });
  }
}