# PowerShell script for setting up test users

# Colors for output
$GREEN = "`e[32m"
$RED = "`e[31m"
$BLUE = "`e[34m"
$NC = "`e[0m"

# API Base URL
$API_URL = "http://localhost:5000/api"

Write-Host "${BLUE}Setting up test users...${NC}`n"

# Function to make request
function Make-Request {
    param (
        [string]$method,
        [string]$endpoint,
        [string]$data = $null,
        [string]$token = $null
    )
    
    $headers = @{
        "Content-Type" = "application/json"
    }

    if ($token) {
        $headers["Authorization"] = "Bearer $token"
    }

    try {
        if ($data) {
            $response = Invoke-RestMethod -Uri "$API_URL$endpoint" -Method $method -Headers $headers -Body $data
        } else {
            $response = Invoke-RestMethod -Uri "$API_URL$endpoint" -Method $method -Headers $headers
        }
        return $response
    } catch {
        Write-Host "${RED}Request failed: $($_.Exception.Message)${NC}"
        if ($_.ErrorDetails) {
            Write-Host "${RED}Response: $($_.ErrorDetails.Message)${NC}"
        }
        return $null
    }
}

# Create super admin user first
Write-Host "Creating super admin user..."
$superAdminData = @{
    email = "superadmin@test.com"
    password = "superadmin123"
    name = "Super Admin"
    role = "admin"
} | ConvertTo-Json

$response = Make-Request -method "POST" -endpoint "/auth/register" -data $superAdminData
if (-not $response) {
    Write-Host "${RED}Failed to create super admin user${NC}"
    exit
}

Write-Host "${GREEN}✓ Super admin user created successfully${NC}"

# Login as super admin
Write-Host "`nLogging in as super admin..."
$loginData = @{
    email = "superadmin@test.com"
    password = "superadmin123"
} | ConvertTo-Json

$response = Make-Request -method "POST" -endpoint "/auth/login" -data $loginData
if (-not $response -or -not $response.token) {
    Write-Host "${RED}Failed to login as super admin${NC}"
    exit
}

$superAdminToken = $response.token
Write-Host "${GREEN}✓ Super admin login successful${NC}"

# Create test organization
Write-Host "`nCreating test organization..."
$orgData = @{
    name = "Test Organization"
    description = "Organization for testing purposes"
} | ConvertTo-Json

$response = Make-Request -method "POST" -endpoint "/organizations" -data $orgData -token $superAdminToken
if (-not $response) {
    Write-Host "${RED}Failed to create organization${NC}"
    exit
}

$orgId = $response._id
Write-Host "${GREEN}✓ Organization created successfully${NC}"

# Create test users
$users = @(
    @{
        email = "admin@test.com"
        password = "admin123"
        name = "Admin User"
        role = "admin"
    },
    @{
        email = "manager@test.com"
        password = "manager123"
        name = "Manager User"
        role = "manager"
    },
    @{
        email = "member@test.com"
        password = "member123"
        name = "Member User"
        role = "member"
    }
)

foreach ($user in $users) {
    Write-Host "`nCreating $($user.role) user..."
    $userData = @{
        email = $user.email
        password = $user.password
        name = $user.name
        role = $user.role
        organization = $orgId
    } | ConvertTo-Json

    $response = Make-Request -method "POST" -endpoint "/auth/register" -data $userData -token $superAdminToken
    if ($response) {
        Write-Host "${GREEN}✓ $($user.role) user created successfully${NC}"
    } else {
        Write-Host "${RED}✗ Failed to create $($user.role) user${NC}"
    }
}

Write-Host "`n${BLUE}Test users setup completed!${NC}"
Write-Host "You can now run the test script with: .\test-api.ps1" 