$err = $null
$ast = [System.Management.Automation.Language.Parser]::ParseFile("c:\Dev\nodejs\AeroP2Pchat\.pages\public\install.ps1", [ref]$null, [ref]$err)
if ($err) { $err } else { "Syntax OK" }
