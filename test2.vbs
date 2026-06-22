Dim shell, baseDir, objFSO
Set shell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")
baseDir = objFSO.GetParentFolderName(WScript.ScriptFullName)
shell.Run """" & baseDir & "\chisel.exe"" client --auth dacarto:Matrizes123@@ https://leleokaid-chisel-dacarto1.hf.space 6543:aws-1-sa-east-1.pooler.supabase.com:6543", 0, False
WScript.Echo "Chisel started."
