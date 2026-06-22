# ============================================================
#  INSTALADOR - Sistema de Controle de Matrizes - Dacarto
#  Versao: 1.0.0
#  Descricao: Instala todas as dependencias e configura o
#             sistema automaticamente em qualquer computador
#             Windows 10/11 com acesso a internet.
# ============================================================

param(
    [string]$DiretorioDestino = "C:\Dacarto\Matrizes"
)

$ErrorActionPreference = "Continue"
$ProgressPreference    = "SilentlyContinue"

# ── Cores ─────────────────────────────────────────────────
function Write-Header {
    Clear-Host
    Write-Host ""
    Write-Host "  =======================================================" -ForegroundColor Cyan
    Write-Host "     DACARTO  -  Sistema de Controle de Matrizes" -ForegroundColor Cyan
    Write-Host "     Instalador v1.0.0" -ForegroundColor Cyan
    Write-Host "  =======================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step([string]$msg) {
    Write-Host "  [>>] $msg" -ForegroundColor Yellow
}

function Write-OK([string]$msg) {
    Write-Host "  [OK] $msg" -ForegroundColor Green
}

function Write-Err([string]$msg) {
    Write-Host "  [XX] $msg" -ForegroundColor Red
}

function Write-Info([string]$msg) {
    Write-Host "       $msg" -ForegroundColor Gray
}

