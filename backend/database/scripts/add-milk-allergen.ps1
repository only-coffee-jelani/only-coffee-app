# PowerShell script to add milk allergen to drinks that contain milk
$API_BASE = "http://localhost:3000/api/v1"
$MILK_ALLERGEN_ID = "5be67603-8533-431f-a17c-651dbf0aed80"

Write-Host "`nAdding milk allergen to drinks...`n" -ForegroundColor Cyan

# Step 1: Authenticate
Write-Host "Step 1: Authenticating..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@onlycoffee.com"
    password = "Admin123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$API_BASE/admin/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "   Authenticated successfully`n" -ForegroundColor Green
} catch {
    Write-Host "   Authentication failed: $_" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Step 2: Get all menu items
Write-Host "Step 2: Fetching menu items..." -ForegroundColor Yellow
$allItems = Invoke-RestMethod -Uri "$API_BASE/menu-items" -Method Get
Write-Host "   Found $($allItems.Count) total items`n" -ForegroundColor Green

# Step 3: Find items that need milk allergen
$itemsToUpdate = @(
    "Vienna Melange / Cappuccino",
    "Cappuccino",
    "Flat White",
    "Latte"
)

Write-Host "Step 3: Adding milk allergen to drinks..." -ForegroundColor Yellow

foreach ($itemName in $itemsToUpdate) {
    $item = $allItems | Where-Object { $_.name -eq $itemName }
    
    if (-not $item) {
        Write-Host "   Item '$itemName' not found, skipping..." -ForegroundColor Yellow
        continue
    }
    
    # Check if milk allergen already exists
    if ($item.allergenIds -contains $MILK_ALLERGEN_ID) {
        Write-Host "   '$itemName' already has milk allergen, skipping..." -ForegroundColor Gray
        continue
    }
    
    # Add milk allergen to existing allergens
    $updatedAllergenIds = @($item.allergenIds) + @($MILK_ALLERGEN_ID)
    
    # Prepare update body
    $updateBody = @{
        allergenIds = $updatedAllergenIds
    } | ConvertTo-Json
    
    try {
        $result = Invoke-RestMethod -Uri "$API_BASE/menu-items/$($item.id)" -Method Put -Headers $headers -Body $updateBody
        Write-Host "   Added milk allergen to '$itemName'" -ForegroundColor Green
    } catch {
        Write-Host "   Failed to update '$itemName': $_" -ForegroundColor Red
    }
}

# Step 4: Verify changes
Write-Host "`nStep 4: Verifying changes..." -ForegroundColor Yellow
$updatedItems = Invoke-RestMethod -Uri "$API_BASE/menu-items" -Method Get

Write-Host "`nDrinks with milk allergen:" -ForegroundColor Cyan
$updatedItems | Where-Object { $_.allergenIds -contains $MILK_ALLERGEN_ID -and $_.categoryName -eq "Vienna Classics" } | 
    Select-Object name, basePrice | 
    Sort-Object name | 
    Format-Table -AutoSize

Write-Host "All changes completed!`n" -ForegroundColor Green

