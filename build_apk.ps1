$env:JAVA_HOME = "C:\Program Files\Android\jdk\jdk-8.0.302.8-hotspot\jdk8u302-b08"
$env:PATH = "$env:JAVA_HOME\bin;C:\Program Files\nodejs;C:\Windows\System32"
Set-Location "C:\Users\Administrator\ccTEST\AI_Nutrition_Coach_App\mobile_app\android"
$ProgressPreference = 'SilentlyContinue'

Write-Host "Building with Gradle 7.5.1..."
& .\gradlew.bat assembleRelease -x lint