# ── Verificar privilégios de Admin ────────────────────────
function Test-Admin {
    $current = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($current)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# ── Verificar / Instalar Java 21 ──────────────────────────
function Install-Java {
    Write-Step "Verificando Java 21..."
    
    try {
        $javaOut = java -version 2>&1 | Select-Object -First 1
        if ($javaOut -match '"(\d+)') {
            $major = [int]$Matches[1]
            if ($major -ge 21) {
                Write-OK "Java $major detectado. OK!"
                return $true
            }
            Write-Info "Java $major encontrado, mas e necessario Java 21+. Instalando..."
        }
    } catch {
        Write-Info "Java nao encontrado. Instalando..."
    }
    
    # Tentar via winget primeiro
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if ($winget) {
        Write-Info "Instalando via winget (Microsoft OpenJDK 21)..."
        winget install Microsoft.OpenJDK.21 --silent --accept-package-agreements --accept-source-agreements | Out-Null
        
        # Recarregar PATH
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
        
        $javaOut2 = java -version 2>&1 | Select-Object -First 1
        if ($javaOut2 -match '"21') {
            Write-OK "Java 21 instalado com sucesso!"
            return $true
        }
    }
    
    # Fallback: Download direto
    Write-Info "Baixando Microsoft OpenJDK 21 (pode demorar alguns minutos)..."
    $jdkUrl  = "https://aka.ms/download-jdk/microsoft-jdk-21-windows-x64.msi"
    $jdkMsi  = "$env:TEMP\microsoft-jdk-21.msi"
    
    try {
        Invoke-WebRequest -Uri $jdkUrl -OutFile $jdkMsi -TimeoutSec 300
        Start-Process msiexec.exe -ArgumentList "/i `"$jdkMsi`" /quiet /norestart" -Wait
        Remove-Item $jdkMsi -Force -ErrorAction SilentlyContinue
        
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
        
        Write-OK "Java 21 instalado!"
        return $true
    } catch {
        Write-Err "Falha ao instalar Java automaticamente."
        Write-Info "Instale manualmente em: https://learn.microsoft.com/java/openjdk/download#openjdk-21"
        return $false
    }
}

# ── Verificar / Instalar Node.js ──────────────────────────
function Install-Node {
    Write-Step "Verificando Node.js..."
    
    try {
        $nodeVer = node --version 2>&1
        if ($nodeVer -match "v(\d+)") {
            $major = [int]$Matches[1]
            if ($major -ge 18) {
                Write-OK "Node.js $nodeVer detectado. OK!"
                return $true
            }
            Write-Info "Node.js $nodeVer encontrado, mas e necessario v18+. Instalando..."
        }
    } catch {
        Write-Info "Node.js nao encontrado. Instalando..."
    }
    
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if ($winget) {
        Write-Info "Instalando Node.js 22 LTS via winget..."
        winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements | Out-Null
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
        
        $nodeVer2 = node --version 2>&1
        if ($nodeVer2 -match "v\d+") {
            Write-OK "Node.js $nodeVer2 instalado com sucesso!"
            return $true
        }
    }
    
    # Fallback: Download direto
    Write-Info "Baixando Node.js LTS..."
    $nodeUrl = "https://nodejs.org/dist/v22.16.0/node-v22.16.0-x64.msi"
    $nodeMsi = "$env:TEMP\nodejs-lts.msi"
    
    try {
        Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeMsi -TimeoutSec 300
        Start-Process msiexec.exe -ArgumentList "/i `"$nodeMsi`" /quiet /norestart" -Wait
        Remove-Item $nodeMsi -Force -ErrorAction SilentlyContinue
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
        Write-OK "Node.js instalado!"
        return $true
    } catch {
        Write-Err "Falha ao instalar Node.js automaticamente."
        Write-Info "Instale manualmente em: https://nodejs.org/en/download"
        return $false
    }
}

# ── Copiar arquivos do sistema ─────────────────────────────
function Copy-SystemFiles([string]$origem, [string]$destino) {
    Write-Step "Copiando arquivos do sistema para: $destino"
    
    New-Item -ItemType Directory -Path $destino -Force | Out-Null
    New-Item -ItemType Directory -Path "$destino\backend" -Force | Out-Null
    New-Item -ItemType Directory -Path "$destino\frontend" -Force | Out-Null
    New-Item -ItemType Directory -Path "$destino\logs" -Force | Out-Null
    
    # Backend JAR
    $jar = Join-Path $origem "backend\target\matrizes-api-1.0.0-SNAPSHOT.jar"
    if (Test-Path $jar) {
        Copy-Item $jar "$destino\backend\" -Force
        Write-OK "Backend (API) copiado."
    } else {
        Write-Err "JAR do backend nao encontrado! Execute 'mvn package' antes de instalar."
        return $false
    }
    
    # Chisel tunnel
    $chisel = Join-Path $origem "chisel.exe"
    if (Test-Path $chisel) {
        Copy-Item $chisel "$destino\" -Force
        Write-OK "Tunel Chisel copiado."
    } else {
        Write-Err "chisel.exe nao encontrado na pasta de origem!"
        return $false
    }
    
    # Frontend - copiar tudo exceto node_modules e dist
    Write-Info "Copiando codigo do frontend..."
    $frontendDest = "$destino\frontend"
    
    $excluir = @("node_modules", "dist", "dist-electron", ".git")
    Get-ChildItem "$origem\frontend" -Force | Where-Object { $_.Name -notin $excluir } | ForEach-Object {
        if ($_.PSIsContainer) {
            Copy-Item $_.FullName $frontendDest -Recurse -Force
        } else {
            Copy-Item $_.FullName $frontendDest -Force
        }
    }
    Write-OK "Frontend copiado."
    
    return $true
}

# ── Criar launcher invisivel e splash screen ──────────────
function Create-LauncherFiles([string]$destino) {
    Write-Step "Criando launcher profissional (sem janelas de console)..."

    # ----- launcher.vbs (processo invisivel) -----
    $vbsContent = @'
' ============================================================
'  DACARTO - Matrizes Controller - Launcher invisivel
' ============================================================
Dim objShell, objFSO, baseDir
Set objShell = CreateObject("WScript.Shell")
Set objFSO   = CreateObject("Scripting.FileSystemObject")
baseDir = objFSO.GetParentFolderName(WScript.ScriptFullName)

' Abrir splash screen
Dim splashPath
splashPath = baseDir & "\splash.hta"
If objFSO.FileExists(splashPath) Then
    objShell.Run "mshta.exe """ & splashPath & """", 1, False
End If

' Encerrar processos anteriores
objShell.Run "taskkill /F /IM chisel.exe", 0, True
objShell.Run "taskkill /F /IM java.exe",   0, True
objShell.Run "taskkill /F /IM node.exe",   0, True
WScript.Sleep 3000

' Iniciar Chisel (invisivel)
Dim chiselCmd
chiselCmd = """" & baseDir & "\chisel.exe"" client --auth dacarto:Matrizes123@@ https://leleokaid-chisel-dacarto1.hf.space 6543:aws-1-sa-east-1.pooler.supabase.com:6543"
objShell.Run chiselCmd, 0, False

' Aguardar tunel (ate 30s)
Dim i, tunelOK, result
tunelOK = False
For i = 1 To 30
    WScript.Sleep 1000
    result = objShell.Run("netstat -an | findstr "":6543 "" | findstr ""LISTENING""", 0, True)
    If result = 0 Then
        tunelOK = True
        Exit For
    End If
Next

If Not tunelOK Then
    MsgBox "Erro ao conectar ao banco de dados." & vbCrLf & "Verifique sua conexao com a internet.", vbCritical, "Dacarto - Erro de Conexao"
    WScript.Quit 1
End If

' Iniciar Backend (invisivel)
Dim backendCmd
backendCmd = "java -jar """ & baseDir & "\backend\matrizes-api-1.0.0-SNAPSHOT.jar"" --spring.profiles.active=prod"
objShell.Run backendCmd, 0, False

' Aguardar Backend (ate 90s)
Dim backendOK
backendOK = False
For i = 1 To 90
    WScript.Sleep 1000
    result = objShell.Run("netstat -an | findstr "":8080 "" | findstr ""LISTENING""", 0, True)
    If result = 0 Then
        backendOK = True
        Exit For
    End If
Next

If Not backendOK Then
    MsgBox "O servidor nao iniciou corretamente." & vbCrLf & "Verifique os logs em: " & baseDir & "\logs\backend.log", vbCritical, "Dacarto - Erro no Servidor"
    WScript.Quit 1
End If

' Iniciar Frontend (invisivel)
Dim frontendCmd
frontendCmd = "cmd /c cd /d """ & baseDir & "\frontend"" && npm run dev"
objShell.Run frontendCmd, 0, False

' Aguardar frontend (15s)
WScript.Sleep 15000

' Abrir navegador na tela de login
objShell.Run "http://localhost:5173", 1, False

WScript.Quit 0
'@
    $vbsContent | Out-File -FilePath "$destino\launcher.vbs" -Encoding ASCII -Force
    Write-OK "launcher.vbs criado."

    # ----- Dacarto-Matrizes.bat (ponto de entrada do usuario) -----
    $batEntryContent = @'
@echo off
wscript.exe /nologo "%~dp0launcher.vbs"
'@
    $batEntryContent | Out-File -FilePath "$destino\Dacarto-Matrizes.bat" -Encoding ASCII -Force
    Write-OK "Dacarto-Matrizes.bat criado."

    # ----- splash.hta sera copiado da pasta de origem -----
}

# ── Instalar dependências do frontend ─────────────────────
function Install-FrontendDeps([string]$frontendDir) {
    Write-Step "Instalando dependencias do Frontend (npm install)..."
    Write-Info "Isso pode levar alguns minutos na primeira vez..."
    
    Push-Location $frontendDir
    try {
        $npmResult = npm install --prefer-offline 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-OK "Dependencias do Frontend instaladas."
            return $true
        } else {
            # Tentar sem cache
            npm install 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-OK "Dependencias do Frontend instaladas."
                return $true
            }
            Write-Err "Falha ao instalar dependencias do Frontend."
            return $false
        }
    } finally {
        Pop-Location
    }
}

