#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API Base URL
API_URL="http://localhost:5000/api"

# Test users credentials
ADMIN_EMAIL="admin@test.com"
ADMIN_PASSWORD="admin123"
MANAGER_EMAIL="manager@test.com"
MANAGER_PASSWORD="manager123"
MEMBER_EMAIL="member@test.com"
MEMBER_PASSWORD="member123"

echo -e "${BLUE}Starting API Tests...${NC}\n"

# Function to get auth token
get_token() {
    local email=$1
    local password=$2
    local response=$(curl -s -X POST "${API_URL}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"${email}\",\"password\":\"${password}\"}")
    echo $response | grep -o '"token":"[^"]*' | cut -d'"' -f4
}

# Function to make authenticated request
make_request() {
    local method=$1
    local endpoint=$2
    local token=$3
    local data=$4
    
    if [ -z "$data" ]; then
        curl -s -X $method "${API_URL}${endpoint}" \
            -H "Authorization: Bearer ${token}" \
            -H "Content-Type: application/json"
    else
        curl -s -X $method "${API_URL}${endpoint}" \
            -H "Authorization: Bearer ${token}" \
            -H "Content-Type: application/json" \
            -d "$data"
    fi
}

echo -e "${BLUE}1. Testing Role-Based Access Control (RBAC)${NC}"

# Get tokens for different roles
echo -e "\nGetting authentication tokens..."
ADMIN_TOKEN=$(get_token $ADMIN_EMAIL $ADMIN_PASSWORD)
MANAGER_TOKEN=$(get_token $MANAGER_EMAIL $MANAGER_PASSWORD)
MEMBER_TOKEN=$(get_token $MEMBER_EMAIL $MEMBER_PASSWORD)

echo -e "\n${BLUE}Testing Admin Access:${NC}"
# Test admin-only endpoint
echo "Testing admin-only endpoint..."
response=$(make_request "GET" "/organizations/settings" "$ADMIN_TOKEN")
if [[ $response == *"settings"* ]]; then
    echo -e "${GREEN}✓ Admin can access settings${NC}"
else
    echo -e "${RED}✗ Admin cannot access settings${NC}"
fi

echo -e "\n${BLUE}Testing Manager Access:${NC}"
# Test manager access
echo "Testing manager access to tasks..."
response=$(make_request "GET" "/tasks" "$MANAGER_TOKEN")
if [[ $response == *"tasks"* ]]; then
    echo -e "${GREEN}✓ Manager can access tasks${NC}"
else
    echo -e "${RED}✗ Manager cannot access tasks${NC}"
fi

echo -e "\n${BLUE}Testing Member Access:${NC}"
# Test member access
echo "Testing member access to tasks..."
response=$(make_request "GET" "/tasks" "$MEMBER_TOKEN")
if [[ $response == *"tasks"* ]]; then
    echo -e "${GREEN}✓ Member can access tasks${NC}"
else
    echo -e "${RED}✗ Member cannot access tasks${NC}"
fi

echo -e "\n${BLUE}2. Testing Task Expiry Functionality${NC}"

# Create a task that will expire soon
echo -e "\nCreating a task that will expire soon..."
TASK_DATA='{
    "title": "Test Expiry Task",
    "description": "This task should expire soon",
    "dueDate": "'$(date -d "+1 minute" -Iseconds)'",
    "category": "Development",
    "priority": "high"
}'

response=$(make_request "POST" "/tasks" "$ADMIN_TOKEN" "$TASK_DATA")
TASK_ID=$(echo $response | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$TASK_ID" ]; then
    echo -e "${GREEN}✓ Task created successfully${NC}"
    
    # Wait for 2 minutes to let the task expire
    echo -e "\nWaiting for task to expire (2 minutes)..."
    sleep 120
    
    # Check task status
    echo -e "\nChecking task status..."
    response=$(make_request "GET" "/tasks/${TASK_ID}" "$ADMIN_TOKEN")
    if [[ $response == *"expired"* ]]; then
        echo -e "${GREEN}✓ Task has been marked as expired${NC}"
    else
        echo -e "${RED}✗ Task has not been marked as expired${NC}"
    fi
else
    echo -e "${RED}✗ Failed to create task${NC}"
fi

# Test task reminder functionality
echo -e "\n${BLUE}Testing Task Reminder Functionality${NC}"

# Create a task due in 25 hours
echo -e "\nCreating a task due in 25 hours..."
TASK_DATA='{
    "title": "Test Reminder Task",
    "description": "This task should trigger a reminder",
    "dueDate": "'$(date -d "+25 hours" -Iseconds)'",
    "category": "Development",
    "priority": "high"
}'

response=$(make_request "POST" "/tasks" "$ADMIN_TOKEN" "$TASK_DATA")
TASK_ID=$(echo $response | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$TASK_ID" ]; then
    echo -e "${GREEN}✓ Task created successfully${NC}"
    echo -e "\nTask reminder should be triggered within the next hour"
else
    echo -e "${RED}✗ Failed to create task${NC}"
fi

echo -e "\n${BLUE}Tests completed!${NC}" 