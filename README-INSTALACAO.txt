================================================================
 SISTEMA DE CONTROLE DE MATRIZES - DACARTO
 Guia de Instalação
================================================================

PASSO A PASSO PARA INSTALAR EM UM NOVO COMPUTADOR
--------------------------------------------------

1. COPIAR A PASTA DO PROJETO
   - Copie a pasta inteira "Projeto_controle_Matriz" para
     o novo computador (via pendrive, OneDrive ou rede).
   - A pasta DEVE conter:
       backend\target\matrizes-api-1.0.0-SNAPSHOT.jar
       frontend\  (pasta com os arquivos do frontend)
       chisel.exe
       INSTALAR.bat
       instalar-sistema.ps1

2. EXECUTAR O INSTALADOR
   - Clique com botão direito em "INSTALAR.bat"
   - Selecione "Executar como administrador"
   - Siga as instruções na tela

   O instalador vai:
   ✓ Verificar e instalar Java 21 automaticamente
   ✓ Verificar e instalar Node.js automaticamente
   ✓ Copiar os arquivos para C:\Dacarto\Matrizes
   ✓ Instalar as dependências do frontend
   ✓ Criar atalho na Área de Trabalho

3. USAR O SISTEMA
   - Clique no atalho "Dacarto - Matrizes" na Área de Trabalho
   - OU execute C:\Dacarto\Matrizes\iniciar-sistema.bat
   - Aguarde todos os serviços subirem (~40 segundos)
   - O navegador abrirá automaticamente

   LOGIN PADRÃO:
   Usuário: admin
   Senha:   admin

REQUISITOS
----------
- Windows 10 ou 11 (64 bits)
- Conexão com a internet (obrigatório para o banco de dados)
- Não é necessário instalar nada manualmente

PROBLEMAS COMUNS
----------------
Problema: "O sistema não abre / erro ao conectar"
Solução:  Verifique se há conexão com a internet.
          O sistema usa um tunel seguro para acessar o banco.

Problema: "Tela de login aparece mas não entra"
Solução:  Usuário: admin | Senha: admin
          Aguarde 5 segundos após o sistema abrir.

Problema: "A instalação falhou no Java/Node.js"
Solução:  Instale manualmente:
          - Java 21: https://learn.microsoft.com/java/openjdk/download
          - Node.js: https://nodejs.org/en/download
          Depois execute INSTALAR.bat novamente.

SUPORTE
-------
Em caso de problemas, contate a equipe de TI Dacarto.

================================================================
