import { db } from 'hatchable';

export const access = 'user';
export const methods = ['GET', 'PUT', 'DELETE'];

export default async function (req, res) {
  const id = String(req.params.id || '');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return res.status(400).json({ error: 'ID proyek tidak valid.' });
  const ownerId = req.user.id;
  if (req.method === 'GET') {
    const { rows } = await db.query('SELECT * FROM storyboard_projects WHERE id=$1 AND owner_id=$2', [id, ownerId]);
    if (!rows.length) return res.status(404).json({ error: 'Proyek tidak ditemukan.' });
    return res.json({ project: rows[0] });
  }
  if (req.method === 'DELETE') {
    const { rowCount } = await db.query('DELETE FROM storyboard_projects WHERE id=$1 AND owner_id=$2', [id, ownerId]);
    if (!rowCount) return res.status(404).json({ error: 'Proyek tidak ditemukan.' });
    return res.json({ deleted: true });
  }
  const body = req.body || {};
  const title = String(body.title || '').trim().slice(0, 180);
  const brief = String(body.brief || '').trim().slice(0, 12000);
  if (!title || !brief) return res.status(400).json({ error: 'Judul dan brief wajib diisi.' });
  const shotCount = Math.max(3, Math.min(12, Number(body.shot_count) || 6));
  const shots = Array.isArray(body.shots) ? body.shots.slice(0, 12) : [];
  const { rows } = await db.query(
    'UPDATE storyboard_projects SET title=$3, brief=$4, format=$5, style=$6, language=$7, shot_count=$8, shots=$9::jsonb, updated_at=NOW() WHERE id=$1 AND owner_id=$2 RETURNING *',
    [id, ownerId, title, brief, String(body.format || 'Iklan 15 detik').slice(0,80), String(body.style || 'Sinematik realistis').slice(0,100), String(body.language || 'Indonesia').slice(0,40), shotCount, JSON.stringify(shots)]
  );
  if (!rows.length) return res.status(404).json({ error: 'Proyek tidak ditemukan.' });
  return res.json({ project: rows[0] });
}