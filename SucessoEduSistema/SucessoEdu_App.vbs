' ============================================================================
' SucessoEdu Gestão Educacional - Lançador Silencioso VBScript
' Diretorio Alvo: C:\SucessoEduSistema
' ============================================================================
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)

If fso.FileExists(currentDir & "\SucessoEdu_App.exe") Then
    WshShell.Run """" & currentDir & "\SucessoEdu_App.exe""", 1, False
ElseIf fso.FileExists(currentDir & "\SucessoEdu_Aplicativo_Offline.html") Then
    WshShell.Run """" & currentDir & "\SucessoEdu_Aplicativo_Offline.html""", 1, False
ElseIf fso.FileExists(currentDir & "\index.html") Then
    WshShell.Run """" & currentDir & "\index.html""", 1, False
Else
    WshShell.Run "http://localhost:3000/", 1, False
End If
