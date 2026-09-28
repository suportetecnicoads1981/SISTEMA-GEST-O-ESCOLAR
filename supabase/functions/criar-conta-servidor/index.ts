// Cria (ou renova/desliga) a conta de nuvem do Servidor Remoto de UMA escola.
// Só um administrador logado pode chamar. A conta recebe o papel SERVIDOR e fica presa
// à escola (app_metadata.school_unit_id): envia só o lote dessa escola e lê só os dados dela.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

function randomPassword(len = 24): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: caller, error: callerErr } = await admin.auth.getUser(token);
    if (callerErr || !caller?.user) return json({ error: 'Entre na nuvem com uma conta de administrador.' }, 401);
    if (String(caller.user.app_metadata?.role || '').toUpperCase() !== 'ADMIN') {
      return json({ error: 'Somente administradores podem criar contas de servidor.' }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const schoolUnitId = String(body?.schoolUnitId || '').trim();
    const action = String(body?.action || 'create');
    if (!schoolUnitId) return json({ error: 'Escolha a escola.' }, 400);

    const { data: unit, error: unitErr } = await admin.from('school_units').select('id, name, inep_code').eq('id', schoolUnitId).maybeSingle();
    if (unitErr) return json({ error: unitErr.message }, 500);
    if (!unit) return json({ error: 'Escola não encontrada na nuvem. Sincronize a Sede e tente de novo.' }, 404);

    const slug = /^\d{8}$/.test(String(unit.inep_code || '').trim())
      ? String(unit.inep_code).trim()
      : schoolUnitId.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
    const email = `servidor.${slug}@servidores.sucessoedu.app`;

    // Conta já existe?
    let existing: any = null;
    for (let page = 1; page <= 20 && !existing; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) return json({ error: error.message }, 500);
      existing = (data?.users || []).find((u: any) => String(u.email || '').toLowerCase() === email);
      if ((data?.users || []).length < 1000) break;
    }

    if (action === 'disable') {
      if (!existing) return json({ error: 'Esta escola ainda não tem conta de servidor.' }, 404);
      const { error } = await admin.auth.admin.updateUserById(existing.id, { ban_duration: '876000h' });
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, email, disabled: true, schoolName: unit.name });
    }

    const password = randomPassword();
    const app_metadata = { role: 'SERVIDOR', school_unit_id: unit.id };
    if (existing) {
      const { error } = await admin.auth.admin.updateUserById(existing.id, { password, app_metadata, ban_duration: 'none' });
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, email, password, schoolName: unit.name, renewed: true });
    }
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata,
      user_metadata: { name: `Servidor ${unit.name}` },
    });
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true, email, password, schoolName: unit.name, renewed: false });
  } catch (err) {
    return json({ error: String((err as Error)?.message || err) }, 500);
  }
});
