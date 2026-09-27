$ErrorActionPreference = 'Stop'
$base = 'http://localhost:5000/api/v1'
$results = @()

function Step($name, [scriptblock]$fn) {
  try {
    $out = & $fn
    $script:results += "PASS  $name"
    return $out
  } catch {
    $script:results += "FAIL  $name :: $($_.Exception.Message)"
    return $null
  }
}

# 1. login
$cust = Step 'customer login' { Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body '{"email":"customer@logicore.com","password":"Password123!"}' }
if ($cust) { $custToken = $cust.data.token } else { $custToken = $null }
$adm = Step 'admin login' { Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body '{"email":"admin@logicore.com","password":"Password123!"}' }
if ($adm) { $admToken = $adm.data.token } else { $admToken = $null }
$hC = @{ Authorization = "Bearer $custToken" }
$hA = @{ Authorization = "Bearer $admToken" }

# 2. storefront
Step 'store home (GET /store/home)' { Invoke-RestMethod -Method Get -Uri "$base/store/home" -Headers $hC | Out-Null }
$prods = Step 'store products (GET /store/products)' { Invoke-RestMethod -Method Get -Uri "$base/store/products?page=1&limit=5" -Headers $hC }
$prodId = $null
if ($prods -and $prods.data.Count -gt 0) { $prodId = $prods.data[0].id; Write-Host "  (using product id=$prodId)" }
Step 'product detail (GET /store/products/:id)' { Invoke-RestMethod -Method Get -Uri "$base/store/products/$prodId" -Headers $hC | Out-Null }

# 3. cart
Step 'add to cart (POST /cart/items)' { Invoke-RestMethod -Method Post -Uri "$base/cart/items" -Headers $hC -ContentType 'application/json' -Body (@{ product_id = $prodId; quantity = 2 } | ConvertTo-Json) | Out-Null }
Step 'get cart' { Invoke-RestMethod -Method Get -Uri "$base/cart" -Headers $hC | Out-Null }

# 4. address
$addr = Step 'create address' { Invoke-RestMethod -Method Post -Uri "$base/addresses" -Headers $hC -ContentType 'application/json' -Body '{"full_name":"JD Customer","phone":"13800138000","address_line1":"Jingdong Road 1, Chaoyang District","city":"Beijing","state":"Beijing","zip":"100102","country":"China","is_default":true}' }
$addrId = $null
if ($addr) { $addrId = $addr.data.address.id; Write-Host "  (address id=$addrId)" }

# 5. checkout + pay
$order = Step 'checkout from cart' { Invoke-RestMethod -Method Post -Uri "$base/orders/checkout" -Headers $hC -ContentType 'application/json' -Body (@{ address_id = $addrId; payment_method = 'ONLINE' } | ConvertTo-Json) }
$oid = $null
if ($order) { $oid = $order.data.order.id; Write-Host "  (order id=$oid status=$($order.data.order.status))" }
Step 'pay order (PENDING -> CONFIRMED+PAID)' { Invoke-RestMethod -Method Post -Uri "$base/orders/$oid/pay" -Headers $hC -ContentType 'application/json' -Body '{}' | Out-Null }

# 6. cart emptied
$cart2 = Step 'cart emptied after checkout' { Invoke-RestMethod -Method Get -Uri "$base/cart" -Headers $hC }
if ($cart2 -and $cart2.data.items.Count -eq 0) { $script:results += "PASS  cart empty check" } else { $script:results += "FAIL  cart empty check" }

# 7. admin walks order: PROCESSING -> PACKED -> SHIPPED
Step 'order -> PROCESSING' { Invoke-RestMethod -Method Patch -Uri "$base/orders/$oid/status" -Headers $hA -ContentType 'application/json' -Body '{"status":"PROCESSING"}' | Out-Null }
Step 'order -> PACKED' { Invoke-RestMethod -Method Patch -Uri "$base/orders/$oid/status" -Headers $hA -ContentType 'application/json' -Body '{"status":"PACKED"}' | Out-Null }
Step 'order -> SHIPPED' { Invoke-RestMethod -Method Patch -Uri "$base/orders/$oid/status" -Headers $hA -ContentType 'application/json' -Body '{"status":"SHIPPED"}' | Out-Null }

# 8. shipment lifecycle (was 500 before the fixes)
$drivers = Step 'list drivers' { Invoke-RestMethod -Method Get -Uri "$base/drivers" -Headers $hA }
$driverId = $null
if ($drivers) {
  if ($drivers.data.drivers -and $drivers.data.drivers.Count -gt 0) { $driverId = $drivers.data.drivers[0].id }
  elseif ($drivers.data.Count -gt 0) { $driverId = $drivers.data[0].id }
  Write-Host "  (driver id=$driverId)"
}
$ship = Step 'create shipment' { Invoke-RestMethod -Method Post -Uri "$base/shipments" -Headers $hA -ContentType 'application/json' -Body (@{ order_id = $oid; driver_id = $driverId } | ConvertTo-Json) }
$sid = $null
if ($ship) { $sid = $ship.data.shipment.id; Write-Host "  (shipment id=$sid status=$($ship.data.shipment.status))" }
Step 'shipment -> PICKED_UP (rollback fix verified)' { Invoke-RestMethod -Method Patch -Uri "$base/shipments/$sid/status" -Headers $hA -ContentType 'application/json' -Body '{"status":"PICKED_UP"}' | Out-Null }

# 9. customer confirms receipt (SHIPPED -> DELIVERED) — JD 确认收货
Step 'confirm receipt (SHIPPED -> DELIVERED)' { Invoke-RestMethod -Method Post -Uri "$base/orders/$oid/confirm-receipt" -Headers $hC -ContentType 'application/json' -Body '{}' | Out-Null }

# 10. review + wishlist + rating summary
Step 'add review' { Invoke-RestMethod -Method Post -Uri "$base/reviews" -Headers $hC -ContentType 'application/json' -Body (@{ product_id = $prodId; order_id = $oid; rating = 5; title = "Great"; content = "JD-style quality" } | ConvertTo-Json) | Out-Null }
Step 'add to wishlist (POST /wishlist/:productId)' { Invoke-RestMethod -Method Post -Uri "$base/wishlist/$prodId" -Headers $hC -ContentType 'application/json' -Body '{}' | Out-Null }
$detail = Step 'product detail rating_summary' { Invoke-RestMethod -Method Get -Uri "$base/store/products/$prodId" -Headers $hC }
if ($detail -and $detail.data.product.rating_summary -and $detail.data.product.rating_summary.total -gt 0) { $script:results += "PASS  rating_summary active (total=$($detail.data.product.rating_summary.total), avg_rating=$($detail.data.product.avg_rating))" } else { $script:results += "FAIL  rating_summary active" }

# 11. my orders with product info
$mine = Step 'my orders list (with product info)' { Invoke-RestMethod -Method Get -Uri "$base/orders" -Headers $hC }
$hasImg = $false
if ($mine -and $mine.data.Count -gt 0 -and $mine.data[0].items -and $mine.data[0].items[0].PSObject.Properties['product']) { $hasImg = $true }
if ($hasImg) { $script:results += "PASS  order items carry product info (image_url/unit/price fields)" } else { $script:results += "FAIL  order items carry product info" }

Write-Host "==== JD SMOKE RESULTS ===="
$results | ForEach-Object { Write-Host $_ }
