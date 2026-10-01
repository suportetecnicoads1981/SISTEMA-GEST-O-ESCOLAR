-- Regra de usuários do perfil ESCOLA: e-mail do login avaliado uma vez por consulta (não por linha)
alter policy escola_select on public.user_accounts
  using (
    (select public.is_escola())
    and lower(coalesce(doc ->> 'email', '')) = lower(coalesce((select auth.jwt() ->> 'email'), '-'))
  );

-- Índice da escola de lotação no cadastro de usuários
create index if not exists idx_user_accounts_school_unit_id on public.user_accounts (school_unit_id);
