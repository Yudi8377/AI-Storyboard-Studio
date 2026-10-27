import { db } from 'hatchable';

export const access = 'user';
export const methods = ['GET', 'POST'];

export default async function (req, res) {
  const ownerId = req.user.id;
  if (req.method === 'GET') {
    const { rows } = await db.query(
      'SELECT id, title, brief, format, style, language, shot_count, shots, status, created_at, updated_at FROM storyboard_projects WHERE owner_id = $1 ORDER BY updated_at DESC LIMIT 50',
      [ownerId]
    );
    return res.json({ projects: rows });
  }
  const body = req.body || {};
  const title = String(body.title || '').trim().slice(0, 180);
  const brief = String(body.brief || '').trim().slice(0, 12000);
  if (!title || !brief) return res.status(400).json({ error: 'Judul dan brief wajib diisi.' });
  const format = String(body.format || 'Iklan 15 detik').slice(0, 80);
  const style = String(body.style || 'Sinematik realistis').slice(0, 100);
  const language = String(body.language || 'Indonesia').slice(0, 40);
  const shotCount = Math.max(3, Math.min(12, Number(body.shot_count) || 6));
  const shots = Array.isArray(body.shots) ? body.shots.slice(0, 12) : [];
  const { rows } = await db.query(
    'INSERT INTO storyboard_projects (owner_id, title, brief, format, style, language, shot_count, shots) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb) RETURNING id, title, brief, format, style, language, shot_count, shots, status, created_at, updated_at',
    [ownerId, title, brief, format, style, language, shotCount, JSON.stringify(shots)]
  );
  return res.status(201).json({ project: rows[0] });
}