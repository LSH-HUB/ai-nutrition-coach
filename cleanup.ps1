$ErrorActionPreference = 'SilentlyContinue'
Start-Sleep -Seconds 5

# Kill any Java processes that might be locking the folder
Get-Process -Name 'java' -ErrorAction SilentlyContinue | Stop-Process -Force

# Try to remove the directory
try {
    Remove-Item -Path 'C:\Users\Administrator\ccTEST\AI_Nutrition_Coach_App\mobile_app\android' -Recurse -Force
    Write-Host "Removed android folder"
} catch {
    Write-Host "Could not remove: $_"
}

# List contents
Get-ChildItem -Path 'C:\Users\Administrator\ccTEST\AI_Nutrition_Coach_App\mobile_app\' | Select-Object Name
