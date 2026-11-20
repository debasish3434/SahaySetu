$ErrorActionPreference = 'Stop'

$frontendRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$certificateDirectory = Join-Path $frontendRoot '.local-https'
$pfxPath = Join-Path $certificateDirectory 'localhost.pfx'
$rootCerPath = Join-Path $certificateDirectory 'local-root-ca.cer'
$leafCerPath = Join-Path $certificateDirectory 'localhost.cer'
$envPath = Join-Path $frontendRoot '.env'

New-Item -ItemType Directory -Path $certificateDirectory -Force | Out-Null

$passphrase = [guid]::NewGuid().ToString('N')
$securePassphrase = ConvertTo-SecureString -String $passphrase -AsPlainText -Force
$rootFriendlyName = 'SahaySetu Local Development Root CA'
$rootCertificate = Get-ChildItem 'Cert:\CurrentUser\My' |
  Where-Object { $_.FriendlyName -eq $rootFriendlyName -and $_.NotAfter -gt (Get-Date) } |
  Sort-Object NotAfter -Descending |
  Select-Object -First 1

if (-not $rootCertificate) {
  $rootCertificate = New-SelfSignedCertificate `
    -Type Custom `
    -Subject 'CN=SahaySetu Local Development Root CA' `
    -KeyUsageProperty Sign `
    -KeyUsage CertSign, CRLSign, DigitalSignature `
    -TextExtension @('2.5.29.19={critical}{text}ca=TRUE&pathlength=0') `
    -CertStoreLocation 'Cert:\CurrentUser\My' `
    -FriendlyName $rootFriendlyName `
    -KeyExportPolicy Exportable `
    -KeyLength 2048 `
    -NotAfter (Get-Date).AddYears(5)
}

$localAddresses = [System.Net.NetworkInformation.NetworkInterface]::GetAllNetworkInterfaces() |
  Where-Object { $_.OperationalStatus -eq 'Up' } |
  ForEach-Object { $_.GetIPProperties().UnicastAddresses } |
  Where-Object {
    $_.Address.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork -and
    -not [System.Net.IPAddress]::IsLoopback($_.Address) -and
    $_.Address.ToString() -notlike '169.254*'
  } |
  ForEach-Object { $_.Address.ToString() } |
  Sort-Object -Unique

$subjectAltNames = @('DNS=localhost') + @($localAddresses | ForEach-Object { "IPAddress=$($_)" })
$subjectAltNameExtension = "2.5.29.17={text}$($subjectAltNames -join '&')"

$certificate = New-SelfSignedCertificate `
  -Subject 'CN=localhost' `
  -Type SSLServerAuthentication `
  -Signer $rootCertificate `
  -TextExtension @($subjectAltNameExtension) `
  -CertStoreLocation 'Cert:\CurrentUser\My' `
  -FriendlyName 'SahaySetu localhost development HTTPS' `
  -KeyExportPolicy Exportable `
  -KeyLength 2048 `
  -NotAfter (Get-Date).AddYears(2)

Export-PfxCertificate -Cert $certificate -FilePath $pfxPath -Password $securePassphrase | Out-Null
Export-Certificate -Cert $rootCertificate -FilePath $rootCerPath -Force | Out-Null
Export-Certificate -Cert $certificate -FilePath $leafCerPath -Force | Out-Null
& certutil.exe -user -addstore Root $rootCerPath | Out-Host
if ($LASTEXITCODE -ne 0) { throw 'Could not trust the local development root certificate.' }

$envLines = @()
if (Test-Path -LiteralPath $envPath) {
  $envLines = @(Get-Content -LiteralPath $envPath | Where-Object { $_ -notmatch '^LOCAL_HTTPS_PASSPHRASE=' })
}
$envLines += "LOCAL_HTTPS_PASSPHRASE=$passphrase"
Set-Content -LiteralPath $envPath -Value $envLines -Encoding utf8

Write-Output "Trusted local HTTPS certificate created for localhost and $($localAddresses.Count) local network address(es)."
Write-Output 'Restart the frontend dev server and reopen its HTTPS address.'
