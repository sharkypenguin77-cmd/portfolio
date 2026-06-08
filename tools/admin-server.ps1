$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$prefix = "http://127.0.0.1:8787/"
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add($prefix)
$listener.Start()

Write-Host "Portfolio admin is running:"
Write-Host "$($prefix)admin.html"
Write-Host "Press Ctrl+C to stop."

function Send-Text {
  param(
    [System.Net.HttpListenerResponse] $Response,
    [int] $StatusCode,
    [string] $Text,
    [string] $ContentType = "text/plain; charset=utf-8"
  )

  $bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
  $Response.StatusCode = $StatusCode
  $Response.ContentType = $ContentType
  $Response.ContentLength64 = $bytes.Length
  $Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $Response.OutputStream.Close()
}

function Get-ContentType {
  param([string] $Path)
  switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    ".html" { "text/html; charset=utf-8" }
    ".css" { "text/css; charset=utf-8" }
    ".js" { "text/javascript; charset=utf-8" }
    ".json" { "application/json; charset=utf-8" }
    ".mp4" { "video/mp4" }
    ".m4v" { "video/mp4" }
    ".webm" { "video/webm" }
    ".ogg" { "video/ogg" }
    ".mov" { "video/quicktime" }
    ".jpg" { "image/jpeg" }
    ".jpeg" { "image/jpeg" }
    ".png" { "image/png" }
    ".webp" { "image/webp" }
    ".gif" { "image/gif" }
    default { "application/octet-stream" }
  }
}

