# PowerShell script to update menu items via API
# 1. Change "Kleiner Schwarzer / Espresso" to "Small Black / Espresso"
# 2. Delete: Kleiner Brauner, Cortado, Macchiato, Wiener Melange
# 3. Add: Vienna Melange / Cappuccino

$API_BASE = "http://localhost:3000/api/v1"

Write-Host "`nStarting menu item updates...`n" -ForegroundColor Cyan

# Step 1: Get admin token (you'll need to provide credentials)
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
    Write-Host "   Authentication failed. Please check credentials." -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Get all menu items
Write-Host "Fetching current menu items..." -ForegroundColor Yellow
$allItems = Invoke-RestMethod -Uri "$API_BASE/menu-items" -Method Get

# Step 2: Update "Kleiner Schwarzer / Espresso" to "Small Black / Espresso"
Write-Host "`nStep 2: Updating 'Kleiner Schwarzer / Espresso' to 'Small Black / Espresso'..." -ForegroundColor Yellow
$espressoItem = $allItems | Where-Object { $_.name -eq "Kleiner Schwarzer / Espresso" }

if ($espressoItem) {
    $updateBody = @{
        name = "Small Black / Espresso"
    } | ConvertTo-Json

    try {
        Invoke-RestMethod -Uri "$API_BASE/menu-items/$($espressoItem.id)" -Method Put -Headers $headers -Body $updateBody
        Write-Host "   Updated successfully`n" -ForegroundColor Green
    } catch {
        Write-Host "   Failed to update: $_" -ForegroundColor Red
    }
} else {
    Write-Host "   Item not found, skipping...`n" -ForegroundColor Yellow
}

# Step 3: Delete items
Write-Host "Step 3: Deleting items..." -ForegroundColor Yellow
$itemsToDelete = @("Kleiner Brauner", "Cortado", "Macchiato", "Wiener Melange")

foreach ($itemName in $itemsToDelete) {
    $item = $allItems | Where-Object { $_.name -eq $itemName }

    if ($item) {
        try {
            Invoke-RestMethod -Uri "$API_BASE/menu-items/$($item.id)" -Method Delete -Headers $headers
            Write-Host "   Deleted '$itemName'" -ForegroundColor Green
        } catch {
            Write-Host "   Failed to delete '$itemName': $_" -ForegroundColor Red
        }
    } else {
        Write-Host "   '$itemName' not found, skipping..." -ForegroundColor Yellow
    }
}

# Step 4: Add "Vienna Melange / Cappuccino"
Write-Host "`nStep 4: Adding 'Vienna Melange / Cappuccino'..." -ForegroundColor Yellow

# Check if it already exists
$existingItem = $allItems | Where-Object { $_.name -eq "Vienna Melange / Cappuccino" }

if ($existingItem) {
    Write-Host "   'Vienna Melange / Cappuccino' already exists, skipping...`n" -ForegroundColor Yellow
} else {
    # Get category ID for Vienna Classics
    $categories = Invoke-RestMethod -Uri "$API_BASE/menu-categories" -Method Get
    $viennaCategory = $categories | Where-Object { $_.name -eq "Vienna Classics" }

    if (-not $viennaCategory) {
        Write-Host "   Vienna Classics category not found" -ForegroundColor Red
    } else {
        # Get all stores
        $stores = Invoke-RestMethod -Uri "$API_BASE/stores" -Method Get
        $storeIds = $stores | ForEach-Object { $_.storeId }
        
        $newItemBody = @{
            categoryId = $viennaCategory.categoryId
            name = "Vienna Melange / Cappuccino"
            description = "Traditional Viennese coffee with steamed milk and milk foam, cappuccino style"
            basePrice = 4.50
            calories = 120
            storeIds = $storeIds
            isActive = $true
        } | ConvertTo-Json

        try {
            $newItem = Invoke-RestMethod -Uri "$API_BASE/menu-items" -Method Post -Headers $headers -Body $newItemBody
            Write-Host "   Created 'Vienna Melange / Cappuccino' (ID: $($newItem.id))" -ForegroundColor Green
            Write-Host "   Associated with $($storeIds.Count) store(s)`n" -ForegroundColor Green
        } catch {
            Write-Host "   Failed to create item: $_" -ForegroundColor Red
        }
    }
}

# Summary
Write-Host "`nSummary of changes:" -ForegroundColor Cyan
Write-Host "   Renamed: 'Kleiner Schwarzer / Espresso' -> 'Small Black / Espresso'" -ForegroundColor Green
Write-Host "   Deleted: Kleiner Brauner, Cortado, Macchiato, Wiener Melange" -ForegroundColor Green
Write-Host "   Added: Vienna Melange / Cappuccino (`$4.50)" -ForegroundColor Green
Write-Host "`nAll changes completed!`n" -ForegroundColor Green

