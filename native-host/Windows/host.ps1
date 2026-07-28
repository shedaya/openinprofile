# Open in Profile — Native Messaging Host v2
# Central config lives at %APPDATA%\OpenInProfile\profiles.json
# Shared by all Chrome profiles on this PC.

$configDir  = Join-Path $env:APPDATA "OpenInProfile"
$configFile = Join-Path $configDir "profiles.json"

# Native host protocol version. Bump when the message protocol changes so the
# extension can prompt users to reinstall an out-of-date companion app.
# v2: added get_settings/set_settings for cross-profile settings sync.
$HOST_VERSION = 2

# ── Native messaging I/O ──────────────────────────────────────────────────────
function Read-NativeMessage {
    $stdin = [System.Console]::OpenStandardInput()
    $lenBytes = New-Object byte[] 4
    $read = $stdin.Read($lenBytes, 0, 4)
    if ($read -eq 0) { return $null }
    $length = [System.BitConverter]::ToUInt32($lenBytes, 0)
    $msgBytes = New-Object byte[] $length
    $stdin.Read($msgBytes, 0, $length) | Out-Null
    return [System.Text.Encoding]::UTF8.GetString($msgBytes) | ConvertFrom-Json
}

function Write-NativeMessage($obj) {
    $json = $obj | ConvertTo-Json -Compress -Depth 10
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    $len   = [System.BitConverter]::GetBytes([uint32]$bytes.Length)
    $out   = [System.Console]::OpenStandardOutput()
    $out.Write($len, 0, 4)
    $out.Write($bytes, 0, $bytes.Length)
    $out.Flush()
}

# ── Config helpers ────────────────────────────────────────────────────────────
function Read-Config {
    # Returns an object with .profiles (array) and .settings (object).
    # Legacy files stored a bare array of profiles — normalise those.
    $empty = [PSCustomObject]@{ profiles = @(); settings = [PSCustomObject]@{} }
    if (-not (Test-Path $configFile)) { return $empty }
    try {
        $raw = Get-Content $configFile -Raw -Encoding UTF8
        $parsed = $raw | ConvertFrom-Json
        if ($parsed -is [System.Array]) {
            return [PSCustomObject]@{ profiles = $parsed; settings = [PSCustomObject]@{} }
        }
        $profiles = if ($parsed.PSObject.Properties['profiles']) { $parsed.profiles } else { @() }
        $settings = if ($parsed.PSObject.Properties['settings']) { $parsed.settings } else { [PSCustomObject]@{} }
        return [PSCustomObject]@{ profiles = $profiles; settings = $settings }
    } catch { return $empty }
}

function Write-Config($config) {
    if (-not (Test-Path $configDir)) {
        New-Item -ItemType Directory -Path $configDir -Force | Out-Null
    }
    $config | ConvertTo-Json -Depth 6 | Set-Content $configFile -Encoding UTF8
}

function Get-Config {
    return (Read-Config).profiles
}

function Save-Config($profiles) {
    $config = Read-Config
    $config.profiles = $profiles
    Write-Config $config
}

# ── Auto-detect Chrome profiles from Local State ──────────────────────────────
function Detect-ChromeProfiles {
    $localStatePath = Join-Path $env:LOCALAPPDATA "Google\Chrome\User Data\Local State"
    if (-not (Test-Path $localStatePath)) { return @() }

    try {
        $localState = Get-Content $localStatePath -Raw -Encoding UTF8 | ConvertFrom-Json
        $infoCache  = $localState.profile.info_cache
        $detected   = @()

        foreach ($prop in $infoCache.PSObject.Properties) {
            $dirName     = $prop.Name
            $profileInfo = $prop.Value
            $displayName = $profileInfo.name

            # Skip internal/system profiles
            if ($dirName -eq "System Profile" -or $dirName -eq "Guest Profile") { continue }
            if ($displayName -match "^Person \d+$" -and -not $profileInfo.gaia_name) {
                # Use a generic name if no Google account attached
                $displayName = "Profile ($dirName)"
            }

            # Prefer GAIA (Google account) name if available
            if ($profileInfo.gaia_name) { $displayName = $profileInfo.gaia_name }

            # Use local profile name if set and not generic
            if ($profileInfo.local_auth_credentials -or $profileInfo.managed_user_id -eq "") {
                if ($profileInfo.name -and $profileInfo.name -notmatch "^Person \d+$") {
                    $displayName = $profileInfo.name
                }
            }

            $detected += [PSCustomObject]@{ name = $displayName; dir = $dirName }
        }

        return $detected
    } catch {
        return @()
    }
}

# ── Find Chrome executable ────────────────────────────────────────────────────
function Get-Chrome {
    $paths = @(
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
    )
    return $paths | Where-Object { Test-Path $_ } | Select-Object -First 1
}

# ── Main ──────────────────────────────────────────────────────────────────────
$msg = Read-NativeMessage

if (-not $msg) {
    Write-NativeMessage @{ status = "error"; message = "No message received" }
    exit
}

switch ($msg.action) {

    "ping" {
        Write-NativeMessage @{ status = "ok"; version = $HOST_VERSION }
    }

    "get_profiles" {
        $profiles = Get-Config
        Write-NativeMessage @{ status = "ok"; profiles = $profiles }
    }

    "set_profiles" {
        try {
            Save-Config $msg.profiles
            Write-NativeMessage @{ status = "ok" }
        } catch {
            Write-NativeMessage @{ status = "error"; message = $_.Exception.Message }
        }
    }

    "get_settings" {
        $settings = (Read-Config).settings
        Write-NativeMessage @{ status = "ok"; settings = $settings }
    }

    "set_settings" {
        try {
            $config = Read-Config
            $config.settings = $msg.settings
            Write-Config $config
            Write-NativeMessage @{ status = "ok" }
        } catch {
            Write-NativeMessage @{ status = "error"; message = $_.Exception.Message }
        }
    }

    "detect_profiles" {
        $detected = Detect-ChromeProfiles
        Write-NativeMessage @{ status = "ok"; detected = $detected }
    }

    "open_url" {
        $chrome = Get-Chrome
        if (-not $chrome) {
            Write-NativeMessage @{ status = "error"; message = "Chrome not found" }
        } else {
            try {
                Start-Process -FilePath $chrome `
                    -ArgumentList "--profile-directory=`"$($msg.profile)`"", "`"$($msg.url)`""
                Write-NativeMessage @{ status = "ok" }
            } catch {
                Write-NativeMessage @{ status = "error"; message = $_.Exception.Message }
            }
        }
    }

    default {
        Write-NativeMessage @{ status = "error"; message = "Unknown action: $($msg.action)" }
    }
}
