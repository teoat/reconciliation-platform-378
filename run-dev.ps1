# PowerShell script to run the development server
$env:PATH = "$env:HOME/.nvm/versions/node/v22.17.1/bin:$env:PATH"
Write-Host "Starting development server..."
npm run dev
