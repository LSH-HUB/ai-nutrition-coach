# Script to install JDK 17 for Android builds

# Check if Chocolatey is installed
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Chocolatey..."
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-WebRequest -Uri https://community.chocolatey.org/install.ps1 -UseBasicParsing | Invoke-Expression
}

# Install JDK 17
Write-Host "Installing OpenJDK 17..."
choco install openjdk17 -y

# Set JAVA_HOME
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.11.9-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "JDK 17 installed. Please restart your terminal and run the build again."
