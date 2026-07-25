#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
# Milestone 3 — Manual Test Script
# Run: bash server/tests/milestone3-manual.sh
# Requires: curl, jq, a running server on localhost:3001
# ─────────────────────────────────────────────────────────

set -euo pipefail

BASE="http://localhost:3001/api"
PASS="0"
FAIL="0"
TOTAL="0"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { PASS=$((PASS + 1)); TOTAL=$((TOTAL + 1)); echo -e "  ${GREEN}✓ PASS${NC}: $1"; }
fail() { FAIL=$((FAIL + 1)); TOTAL=$((TOTAL + 1)); echo -e "  ${RED}✗ FAIL${NC}: $1"; }

EMAIL="m3-test-$(date +%s)@nestly.dev"
PASSWORD="testpass123"
NAME="M3 Tester"

echo ""
echo -e "${YELLOW}══════════════════════════════════════════════════${NC}"
echo -e "${YELLOW} Nestly — Milestone 3 API Tests${NC}"
echo -e "${YELLOW}══════════════════════════════════════════════════${NC}"
echo ""

# ─── Setup: Register + get token + workspace ─────────
echo "Setup: Register user and get workspace"
REG_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\", \"name\": \"$NAME\"}")

REG_STATUS=$(echo "$REG_RESPONSE" | tail -n1)
REG_BODY=$(echo "$REG_RESPONSE" | sed '$d')
TOKEN=$(echo "$REG_BODY" | jq -r '.data.accessToken')
echo "  Registered: $EMAIL"

WS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE/workspaces")
WS_ID=$(echo "$WS_RESPONSE" | jq -r '.data[0].id')
WS_NAME=$(echo "$WS_RESPONSE" | jq -r '.data[0].name')
echo "  Workspace: $WS_ID ($WS_NAME)"
echo ""

# ─── Test 1: Create a page ───────────────────────────
echo "Test 1: Create a page"
CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$BASE/workspaces/$WS_ID/pages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{}")

CREATE_STATUS=$(echo "$CREATE_RESPONSE" | tail -n1)
CREATE_BODY=$(echo "$CREATE_RESPONSE" | sed '$d')

if [ "$CREATE_STATUS" = "201" ]; then pass "Create returned 201"; else fail "Create returned $CREATE_STATUS"; fi

PAGE_ID=$(echo "$CREATE_BODY" | jq -r '.data.id')
PAGE_TITLE=$(echo "$CREATE_BODY" | jq -r '.data.title')

if [ "$PAGE_TITLE" = "Untitled" ]; then pass "Default title is 'Untitled'"; else fail "Title is '$PAGE_TITLE'"; fi

PAGE_ICON=$(echo "$CREATE_BODY" | jq -r '.data.icon')
if [ "$PAGE_ICON" = "null" ]; then pass "Default icon is null"; else fail "Icon is '$PAGE_ICON'"; fi
echo ""

# ─── Test 2: List pages ─────────────────────────────
echo "Test 2: List pages"
LIST_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE/workspaces/$WS_ID/pages")
LIST_COUNT=$(echo "$LIST_RESPONSE" | jq '.data | length')

if [ "$LIST_COUNT" = "1" ]; then pass "List contains 1 page"; else fail "List contains $LIST_COUNT pages"; fi

HAS_CHILDREN=$(echo "$LIST_RESPONSE" | jq -r '.data[0].hasChildren')
if [ "$HAS_CHILDREN" = "false" ]; then pass "hasChildren is false"; else fail "hasChildren is $HAS_CHILDREN"; fi
echo ""

# ─── Test 3: Get single page ────────────────────────
echo "Test 3: Get single page by ID"
GET_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE/workspaces/$WS_ID/pages/$PAGE_ID")

BREADCRUMB_LEN=$(echo "$GET_RESPONSE" | jq '.data.breadcrumb | length')
if [ "$BREADCRUMB_LEN" = "1" ]; then pass "Breadcrumb has 1 item (itself)"; else fail "Breadcrumb has $BREADCRUMB_LEN items"; fi

HAS_CONTENT=$(echo "$GET_RESPONSE" | jq 'has("data") and (.data | has("content"))')
if [ "$HAS_CONTENT" = "true" ]; then pass "Response has content field"; else fail "Missing content"; fi
echo ""

# ─── Test 4: Update title ───────────────────────────
echo "Test 4: Update page title"
UPD_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X PATCH "$BASE/workspaces/$WS_ID/pages/$PAGE_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"title\": \"My Updated Title\"}")

UPD_STATUS=$(echo "$UPD_RESPONSE" | tail -n1)
UPD_BODY=$(echo "$UPD_RESPONSE" | sed '$d')
UPD_TITLE=$(echo "$UPD_BODY" | jq -r '.data.title')

if [ "$UPD_STATUS" = "200" ]; then pass "Update returned 200"; else fail "Update returned $UPD_STATUS"; fi
if [ "$UPD_TITLE" = "My Updated Title" ]; then pass "Title updated correctly"; else fail "Title is '$UPD_TITLE'"; fi
echo ""

# ─── Test 5: Soft-delete ────────────────────────────
echo "Test 5: Soft-delete page"
DEL_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X DELETE "$BASE/workspaces/$WS_ID/pages/$PAGE_ID" \
  -H "Authorization: Bearer $TOKEN")

DEL_STATUS=$(echo "$DEL_RESPONSE" | tail -n1)
if [ "$DEL_STATUS" = "200" ]; then pass "Delete returned 200"; else fail "Delete returned $DEL_STATUS"; fi

# Verify gone from list
LIST_AFTER=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE/workspaces/$WS_ID/pages")
LIST_AFTER_COUNT=$(echo "$LIST_AFTER" | jq '.data | length')
if [ "$LIST_AFTER_COUNT" = "0" ]; then pass "Page no longer in list"; else fail "List still has $LIST_AFTER_COUNT pages"; fi
echo ""

# ─── Test 6: Cross-user access ──────────────────────
echo "Test 6: Cross-user access (authorization)"
EMAIL2="m3-other-$(date +%s)@nestly.dev"
REG2=$(curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL2\", \"password\": \"$PASSWORD\", \"name\": \"Other User\"}")
TOKEN2=$(echo "$REG2" | jq -r '.data.accessToken')

CROSS_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $TOKEN2" \
  "$BASE/workspaces/$WS_ID/pages")
CROSS_STATUS=$(echo "$CROSS_RESPONSE" | tail -n1)

if [ "$CROSS_STATUS" = "404" ]; then
  pass "Cross-user workspace access returns 404"
else
  fail "Cross-user access returned $CROSS_STATUS (expected 404)"
fi
echo ""

# ─── Summary ─────────────────────────────────────────
echo -e "${YELLOW}══════════════════════════════════════════════════${NC}"
echo -e "${YELLOW} Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}, $TOTAL total"
echo -e "${YELLOW}══════════════════════════════════════════════════${NC}"
echo ""

if [ "$FAIL" -gt 0 ]; then exit 1; fi
