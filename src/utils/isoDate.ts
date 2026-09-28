/** Aceita só datas válidas no formato AAAA-MM-DD (ou DD/MM/AAAA); o resto vira null. */
export function toIsoDateOrNull(val: any): string | null {
  const t = String(val ?? '').trim();
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) {
    const br = t.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (br) m = [br[0], br[3], br[2], br[1]] as any;
  }
  if (!m) return null;
  const iso = `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(iso + 'T00:00:00Z');
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso ? null : iso;
}
