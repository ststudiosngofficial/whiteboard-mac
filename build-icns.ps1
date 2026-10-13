# Builds icon.icns for the Mac app from the PNG frames inside whiteboard-icon.ico.
# Usage: powershell -ExecutionPolicy Bypass -File build-icns.ps1
$ErrorActionPreference = 'Stop'
$src = 'C:\Users\ojosa\Downloads\whiteboard-app\whiteboard-icon.ico'
$dst = Join-Path $PSScriptRoot 'icon.icns'
$d = [IO.File]::ReadAllBytes($src)
$count = [BitConverter]::ToUInt16($d, 4)
$want = @{ 16 = 'ic04'; 32 = 'ic05'; 128 = 'ic07'; 256 = 'ic08' }
$els = @()
for ($i = 0; $i -lt $count; $i++) {
  $o = 6 + $i * 16
  [int]$w = $d[$o]
  if ($w -eq 0) { $w = 256 }
  if (-not $want.ContainsKey($w)) { continue }
  $sz = [BitConverter]::ToUInt32($d, ($o + 8))
  $off = [BitConverter]::ToUInt32($d, ($o + 12))
  [byte[]]$data = $d[$off..($off + $sz - 1)]
  [byte[]]$type = [Text.Encoding]::ASCII.GetBytes($want[$w])
  [byte[]]$lb = [BitConverter]::GetBytes([uint32](8 + $data.Length))
  [Array]::Reverse($lb)
  $els += ,([byte[]]($type + $lb + $data))
  Write-Output "added $($want[$w]) ${w}px"
}
$total = 8
foreach ($e in $els) { $total += $e.Length }
$out = New-Object Collections.Generic.List[byte]
$out.AddRange([Text.Encoding]::ASCII.GetBytes('icns'))
[byte[]]$tb = [BitConverter]::GetBytes([uint32]$total)
[Array]::Reverse($tb)
$out.AddRange($tb)
foreach ($e in $els) { $out.AddRange($e) }
[IO.File]::WriteAllBytes($dst, $out.ToArray())
Write-Output "ICNS_TOTAL=$total -> $dst"
# verify
$v = [IO.File]::ReadAllBytes($dst)
$magic = [Text.Encoding]::ASCII.GetString($v[0..3])
[byte[]]$rb = $v[4..7]
[Array]::Reverse($rb)
$decl = [BitConverter]::ToUInt32($rb, 0)
Write-Output "VERIFY magic=$magic declared=$decl actual=$($v.Length)"
