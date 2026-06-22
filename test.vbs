Dim shell, res
Set shell = CreateObject("WScript.Shell")
res = shell.Run("cmd /c netstat -an | findstr "":6543 "" | findstr ""LISTENING"" >nul 2>&1", 0, True)
WScript.Echo "Result: " & res
