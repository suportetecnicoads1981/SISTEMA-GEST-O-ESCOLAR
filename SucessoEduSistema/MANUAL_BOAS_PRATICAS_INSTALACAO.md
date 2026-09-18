# Manual de Boas Práticas de Instalação e Implantação
## SucessoEdu Gestão Educacional (PostgreSQL 16.1 + Inno Setup 6)

---

## 🎯 Objetivo Deste Manual
Este manual foi elaborado de forma simples, didática e passo a passo para orientar desenvolvedores, analistas de TI e técnicos escolares a **preparar, compilar, instalar e validar** o ecossistema educacional **SucessoEdu** no Windows com zero dor de cabeça e máxima segurança operacional.

---

## 📋 Sumário
1. [Antes de Começar: Checklist de Pré-Requisitos](#1-antes-de-começar-checklist-de-pré-requisitos)
2. [Estrutura da Pasta Raiz de Construção](#2-estrutura-da-pasta-raiz-de-construção)
3. [Como Compilar o Instalador no Inno Setup 6](#3-como-compilar-o-instalador-no-inno-setup-6)
4. [Passo a Passo de Instalação no Computador da Escola](#4-passo-a-passo-de-instalação-no-computador-da-escola)
5. [O que Acontece nos Bastidores (Automações Invisíveis)](#5-o-que-acontece-nos-bastidores-automações-invisíveis)
6. [Checklist de Validação Pós-Instalação](#6-checklist-de-validação-pós-instalação)
7. [Guia de Resolução de Dúvidas e Problemas Comuns](#7-guia-de-resolução-de-dúvidas-e-problemas-comuns)

---

## 1. Antes de Começar: Checklist de Pré-Requisitos

Antes de iniciar a instalação em qualquer máquina, confira os itens essenciais:

### 🖥️ Hardware Mínimo Recomendado
- **Processador:** 2 núcleos (Dual Core 2.0 GHz ou superior).
- **Memória RAM:** Mínimo de 4 GB (8 GB recomendado para o servidor da secretaria).
- **Espaço Livre em Disco:** Mínimo de **800 MB livres** (para binários e banco inicial) e 2 GB livres recomendados para expansão de dados e backups.

### 🪟 Sistema Operacional
- Windows 10, Windows 11 ou Windows Server (2016, 2019, 2022) em edições **64-bit (x64)**.
- O usuário que executará a instalação deve ter privilégios de **Administrador**.

### 🛡️ Antivírus e Windows Defender
- Durante a instalação inicial, caso o *SmartScreen* do Windows exiba um aviso azul ("O Windows protegeu o seu computador"), clique em **"Mais informações"** e depois em **"Executar assim mesmo"**.

---

## 2. Estrutura da Pasta Raiz de Construção

A pasta oficial de empacotamento no computador de desenvolvimento deve ser:
```text
C:\SucessoEduSistema\
```

### O que deve estar dentro da pasta:
```text
C:\SucessoEduSistema\
├── SucessoEdu_Setup.iss             <- Script oficial de compilação Inno Setup 6
├── SucessoEdu_App.exe               <- Executável principal da aplicação
│                                       (ou SucessoEdu_Aplicativo_Offline.html + SucessoEdu_App.vbs)
├── criar_pastas_instalador.bat      <- Script facilitador para criar as pastas
├── instalar_sucessoedu.bat          <- Script para testes locais
└── redist\                          <- (Recomendado para instalador 100% offline)
    └── postgresql-16.1-windows-x64.exe
```

> 💡 **Dica Prática:** Se você colocar o `postgresql-16.1-windows-x64.exe` na pasta `redist\`, o instalador final funcionará em computadores sem internet (100% offline). Se não colocar, o instalador oferecerá o download oficial automático durante a instalação.

---

## 3. Como Compilar o Instalador no Inno Setup 6

A compilação é o processo de transformar todos os arquivos em um único executável instalador (`SucessoEduSistema_Setup_x64.exe`).

### Passo 1: Instale o Inno Setup 6
- Se ainda não tiver instalado, baixe gratuitamente o **Inno Setup 6** no site oficial: [jrsoftware.org/isdl.php](https://jrsoftware.org/isdl.php). A instalação leva menos de 1 minuto.

### Passo 2: Abra o Script
- Dê um duplo clique no arquivo `C:\SucessoEduSistema\SucessoEdu_Setup.iss` para abrir no Inno Setup Compiler.

### Passo 3: Compile
- Pressione o atalho de teclado **Ctrl + F9** (ou clique no menu superior **Build > Compile**).
- O compilador vai compactar os arquivos com compressão ultra-rápida LZMA2.
- Ao término, o arquivo instalador estará pronto em:
  ```text
  C:\SucessoEduSistema\Output\SucessoEduSistema_Setup_x64.exe
  ```

---

## 4. Passo a Passo de Instalação no Computador da Escola

Leve o arquivo `SucessoEduSistema_Setup_x64.exe` para o computador principal (servidor ou máquina da secretaria da escola):

1. **Clique com o botão direito** sobre o arquivo `SucessoEduSistema_Setup_x64.exe`.
2. Selecione **"Executar como Administrador"**.
3. Clique em **"Sim"** na janela de confirmação de permissões (UAC).
4. Na tela inicial do assistente, clique em **"Avançar"**.
5. Acompanhe a instalação: uma janela de console preta com letras verdes exibirá o progresso em tempo real (verificando disco, porta e banco de dados).
6. Ao finalizar, clique em **"Concluir"**.
7. O ícone oficial **SucessoEdu Gestão Educacional** estará criado na Área de Trabalho!

---

## 5. O que Acontece nos Bastidores (Automações Invisíveis)

O instalador foi programado para realizar sozinho todas as tarefas técnicas complexas que antes exigiam um técnico:

```text
[1. Checagem de Espaço] -> Garante que há mais de 500MB livres na unidade C:.
[2. Fechamento de Travas] -> Encerra qualquer processo residual do PostgreSQL travando arquivos.
[3. Teste de Rede e Portas] -> Testa a porta 5432. Se ocupada, muda automaticamente para 5433.
[4. Instalação Silenciosa] -> Instala o PostgreSQL 16.1 sem exibir dezenas de telas.
[5. Cluster de Dados] -> Cria a pasta de dados isolada em C:\SucessoEduSistema\Data\pgdata.
[6. Regras de Firewall] -> Libera as portas no Windows Firewall para permitir rede local.
[7. Backup Automático] -> Agenda uma tarefa do Windows para backup diário às 03:00 da manhã.
[8. Atalho Único] -> Cria 1 atalho oficial na Área de Trabalho (sem poluição visual).
```

---

## 6. Checklist de Validação Pós-Instalação

Após a instalação, você pode fazer uma validação rápida de 2 minutos para confirmar que tudo está 100%:

### 1. Testar a Abertura do Sistema
- Dê um duplo clique no atalho da Área de Trabalho. A tela de login do SucessoEdu deve carregar imediatamente.

### 2. Verificar se o Banco de Dados está Ativo
- Pressione as teclas `Ctrl + Shift + Esc` para abrir o **Gerenciador de Tarefas**.
- Na aba "Serviços" ou "Processos em Segundo Plano", verifique se o processo **`postgres.exe`** está em execução.

### 3. Verificar o Backup Automático
- Abra o menu Iniciar, digite **Agendador de Tarefas** e pressione Enter.
- Verifique se a tarefa **`SucessoEdu_DailyBackup`** está listada com disparo diário às 03:00.

---

## 7. Guia de Resolução de Dúvidas e Problemas Comuns

### ❓ P: O instalador deu erro dizendo que a porta 5432 está em uso. O que fazer?
**R:** Nada! O instalador possui **auto-resolução inteligente**. Ele detecta o conflito na porta 5432 e aloca automaticamente a porta 5433 ou superior, salvando a configuração no registro do Windows (`HKLM\SOFTWARE\SucessoEdu\Database`).

### ❓ P: O que acontece se a luz cair ou o computador for reiniciado durante o uso?
**R:** O serviço do banco de dados é configurado com inicialização automática (`Automatic`), subindo sozinho assim que o Windows inicializa. Além disso, as transações do PostgreSQL garantem integridade ACID (sem corrupção de tabelas).

### ❓ P: Como instalar nas máquinas dos professores ou laboratório (estações clientes)?
**R:** Nas estações dos professores, não é necessário reinstalar o banco de dados. Basta copiar o atalho ou apontar o navegador da máquina para o endereço IP do servidor principal (exemplo: `http://192.168.1.100:3000`).

### ❓ P: Onde ficam guardados os backups?
**R:** Por padrão, os backups diários locais são salvos em:
```text
C:\SucessoEduSistema\Backups\
```
Você pode copiar essa pasta para um Pen Drive externo semanalmente ou sincronizar com o Google Drive institucional.

### ❓ P: Ao clicar em "Concluir" no final da instalação, apareceu: "Incapaz de executar o arquivo: C:\SucessoEduSistema\SucessoEdu_App.exe - CreateProcess falhou; código 2"?
**R:** Esse erro ocorria porque a opção "Executar SucessoEdu Total Suite" tentava acionar o binário `SucessoEdu_App.exe`, mas como esse arquivo binário compilado ainda não estava na pasta raiz, o Windows retornava o código 2 (`ERROR_FILE_NOT_FOUND`).
**Correção aplicada:**
1. **Verificação Preventiva (`Check: FileExists` + `skipifdoesntexist`):** O instalador agora verifica se o `.exe` realmente existe antes de tentar executá-lo.
2. **Lançador Universal Automático (`SucessoEdu_App.bat` e `SucessoEdu_App.vbs`):** Se não houver um executável `.exe`, o instalador gera e aciona o lançador universal, abrindo a aplicação no navegador padrão (`http://localhost:3000` ou o SPA offline `index.html`) sem emitir nenhum aviso ou falha!

### ❓ P: Ao executar o instalador em outro computador, apareceu: "Este programa não suporta a versão do Windows que seu computador está executando"?
**R:** Esse erro ocorria por dois motivos principais:
1. **Restrição Rígida de Arquitetura (`ArchitecturesAllowed=x64`):** O instalador estava configurado para aceitar exclusivamente Windows 64-bit nativo. Se o outro computador rodasse Windows de 32 bits (x86) ou Windows ARM64 (Snapdragon/Surface), o Inno Setup bloqueava a inicialização imediatamente com essa mensagem.
2. **Versão Mínima Padrão do Inno Setup 6:** O Inno Setup 6 exige por padrão `MinVersion=6.1sp1` (Windows 7 SP1 ou superior). Se o computador estivesse executando Windows 7 RTM, Windows 8.0, Windows Server ou estivesse com o "Modo de Compatibilidade" ativado para Windows XP/Vista, o instalador era rejeitado.

**Como foi corrigido no script:**
- **Compatibilidade Universal (`MinVersion=6.1` e `OnlyBelowVersion=0`):** Agora aceita nativamente Windows 7, 8, 8.1, 10, 11 e todas as edições do Windows Server.
- **Suporte Híbrido 32-bit e 64-bit:** A diretiva restritiva `ArchitecturesAllowed=x64` foi removida. O instalador agora abre e roda em qualquer arquitetura. No Windows 64-bit ele ativa o modo 64-bit nativo (`ArchitecturesInstallIn64BitMode=x64`); no Windows 32-bit ele roda em 32-bit e ativa o modo Micro-Servidor Local / SQLite ou conexão com a rede da escola!
- **Dica se persistir em máquinas legadas:** Verifique se o executável do instalador não está com o "Modo de Compatibilidade" marcado com Windows XP ou Vista nas propriedades do arquivo (botão direito no `.exe` > Propriedades > Compatibilidade > Desmarcar modo de compatibilidade).

---

*Manual homologado para o ecossistema SucessoEdu Gestão Educacional. Dúvidas técnicas: `suportetecnicoads@gmail.com`.*
