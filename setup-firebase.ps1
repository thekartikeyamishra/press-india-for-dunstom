# Press India - Quick Setup Script for Windows PowerShell
# Run this script in your project root: E:\press-india

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   PRESS INDIA - FIREBASE SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
$currentPath = Get-Location
Write-Host "Current directory: $currentPath" -ForegroundColor Yellow

if (!(Test-Path "package.json")) {
    Write-Host "ERROR: package.json not found!" -ForegroundColor Red
    Write-Host "Please navigate to your project root directory first." -ForegroundColor Red
    Write-Host "Example: cd E:\press-india" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Found package.json" -ForegroundColor Green
Write-Host ""

# Check for required Firebase files
Write-Host "Checking for Firebase configuration files..." -ForegroundColor Yellow

$requiredFiles = @(
    "firebase.json",
    ".firebaserc",
    "firestore.rules",
    "firestore.indexes.json",
    "storage.rules"
)

$missingFiles = @()

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file (MISSING)" -ForegroundColor Red
        $missingFiles += $file
    }
}

Write-Host ""

if ($missingFiles.Count -gt 0) {
    Write-Host "ERROR: Missing required files!" -ForegroundColor Red
    Write-Host "Please copy these files to your project root:" -ForegroundColor Yellow
    foreach ($file in $missingFiles) {
        Write-Host "  - $file" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Download them from the outputs folder." -ForegroundColor Yellow
    exit 1
}

Write-Host "All Firebase configuration files found!" -ForegroundColor Green
Write-Host ""

# Check if Firebase CLI is installed
Write-Host "Checking Firebase CLI..." -ForegroundColor Yellow
try {
    $firebaseVersion = firebase --version 2>$null
    Write-Host "✓ Firebase CLI installed: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Firebase CLI not found" -ForegroundColor Red
    Write-Host "Install it with: npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Check if logged in to Firebase
Write-Host "Checking Firebase login..." -ForegroundColor Yellow
try {
    $loginStatus = firebase login:list 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Logged in to Firebase" -ForegroundColor Green
    } else {
        Write-Host "✗ Not logged in to Firebase" -ForegroundColor Red
        Write-Host "Run: firebase login" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "✗ Could not verify Firebase login" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Ready to deploy Firebase configuration!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ask user if they want to deploy
$deploy = Read-Host "Deploy Firebase configuration now? (y/n)"

if ($deploy -eq "y" -or $deploy -eq "Y") {
    Write-Host ""
    Write-Host "Deploying Firestore indexes..." -ForegroundColor Yellow
    firebase deploy --only firestore:indexes
    
    Write-Host ""
    Write-Host "Deploying Firestore rules..." -ForegroundColor Yellow
    firebase deploy --only firestore:rules
    
    Write-Host ""
    Write-Host "Deploying Storage rules..." -ForegroundColor Yellow
    firebase deploy --only storage
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Deployment complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Wait 2-5 minutes for indexes to build" -ForegroundColor White
    Write-Host "2. Update your code files (see COMPLETE_SETUP_GUIDE.md)" -ForegroundColor White
    Write-Host "3. Clear browser cache (Ctrl+Shift+Delete)" -ForegroundColor White
    Write-Host "4. Restart dev server: npm run dev" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Deployment skipped. Run these commands manually:" -ForegroundColor Yellow
    Write-Host "  firebase deploy --only firestore:indexes" -ForegroundColor White
    Write-Host "  firebase deploy --only firestore:rules" -ForegroundColor White
    Write-Host "  firebase deploy --only storage" -ForegroundColor White
    Write-Host ""
}

Write-Host "For detailed instructions, see: COMPLETE_SETUP_GUIDE.md" -ForegroundColor Cyan
Write-Host ""