# ── Copiar splash.hta para destino ────────────────────────
function Copy-SplashFile([string]$origem, [string]$destino) {
    Write-Step "Copiando splash screen..."
    $splashSrc = Join-Path $origem "splash.hta"
    if (Test-Path $splashSrc) {
        Copy-Item $splashSrc "$destino\splash.hta" -Force
        Write-OK "splash.hta copiado."
    } else {
        Write-Info "splash.hta nao encontrado na origem - sera gerado pelo launcher."
    }
}

# ── Criar atalho na área de trabalho ──────────────────────
function Create-DesktopShortcut([string]$destino) {
    Write-Step "Criando atalho na Area de Trabalho..."
    
    $desktop = [Environment]::GetFolderPath("Desktop")
    $shortcutPath = "$desktop\Dacarto - Matrizes.lnk"
    
    $WScriptShell = New-Object -ComObject WScript.Shell
    $shortcut = $WScriptShell.CreateShortcut($shortcutPath)
    # Aponta para o launcher invisivel (sem janela de console)
    $shortcut.TargetPath      = "$destino\Dacarto-Matrizes.bat"
    $shortcut.WorkingDirectory = $destino
    $shortcut.Description     = "Sistema de Controle de Matrizes - Dacarto"
    $shortcut.IconLocation    = "%SystemRoot%\system32\imageres.dll,109"
    $shortcut.WindowStyle     = 7  # Iniciar minimizado (oculto)
    $shortcut.Save()
    
    Write-OK "Atalho criado na Area de Trabalho."
}

