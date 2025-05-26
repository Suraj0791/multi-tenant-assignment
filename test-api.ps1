# PowerShell script for testing API endpoints

# Colors for output
$GREEN = "`e[32m"
$RED = "`e[31m"
$BLUE = "`e[34m"
$NC = "`e[0m"

# API Base URL
$API_URL = "http://localhost:5000/api"

# Generate unique timestamp for test run
$timestamp = Get-Date -Format "yyyyMMddHHmmss"

Write-Host "${BLUE}Starting API Tests...${NC}`n"

# Function to make request
function Make-Request {
    param (
        [string]$method,
        [string]$endpoint,
        [object]$data = $null,
        [string]$token = $null
    )
    
    $headers = @{
        "Content-Type" = "application/json"
    }

    if ($token) {
        $headers["Authorization"] = "Bearer $token"
    }

    try {
        $body = if ($data) { $data | ConvertTo-Json -Depth 10 } else { $null }
        if ($body) {
            $response = Invoke-RestMethod -Uri "$API_URL$endpoint" -Method $method -Headers $headers -Body $body
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

# 1. Test Multi-tenant Architecture
Write-Host "${BLUE}1. Testing Multi-tenant Architecture${NC}"

# Create first organization
Write-Host "`nCreating first organization..."
$org1Data = @{
    email = "admin1_$timestamp@test.com"
    password = "admin123"
    firstName = "Admin"
    lastName = "One"
    organizationName = "Test Organization 1_$timestamp"
}

$response = Make-Request -method "POST" -endpoint "/auth/register" -data $org1Data

if (-not $response -or -not $response.token) {
    Write-Host "${RED}Failed to create first organization${NC}"
    exit
}

$org1Token = $response.token
$org1Id = $response.user.organization.id
Write-Host "${GREEN}✓ First organization created successfully${NC}"

# Create second organization
Write-Host "`nCreating second organization..."
$org2Data = @{
    email = "admin2_$timestamp@test.com"
    password = "admin123"
    firstName = "Admin"
    lastName = "Two"
    organizationName = "Test Organization 2_$timestamp"
}

$response = Make-Request -method "POST" -endpoint "/auth/register" -data $org2Data

if (-not $response -or -not $response.token) {
    Write-Host "${RED}Failed to create second organization${NC}"
    exit
}

$org2Token = $response.token
$org2Id = $response.user.organization.id
Write-Host "${GREEN}✓ Second organization created successfully${NC}"

# Test data isolation
Write-Host "`nTesting data isolation..."
$taskData = @{
    title = "Test Task"
    description = "This is a test task"
    category = "Development"
    priority = "high"
    dueDate = (Get-Date).AddDays(1).ToString("o")
}

# Create task in first organization
$response = Make-Request -method "POST" -endpoint "/tasks" -data $taskData -token $org1Token
if (-not $response) {
    Write-Host "${RED}Failed to create task in first organization${NC}"
    exit
}
$org1TaskId = $response._id
Write-Host "${GREEN}✓ Created task in first organization${NC}"

# Try to access task from second organization
$response = Make-Request -method "GET" -endpoint "/tasks/$org1TaskId" -token $org2Token
if ($response) {
    Write-Host "${RED}✗ Data isolation failed - second organization can access first organization's task${NC}"
} else {
    Write-Host "${GREEN}✓ Data isolation working correctly${NC}"
}

# 2. Test Role-Based Access Control
Write-Host "`n${BLUE}2. Testing Role-Based Access Control${NC}"

# Create users with different roles in first organization
$users = @(
    @{
        email = "manager1_$timestamp@test.com"
        role = "manager"
    },
    @{
        email = "member1_$timestamp@test.com"
        role = "member"
    }
)

foreach ($user in $users) {
    Write-Host "`nCreating $($user.role) user..."
    $userData = @{
        email = $user.email
        role = $user.role
    }
    
    $response = Make-Request -method "POST" -endpoint "/organizations/invites" -data $userData -token $org1Token

    if ($response) {
        Write-Host "${GREEN}✓ $($user.role) user invited successfully${NC}"
        Write-Host "Invite link: $($response.inviteLink)"
        
        # Register user with invitation
        $registerData = @{
            email = $user.email
            password = "$($user.role)123"
            firstName = $user.role
            lastName = "One"
            inviteToken = $response.invitation.token
        }
        
        $response = Make-Request -method "POST" -endpoint "/auth/register" -data $registerData
        if ($response) {
            Write-Host "${GREEN}✓ $($user.role) user registered successfully${NC}"
        } else {
            Write-Host "${RED}✗ Failed to register $($user.role) user${NC}"
        }
    } else {
        Write-Host "${RED}✗ Failed to invite $($user.role) user${NC}"
    }
}

# Test role-based access
Write-Host "`nTesting role-based access..."

# Login as manager
$loginData = @{
    email = "manager1_$timestamp@test.com"
    password = "manager123"
}

$response = Make-Request -method "POST" -endpoint "/auth/login" -data $loginData

if (-not $response -or -not $response.token) {
    Write-Host "${RED}Failed to login as manager${NC}"
    exit
}
$managerToken = $response.token

# Login as member
$loginData = @{
    email = "member1_$timestamp@test.com"
    password = "member123"
}

$response = Make-Request -method "POST" -endpoint "/auth/login" -data $loginData

if (-not $response -or -not $response.token) {
    Write-Host "${RED}Failed to login as member${NC}"
    exit
}
$memberToken = $response.token

# Test manager permissions
Write-Host "`nTesting manager permissions..."
$response = Make-Request -method "POST" -endpoint "/tasks" -data $taskData -token $managerToken
if ($response) {
    Write-Host "${GREEN}✓ Manager can create tasks${NC}"
} else {
    Write-Host "${RED}✗ Manager cannot create tasks${NC}"
}

# Test member permissions
Write-Host "`nTesting member permissions..."
$response = Make-Request -method "POST" -endpoint "/tasks" -data $taskData -token $memberToken
if ($response) {
    Write-Host "${RED}✗ Member can create tasks (should not be allowed)${NC}"
} else {
    Write-Host "${GREEN}✓ Member cannot create tasks (correct)${NC}"
}

# 3. Test Task Expiry Functionality
Write-Host "`n${BLUE}3. Testing Task Expiry Functionality${NC}"

# Create a task that will expire soon
Write-Host "`nCreating task that will expire soon..."
$expiryTaskData = @{
    title = "Test Expiry Task"
    description = "This task should expire soon"
    category = "Development"
    priority = "high"
    dueDate = (Get-Date).AddMinutes(1).ToString("o")
}

$response = Make-Request -method "POST" -endpoint "/tasks" -data $expiryTaskData -token $org1Token
if (-not $response) {
    Write-Host "${RED}Failed to create expiry test task${NC}"
    exit
}

$expiryTaskId = $response._id
Write-Host "${GREEN}✓ Created task that will expire soon${NC}"

# Wait for 2 minutes to let the task expire
Write-Host "`nWaiting for task to expire (2 minutes)..."
Start-Sleep -Seconds 120

# Manually trigger task expiry check
Write-Host "`nTriggering task expiry check..."
$response = Make-Request -method "POST" -endpoint "/tasks/check-expiry" -token $org1Token
if ($response) {
    Write-Host "${GREEN}✓ Task expiry check triggered${NC}"
} else {
    Write-Host "${RED}✗ Failed to trigger task expiry check${NC}"
}

# Check task status
Write-Host "`nChecking task status..."
$response = Make-Request -method "GET" -endpoint "/tasks/$expiryTaskId" -token $org1Token
if ($response -and $response.status -eq "expired") {
    Write-Host "${GREEN}✓ Task has been marked as expired${NC}"
} else {
    Write-Host "${RED}✗ Task has not been marked as expired${NC}"
}

# Test task reminder functionality
Write-Host "`nTesting task reminder functionality..."
$reminderTaskData = @{
    title = "Test Reminder Task"
    description = "This task should trigger a reminder"
    category = "Development"
    priority = "high"
    dueDate = (Get-Date).AddHours(25).ToString("o")
}

$response = Make-Request -method "POST" -endpoint "/tasks" -data $reminderTaskData -token $org1Token
if ($response) {
    Write-Host "${GREEN}✓ Created task that will trigger a reminder${NC}"
    Write-Host "Task reminder should be triggered within the next hour"
} else {
    Write-Host "${RED}✗ Failed to create reminder test task${NC}"
}

Write-Host "`n${BLUE}All tests completed!${NC}" 