while ($listener.IsListening) {
  $context = $listener.GetContext()
  $request = $context.Request
  $response = $context.Response

  try {
    if ($request.HttpMethod -eq "POST" -and $request.Url.AbsolutePath -eq "/api/works") {
      $reader = [System.IO.StreamReader]::new($request.InputStream, [System.Text.Encoding]::UTF8)
      $body = $reader.ReadToEnd()
      $reader.Close()

      $works = $body | ConvertFrom-Json
      $json = $works | ConvertTo-Json -Depth 8
      $content = @"
// Add your portfolio items here. Keep newest or strongest works near the top.
// This file can be updated manually or with the local admin at http://127.0.0.1:8787/admin.html.

window.portfolioWorks = $json;
"@

      [System.IO.File]::WriteAllText((Join-Path $root "works.js"), $content, [System.Text.UTF8Encoding]::new($false))
      Send-Text $response 200 "Saved to works.js. Preview the site, then deploy when ready."
      continue
    }

    if ($request.HttpMethod -eq "POST" -and $request.Url.AbsolutePath -eq "/api/upload-video") {
      if ($request.ContentLength64 -gt 99500000) {
        Send-Text $response 413 "Video is too large. Please keep files under 95MB, or use YouTube/Vimeo."
        continue
      }

      $rawName = [Uri]::UnescapeDataString($request.Headers["X-File-Name"])
      if ([string]::IsNullOrWhiteSpace($rawName)) {
        Send-Text $response 400 "Missing file name."
        continue
      }

      $fileName = [System.IO.Path]::GetFileName($rawName)
      foreach ($char in [System.IO.Path]::GetInvalidFileNameChars()) {
        $fileName = $fileName.Replace($char, "-")
      }

      $extension = [System.IO.Path]::GetExtension($fileName).ToLowerInvariant()
      if ($extension -notin @(".mp4", ".webm", ".mov", ".m4v", ".ogg")) {
        Send-Text $response 400 "Unsupported video type. Use mp4, webm, mov, m4v, or ogg."
        continue
      }

      $videoDir = Join-Path $root "assets\videos"
      [System.IO.Directory]::CreateDirectory($videoDir) | Out-Null

      $baseName = [System.IO.Path]::GetFileNameWithoutExtension($fileName)
      $safeName = ($baseName -replace "[^A-Za-z0-9._-]", "-").Trim("-")
      if ([string]::IsNullOrWhiteSpace($safeName)) {
        $safeName = "video"
      }

      $targetName = "$safeName$extension"
      $targetPath = Join-Path $videoDir $targetName
      if ([System.IO.File]::Exists($targetPath)) {
        $targetName = "$safeName-$(Get-Date -Format 'yyyyMMddHHmmss')$extension"
        $targetPath = Join-Path $videoDir $targetName
      }

      $fileStream = [System.IO.File]::Create($targetPath)
      try {
        $request.InputStream.CopyTo($fileStream)
      } finally {
        $fileStream.Close()
      }

      $publicPath = "assets/videos/$targetName"
      Send-Text $response 200 "{`"url`":`"$publicPath`"}" "application/json; charset=utf-8"
      continue
    }

    if ($request.HttpMethod -eq "POST" -and $request.Url.AbsolutePath -eq "/api/upload-cover") {
      if ($request.ContentLength64 -gt 10485760) {
        Send-Text $response 413 "Cover image is too large. Please keep it under 10MB."
        continue
      }

      $rawName = [Uri]::UnescapeDataString($request.Headers["X-File-Name"])
      if ([string]::IsNullOrWhiteSpace($rawName)) {
        Send-Text $response 400 "Missing file name."
        continue
      }

      $fileName = [System.IO.Path]::GetFileName($rawName)
      foreach ($char in [System.IO.Path]::GetInvalidFileNameChars()) {
        $fileName = $fileName.Replace($char, "-")
      }

      $extension = [System.IO.Path]::GetExtension($fileName).ToLowerInvariant()
      if ($extension -notin @(".jpg", ".jpeg", ".png", ".webp", ".gif")) {
        Send-Text $response 400 "Unsupported cover type. Use jpg, png, webp, or gif."
        continue
      }

      $coverDir = Join-Path $root "assets\covers"
      [System.IO.Directory]::CreateDirectory($coverDir) | Out-Null

      $baseName = [System.IO.Path]::GetFileNameWithoutExtension($fileName)
      $safeName = ($baseName -replace "[^A-Za-z0-9._-]", "-").Trim("-")
      if ([string]::IsNullOrWhiteSpace($safeName)) {
        $safeName = "cover"
      }

      $targetName = "$safeName$extension"
      $targetPath = Join-Path $coverDir $targetName
      if ([System.IO.File]::Exists($targetPath)) {
        $targetName = "$safeName-$(Get-Date -Format 'yyyyMMddHHmmss')$extension"
        $targetPath = Join-Path $coverDir $targetName
      }

      $fileStream = [System.IO.File]::Create($targetPath)
      try {
        $request.InputStream.CopyTo($fileStream)
      } finally {
        $fileStream.Close()
      }

      $publicPath = "assets/covers/$targetName"
      Send-Text $response 200 "{`"url`":`"$publicPath`"}" "application/json; charset=utf-8"
      continue
    }

    if ($request.HttpMethod -eq "POST" -and $request.Url.AbsolutePath -eq "/api/deploy") {
      $status = git -C $root status --short
      if (-not $status) {
        Send-Text $response 200 "No changes to deploy."
        continue
      }

      git -C $root add works.js assets/videos assets/covers
      git -C $root commit -m "Update portfolio works"
      git -C $root push

      Send-Text $response 200 "Deploy complete. GitHub Pages usually updates in 1 to 3 minutes."
      continue
    }

    if ($request.HttpMethod -ne "GET") {
      Send-Text $response 405 "Method not allowed"
      continue
    }

    $path = [Uri]::UnescapeDataString($request.Url.AbsolutePath.TrimStart("/"))
    if ([string]::IsNullOrWhiteSpace($path)) {
      $path = "admin.html"
    }

    $fullPath = [System.IO.Path]::GetFullPath((Join-Path $root $path))
    if (-not $fullPath.StartsWith([System.IO.Path]::GetFullPath($root))) {
      Send-Text $response 403 "Forbidden"
      continue
    }

    if (-not [System.IO.File]::Exists($fullPath)) {
      Send-Text $response 404 "Not found"
      continue
    }

    $bytes = [System.IO.File]::ReadAllBytes($fullPath)
    $response.StatusCode = 200
    $response.ContentType = Get-ContentType $fullPath
    $response.ContentLength64 = $bytes.Length
    $response.OutputStream.Write($bytes, 0, $bytes.Length)
    $response.OutputStream.Close()
  } catch {
    Send-Text $response 500 $_.Exception.Message
  }
}