# ── Criar desinstalador ───────────────────────────────────
function Create-Uninstaller([string]$destino) {
    $uninstallContent = @"
@echo off
title Dacarto - Desinstalador
echo Desinstalando Sistema de Controle de Matrizes - Dacarto...
echo.

taskkill /F /IM chisel.exe >nul 2>&1
taskkill /F /IM java.exe   >nul 2>&1
taskkill /F /IM node.exe   >nul 2>&1

:: Remover atalho da area de trabalho
set DESKTOP=%USERPROFILE%\Desktop
del "%DESKTOP%\Dacarto - Matrizes.lnk" >nul 2>&1

echo Atalho removido.
echo.
echo Para remover os arquivos do sistema, exclua a pasta:
echo   $destino
echo.
pause
"@
    $uninstallContent | Out-File -FilePath "$destino\desinstalar.bat" -Encoding ASCII -Force
}

# ── Registrar no Programs do Windows ──────────────────────
function Register-InAddRemovePrograms([string]$destino) {
    $regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\DacartoMatrizes"
    try {
        New-Item -Path $regPath -Force | Out-Null
        Set-ItemProperty -Path $regPath -Name "DisplayName"     -Value "Dacarto - Controle de Matrizes"
        Set-ItemProperty -Path $regPath -Name "DisplayVersion"  -Value "1.0.0"
        Set-ItemProperty -Path $regPath -Name "Publisher"       -Value "Dacarto"
        Set-ItemProperty -Path $regPath -Name "UninstallString" -Value "`"$destino\desinstalar.bat`""
        Set-ItemProperty -Path $regPath -Name "InstallLocation" -Value $destino
        Set-ItemProperty -Path $regPath -Name "NoModify"        -Value 1 -Type DWord
        Set-ItemProperty -Path $regPath -Name "NoRepair"        -Value 1 -Type DWord
        Write-OK "Registrado em 'Adicionar/Remover Programas'."
    } catch {
        Write-Info "Aviso: nao foi possivel registrar em Adicionar/Remover Programas (nao critico)."
    }
}

# ════════════════════════════════════════════════════════════
# FLUXO PRINCIPAL
# ════════════════════════════════════════════════════════════

Write-Header

# Verificar se está sendo executado a partir da pasta do projeto
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$jarPath   = Join-Path $scriptDir "backend\target\matrizes-api-1.0.0-SNAPSHOT.jar"

if (-not (Test-Path $jarPath)) {
    Write-Err "Este instalador deve ser executado a partir da pasta do projeto!"
    Write-Info "Pasta atual: $scriptDir"
    Write-Info "Arquivo nao encontrado: $jarPath"
    Write-Host ""
    Write-Host "  Execute o instalador na mesma pasta que contem os" -ForegroundColor Red
    Write-Host "  subdiretorios 'backend', 'frontend' e 'chisel.exe'." -ForegroundColor Red
    Write-Host ""
    Read-Host "  Pressione ENTER para sair"
    exit 1
}

Write-Host "  Diretorio de origem : $scriptDir" -ForegroundColor Cyan
Write-Host "  Diretorio de destino: $DiretorioDestino" -ForegroundColor Cyan
Write-Host ""
Write-Host "  O instalador vai:" -ForegroundColor White
Write-Host "   - Verificar/instalar Java 21" -ForegroundColor Gray
Write-Host "   - Verificar/instalar Node.js 22 LTS" -ForegroundColor Gray
Write-Host "   - Copiar arquivos do sistema" -ForegroundColor Gray
Write-Host "   - Instalar dependencias do Frontend" -ForegroundColor Gray
Write-Host "   - Criar atalho na Area de Trabalho" -ForegroundColor Gray
Write-Host ""

$confirm = Read-Host "  Iniciar instalacao? (S/N)"
if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "  Instalacao cancelada." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "  ────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  ETAPA 1/5 - Dependencias" -ForegroundColor White
Write-Host "  ────────────────────────────────────────────────────" -ForegroundColor DarkGray

$javaOk = Install-Java
if (-not $javaOk) {
    Write-Err "Java 21 e obrigatorio. Instalacao abortada."
    Read-Host "Pressione ENTER para sair"
    exit 1
}

$nodeOk = Install-Node
if (-not $nodeOk) {
    Write-Err "Node.js e obrigatorio. Instalacao abortada."
    Read-Host "Pressione ENTER para sair"
    exit 1
}

Write-Host ""
Write-Host "  ────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  ETAPA 2/5 - Copiando Arquivos" -ForegroundColor White
Write-Host "  ────────────────────────────────────────────────────" -ForegroundColor DarkGray

$copyOk = Copy-SystemFiles -origem $scriptDir -destino $DiretorioDestino
if (-not $copyOk) {
    Write-Err "Falha ao copiar arquivos. Instalacao abortada."
    Read-Host "Pressione ENTER para sair"
    exit 1
}

Write-Host ""
Write-Host "  ────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  ETAPA 3/5 - Frontend" -ForegroundColor White
Write-Host "  ────────────────────────────────────────────────────" -ForegroundColor DarkGray

$npmOk = Install-FrontendDeps -frontendDir "$DiretorioDestino\frontend"
if (-not $npmOk) {
    Write-Err "Falha ao instalar dependencias do frontend."
    Write-Info "Tente manualmente: cd '$DiretorioDestino\frontend' && npm install"
}

Write-Host ""
Write-Host "  ────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  ETAPA 4/5 - Configuracao" -ForegroundColor White
Write-Host "  ────────────────────────────────────────────────────" -ForegroundColor DarkGray

Create-LauncherFiles    -destino $DiretorioDestino
Copy-SplashFile         -origem $scriptDir -destino $DiretorioDestino
Create-Uninstaller      -destino $DiretorioDestino
Create-DesktopShortcut  -destino $DiretorioDestino
Register-InAddRemovePrograms -destino $DiretorioDestino

Write-Host ""
Write-Host "  ────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  ETAPA 5/5 - Verificacao Final" -ForegroundColor White
Write-Host "  ────────────────────────────────────────────────────" -ForegroundColor DarkGray

$erros = 0
@(
    "$DiretorioDestino\backend\matrizes-api-1.0.0-SNAPSHOT.jar",
    "$DiretorioDestino\chisel.exe",
    "$DiretorioDestino\frontend\package.json",
    "$DiretorioDestino\launcher.vbs",
    "$DiretorioDestino\splash.hta",
    "$DiretorioDestino\Dacarto-Matrizes.bat"
) | ForEach-Object {
    if (Test-Path $_) {
        Write-OK "$(Split-Path $_ -Leaf)"
    } else {
        Write-Err "FALTANDO: $_"
        $erros++
    }
}

Write-Host ""
if ($erros -eq 0) {
    Write-Host "  =======================================================" -ForegroundColor Green
    Write-Host "   INSTALACAO CONCLUIDA COM SUCESSO!" -ForegroundColor Green
    Write-Host "  =======================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Para iniciar o sistema:" -ForegroundColor White
    Write-Host "   - Clique no atalho 'Dacarto - Matrizes' na Area de Trabalho" -ForegroundColor Gray
    Write-Host "   - Ou execute: $DiretorioDestino\Dacarto-Matrizes.bat" -ForegroundColor Gray
    Write-Host "" 
    Write-Host "  Experiencia do usuario:" -ForegroundColor White
    Write-Host "   - Nenhuma janela de console sera exibida ao iniciar" -ForegroundColor Gray
    Write-Host "   - Uma tela de carregamento profissional sera mostrada" -ForegroundColor Gray
    Write-Host "   - O navegador abrira diretamente na tela de login" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Credenciais padrao:" -ForegroundColor White
    Write-Host "   - Usuario: admin" -ForegroundColor Gray
    Write-Host "   - Senha:   admin" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  REQUISITOS EM USO:" -ForegroundColor White
    Write-Host "   - Conexao com internet (para tunel Supabase)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  =======================================================" -ForegroundColor Green
    Write-Host ""
    
    $iniciar = Read-Host "  Deseja iniciar o sistema agora? (S/N)"
    if ($iniciar -eq "S" -or $iniciar -eq "s") {
        # Inicia o launcher invisivel (sem janela de console)
        Start-Process "wscript.exe" -ArgumentList "/nologo `"$DiretorioDestino\launcher.vbs`""
    }
} else {
    Write-Host "  =======================================================" -ForegroundColor Red
    Write-Host "   INSTALACAO CONCLUIDA COM $erros ERRO(S)." -ForegroundColor Red
    Write-Host "   Verifique os itens marcados com [XX] acima." -ForegroundColor Red
    Write-Host "  =======================================================" -ForegroundColor Red
}

Write-Host ""
Read-Host "  Pressione ENTER para fechar"
