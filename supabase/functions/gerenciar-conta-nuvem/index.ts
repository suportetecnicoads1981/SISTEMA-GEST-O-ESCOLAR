// Cria (ou atualiza a senha/papel de) a conta de acesso na nuvem (Supabase Auth) de um usuário.
// Só a conta Master (app_metadata.master = true) pode chamar: dados de login e cadastros de
// acesso são exclusivos do Master. Ninguém troca a senha de uma conta Master pelo sistema,
// a não ser o próprio Master.
//
// Por que é uma função da nuvem e não uma rota do site: na Sede e nas escolas o sistema é
// servido pelo servidor local (PowerShell), que não tem a rota /api/admin/cloud-user. Lá a
// chamada caía no servidor local e voltava "chave-de-acesso-invalida". A função da nuvem
// responde igual no link publicado, na Sede e em qualquer estação.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const CLOUD_ROLES = ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ success: false, error: 'Use POST.' }, 405);
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: caller, error: callerErr } = await admin.auth.getUser(token);
    if (callerErr || !caller?.user) {
      return json({ success: false, error: 'Entre na nuvem com uma conta de administrador e salve a senha novamente.' }, 401);
    }
    const callerIsMaster =
      String(caller.user.app_metadata?.role || '').toUpperCase() === 'ADMIN' && caller.user.app_metadata?.master === true;
    if (!callerIsMaster) {
      return json({ success: false, error: 'Somente a conta Master pode criar ou alterar acessos na nuvem.' }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || '').trim().toLowerCase();
    const password = typeof body?.password === 'string' ? body.password : '';
    const role = String(body?.role || '').toUpperCase();
    const name = typeof body?.name === 'string' ? body.name.slice(0, 200) : '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ success: false, error: 'E-mail inválido. O acesso na nuvem exige um e-mail válido.' }, 400);
    }
    if (password.length < 6 || password.length > 72) {
      return json({ success: false, error: 'A senha deve ter entre 6 e 72 caracteres.' }, 400);
    }
    if (!CLOUD_ROLES.includes(role)) {
      return json({ success: false, error: `Papel inválido. Use: ${CLOUD_ROLES.join(', ')}.` }, 400);
    }
    // Contas de servidor de escola têm função própria (criar-conta-servidor).
    if (email.endsWith('@servidores.sucessoedu.app')) {
      return json({ success: false, error: 'Este e-mail é reservado às contas de servidor das escolas.' }, 400);
    }

    let existing: any = null;
    for (let page = 1; page <= 20 && !existing; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) return json({ success: false, error: error.message }, 500);
      existing = (data?.users || []).find((u: any) => String(u.email || '').toLowerCase() === email) || null;
      if ((data?.users || []).length < 1000) break;
    }

    if (!existing) {
      const { data: created, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { role },
        user_metadata: name ? { name } : {},
      });
      if (error || !created?.user) return json({ success: false, error: error?.message || 'Não foi possível criar a conta na nuvem.' }, 500);
      return json({ success: true, created: true, userId: created.user.id, message: 'Acesso na nuvem criado com sucesso.' });
    }

    // Conta Master de outra pessoa: senha e papel só mudam pelo próprio dono.
    if (existing.app_metadata?.master === true && existing.id !== caller.user.id) {
      return json({ success: false, error: 'Esta é uma conta Master: só o próprio dono pode alterar a senha dela.' }, 403);
    }

    // Quem chama não pode rebaixar a si mesmo por engano (perderia o acesso de administrador).
    if (existing.id === caller.user.id && role !== 'ADMIN') {
      return json({ success: false, error: 'Este e-mail é o da sua própria conta de administrador; o papel dela não pode ser rebaixado por aqui.' }, 400);
    }

    const { error: updErr } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      app_metadata: { ...(existing.app_metadata || {}), role },
      ...(name ? { user_metadata: { ...(existing.user_metadata || {}), name } } : {}),
    });
    if (updErr) return json({ success: false, error: updErr.message }, 500);
    return json({ success: true, created: false, userId: existing.id, message: 'Senha e papel da conta na nuvem atualizados.' });
  } catch (err) {
    return json({ success: false, error: String((err as Error)?.message || err) }, 500);
  }
});
