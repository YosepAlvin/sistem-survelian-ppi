# PowerShell script to convert theme from dark to light
$projectDir = "c:\Users\Admin\Documents\trae_projects\sistem ppi rumah sakit budi rahayu"
$excludeDirs = @("node_modules", ".next", ".git", ".kiro")

# Define all replacements
$replacements = @(
    # Background Colors
    @{ old = "bg-slate-950"; new = "bg-white" },
    @{ old = "bg-slate-900"; new = "bg-white" },
    @{ old = "bg-slate-900/95"; new = "bg-white" },
    @{ old = "bg-slate-900/50"; new = "bg-slate-50" },
    @{ old = "bg-slate-800"; new = "bg-slate-50" },
    @{ old = "bg-slate-800/50"; new = "bg-slate-50" },
    @{ old = "bg-[#0B1220]"; new = "bg-white" },
    @{ old = "bg-[#172033]"; new = "bg-white" },
    @{ old = "bg-[#172033]/50"; new = "bg-slate-50" },
    @{ old = "bg-white/10"; new = "bg-slate-100" },
    @{ old = "bg-white/5"; new = "bg-slate-50" },
    @{ old = "bg-white/0"; new = "bg-transparent" },
    @{ old = "bg-slate-950/80"; new = "bg-slate-50/80" },
    @{ old = "bg-slate-950/50"; new = "bg-slate-50/50" },
    # Text Colors
    @{ old = "text-slate-100"; new = "text-slate-900" },
    @{ old = "text-slate-200"; new = "text-slate-800" },
    @{ old = "text-slate-300"; new = "text-slate-700" },
    @{ old = "text-slate-400"; new = "text-slate-600" },
    @{ old = "text-emerald-400"; new = "text-emerald-700" },
    # Border Colors
    @{ old = "border-slate-800"; new = "border-slate-200" },
    @{ old = "border-slate-700"; new = "border-slate-200" },
    @{ old = "border-slate-600"; new = "border-slate-300" },
    @{ old = "border-white/5"; new = "border-slate-200" },
    @{ old = "border-white/10"; new = "border-slate-200" },
    @{ old = "border-white/20"; new = "border-slate-300" },
    @{ old = "border-emerald-500/40"; new = "border-emerald-300" },
    # Shadow Colors
    @{ old = "shadow-slate-950/40"; new = "shadow-slate-200/50" },
    @{ old = "shadow-blue-900/20"; new = "shadow-blue-200/50" },
    @{ old = "shadow-blue-900/30"; new = "shadow-blue-200/50" },
    @{ old = "shadow-black/20"; new = "shadow-slate-200/50" },
    @{ old = "shadow-black/40"; new = "shadow-slate-200/50" },
    # Additional Fixes
    @{ old = "hover:bg-white/5"; new = "hover:bg-slate-100" },
    @{ old = "hover:bg-white/10"; new = "hover:bg-slate-200" },
    @{ old = "hover:bg-white/20"; new = "hover:bg-slate-300" },
    @{ old = "hover:bg-slate-800"; new = "hover:bg-slate-200" },
    @{ old = "hover:text-white"; new = "hover:text-slate-900" },
    @{ old = "placeholder-slate-400"; new = "placeholder-slate-500" },
    @{ old = "border-t border-white/10"; new = "border-t border-slate-200" },
    @{ old = "border-b border-white/10"; new = "border-b border-slate-200" },
    @{ old = "border-l border-white/5"; new = "border-l border-slate-200" },
    @{ old = "bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950"; new = "bg-gradient-to-br from-blue-50 via-white to-indigo-50" }
)

# Get all relevant files
$files = Get-ChildItem -Path $projectDir -Recurse -Include "*.tsx", "*.ts", "*.css" | Where-Object {
    $exclude = $false
    foreach ($dir in $excludeDirs) {
        if ($_.FullName -match [regex]::Escape("\\$dir\\")) {
            $exclude = $true
            break
        }
    }
    -not $exclude
}

Write-Host "Found $($files.Count) files to process"

# Process each file
foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $original = $content
    foreach ($rep in $replacements) {
        $content = $content.Replace($rep.old, $rep.new)
    }
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "All files processed successfully!"
