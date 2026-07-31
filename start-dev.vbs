' Musical Sniffle — doble clic en ESTE archivo (no cierres las 2 ventanas que abre)
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

root = fso.GetParentFolderName(WScript.ScriptFullName)
backend = Chr(34) & root & "\scripts\run-backend.cmd" & Chr(34)
frontend = Chr(34) & root & "\scripts\run-frontend.cmd" & Chr(34)

shell.Run "cmd /c sc query postgresql-x64-18 | find ""RUNNING"" >nul", 0, True

MsgBox "Se abriran 2 ventanas:" & vbCrLf & vbCrLf & _
  "  AZUL  = Backend (API :8080)" & vbCrLf & _
  "  VERDE = Frontend (web :5173)" & vbCrLf & vbCrLf & _
  "NO cierres ninguna mientras uses la app." & vbCrLf & _
  "Solo cierra el navegador cuando termines.", _
  vbInformation, "Musical Sniffle"

shell.Run "cmd /k call " & backend, 1, False
WScript.Sleep 2000
shell.Run "cmd /k call " & frontend, 1, False
