# SucessoEduSistema - Pasta Padrão do Instalador

Esta é a pasta canônica padrão no diretório raiz (`C:\SucessoEduSistema`) destinada à geração, empacotamento e compilação do instalador oficial do **SucessoEdu Gestão Educacional** com **Inno Setup 6** e **PostgreSQL 16.1**.

---

## 📁 Estrutura Canônica de Diretórios

```text
C:\SucessoEduSistema\
├── Bin\                  -> Executáveis, dependências e binários de serviço
├── PostgreSQL\           -> Engine relacional PostgreSQL 16.1 (provisionado)
├── Data\                 -> Dados do sistema e bases SQLite/Postgres
│   └── pgdata\           -> Cluster de dados transacionais do PostgreSQL
├── Config\               -> Configurações locais (pg_hba.conf, firewall, .ini)
├── Logs\                 -> Auditorias SAST, diagnósticos e logs operacionais
├── Backups\              -> Snapshots e backups diários agendados (03:00 AM)
├── Scripts\              -> Rotinas de automação em PowerShell e Batch
├── Keys\                 -> Certificados e chaves de licença (.lic, .key)
├── Output\               -> Arquivo compilado final (SucessoEduSistema_Setup_x64.exe)
├── SucessoEdu_Setup.iss  -> Script mestre do Inno Setup 6
├── SucessoEdu_App.bat    -> Lançador universal (inicia .exe, .vbs, HTML offline ou localhost:3000)
├── SucessoEdu_App.vbs    -> Lançador silencioso em segundo plano
├── criar_pastas_instalador.bat -> Provisionador da raiz com UAC
└── instalar_sucessoedu.bat     -> Instalador autônomo com auto-elevação
```

---

## 🚀 Como Criar o Instalador

1. **Executar o Provisionador**:
   - Dê um duplo clique em `criar_pastas_instalador.bat` (solicita elevação UAC como Administrador).
   - O script cria a estrutura de pastas e aplica as permissões de controle total (`icacls`).

2. **Compilar com Inno Setup**:
   - Abra o arquivo `SucessoEdu_Setup.iss` no Inno Setup Compiler.
   - Pressione **Ctrl + F9** (ou clique no menu *Build > Compile*).
   - O executável de instalação será gerado automaticamente na subpasta `Output\SucessoEduSistema_Setup_x64.exe`.

3. **Instalação no Computador de Destino**:
   - Execute `SucessoEduSistema_Setup_x64.exe` em qualquer computador com Windows 10/11 ou Windows Server.
   - O instalador verifica espaço em disco (mínimo 500MB livres), fecha processos conflitantes, valida a porta de rede (5432/5433), cria as regras de Firewall e provisiona o banco de dados silenciosamente.
