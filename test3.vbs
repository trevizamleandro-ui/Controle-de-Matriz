Dim shell
Set shell = CreateObject("WScript.Shell")
shell.Run "cmd /c echo test > test.log", 0, False
