#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
# Milestone 2 — Manual Test Script
# Run: bash server/tests/milestone2-manual.sh
# Requires: curl, jq, a running server on localhost:3001
#            with a connected PostgreSQL database
# ─────────────────────────────────────────────────────────

set -euo pipefail

BASE="http://localhost:3001/api"
COOKIE_JAR="$(mktemp)"
PASS="0"
FAIL="0"
TOTAL="0"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass() { PASS=$((PASS + 1)); TOTAL=$((TOTAL + 1)); echo -e "  ${GREEN}✓ PASS${NC}: $1"; }
fail() { FAIL=$((FAIL + 1)); TOTAL=$((TOTAL + 1)); echo -e "  ${RED}✗ FAIL${NC}: $1"; }

# Unique email for this test run
EMAIL="test-$(date +%s)@nestly.dev"
NAME="Test User"
PASSWORD="securepass123"

echo ""
echo -e "${YELLOW}══════════════════════════════════════════════════${NC}"
echo -e "${YELLOW} Nestly — Milestone 2 API Tests${NC}"
echo -e "${YELLOW}══════════════════════════════════════════════════${NC}"
echo ""

# ─── Test 1: Register a new user ─────────────────────────
echo "Test 1: Register a new user"
REG_RESPONSE=$(curl -s -w "\n%{http_code}" -c "$COOKIE_JAR" \
  -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\", \"name\": \"$NAME\"}")

REG_STATUS=$(echo "$REG_RESPONSE" | tail -n1)
REG_BODY=$(echo "$REG_RESPONSE" | sed '$d')

if [ "$REG_STATUS" = "201" ]; then
  pass "Register returned 201"
else
  fail "Register returned $REG_STATUS (expected 201)"
fi

# Check accessToken in body
ACCESS_TOKEN=$(echo "$REG_BODY" | jq -r '.data.accessToken // empty' 2>/dev/null || true)
if [ -n "$ACCESS_TOKEN" ]; then
  pass "Response contains accessToken"
else
  fail "Response missing accessToken"
fi

# Check user in body
USER_ID=$(echo "$REG_BODY" | jq -r '.data.user.id // empty' 2>/dev/null || true)
USER_EMAIL=$(echo "$REG_BODY" | jq -r '.data.user.email // empty' 2>/dev/null || true)
if [ -n "$USER_ID" ] && [ "$USER_EMAIL" = "$EMAIL" ]; then
  pass "Response contains correct user object"
else
  fail "Response missing or incorrect user object"
fi

# Check refreshToken cookie was set
if grep -q "refreshToken" "$COOKIE_JAR" 2>/dev/null; then
  pass "refreshToken cookie was set"
else
  fail "refreshToken cookie was NOT set"
fi

echo ""

# ─── Test 2: Register same email again ───────────────────
echo "Test 2: Register same email again (expect error)"
DUP_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\", \"name\": \"$NAME\"}")

DUP_STATUS=$(echo "$DUP_RESPONSE" | tail -n1)
DUP_BODY=$(echo "$DUP_RESPONSE" | sed '$d')

if [ "$DUP_STATUS" = "409" ]; then
  pass "Duplicate email returned 409"
else
  fail "Duplicate email returned $DUP_STATUS (expected 409)"
fi

# Check it's not a crash (has error structure)
DUP_CODE=$(echo "$DUP_BODY" | jq -r '.error.code // empty' 2>/dev/null || true)
if [ "$DUP_CODE" = "EMAIL_TAKEN" ]; then
  pass "Error response has code EMAIL_TAKEN"
else
  fail "Error response missing proper code (got: $DUP_CODE)"
fi

echo ""

# ─── Test 3: Login with correct credentials ──────────────
echo "Test 3: Login with correct credentials"
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -c "$COOKIE_JAR" \
  -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

LOGIN_STATUS=$(echo "$LOGIN_RESPONSE" | tail -n1)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if [ "$LOGIN_STATUS" = "200" ]; then
  pass "Login returned 200"
else
  fail "Login returned $LOGIN_STATUS (expected 200)"
fi

ACCESS_TOKEN=$(echo "$LOGIN_BODY" | jq -r '.data.accessToken // empty' 2>/dev/null || true)
if [ -n "$ACCESS_TOKEN" ]; then
  pass "Login response contains accessToken"
else
  fail "Login response missing accessToken"
fi

echo ""

# ─── Test 3b: Login with wrong password ──────────────────
echo "Test 3b: Login with wrong password"
BAD_LOGIN=$(curl -s -w "\n%{http_code}" \
  -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"wrongpassword\"}")

BAD_LOGIN_STATUS=$(echo "$BAD_LOGIN" | tail -n1)

if [ "$BAD_LOGIN_STATUS" = "401" ]; then
  pass "Wrong password returned 401"
else
  fail "Wrong password returned $BAD_LOGIN_STATUS (expected 401)"
fi

echo ""

# ─── Test 4: GET /users/me without token → 401 ──────────
echo "Test 4: GET /users/me"
NO_AUTH=$(curl -s -w "\n%{http_code}" \
  -X GET "$BASE/users/me")

NO_AUTH_STATUS=$(echo "$NO_AUTH" | tail -n1)
if [ "$NO_AUTH_STATUS" = "401" ]; then
  pass "GET /users/me without token returned 401"
else
  fail "GET /users/me without token returned $NO_AUTH_STATUS (expected 401)"
fi

# With valid token
ME_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X GET "$BASE/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

ME_STATUS=$(echo "$ME_RESPONSE" | tail -n1)
ME_BODY=$(echo "$ME_RESPONSE" | sed '$d')

if [ "$ME_STATUS" = "200" ]; then
  pass "GET /users/me with token returned 200"
else
  fail "GET /users/me with token returned $ME_STATUS (expected 200)"
fi

# Verify NO passwordHash in response
HAS_HASH=$(echo "$ME_BODY" | jq '.data.passwordHash // empty' 2>/dev/null || true)
if [ -z "$HAS_HASH" ] || [ "$HAS_HASH" = "" ] || [ "$HAS_HASH" = "null" ]; then
  pass "Response has NO passwordHash field"
else
  fail "Response LEAKS passwordHash!"
fi

echo ""

# ─── Test 5: Token refresh ───────────────────────────────
echo "Test 5: Token refresh"
REFRESH_RESPONSE=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -X POST "$BASE/auth/refresh")

REFRESH_STATUS=$(echo "$REFRESH_RESPONSE" | tail -n1)
REFRESH_BODY=$(echo "$REFRESH_RESPONSE" | sed '$d')

if [ "$REFRESH_STATUS" = "200" ]; then
  pass "Refresh returned 200"
else
  fail "Refresh returned $REFRESH_STATUS (expected 200)"
fi

NEW_ACCESS=$(echo "$REFRESH_BODY" | jq -r '.data.accessToken // empty' 2>/dev/null || true)
if [ -n "$NEW_ACCESS" ]; then
  pass "Refresh response contains new accessToken"
else
  fail "Refresh response missing accessToken"
fi

# Try to use the OLD cookie (should fail since it was rotated)
# We need to save old cookie before refreshing. This test verifies
# rotation conceptually — the cookie jar has already been updated.
# Instead, verify the new token works:
ME_CHECK=$(curl -s -w "\n%{http_code}" \
  -X GET "$BASE/users/me" \
  -H "Authorization: Bearer $NEW_ACCESS")

ME_CHECK_STATUS=$(echo "$ME_CHECK" | tail -n1)
if [ "$ME_CHECK_STATUS" = "200" ]; then
  pass "New access token is valid (GET /users/me works)"
else
  fail "New access token is invalid"
fi

echo ""

# ─── Test 6: Logout ──────────────────────────────────────
echo "Test 6: Logout"
LOGOUT_RESPONSE=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -X POST "$BASE/auth/logout")

LOGOUT_STATUS=$(echo "$LOGOUT_RESPONSE" | tail -n1)

if [ "$LOGOUT_STATUS" = "204" ]; then
  pass "Logout returned 204"
else
  fail "Logout returned $LOGOUT_STATUS (expected 204)"
fi

# Verify refresh no longer works after logout
POST_LOGOUT_REFRESH=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" \
  -X POST "$BASE/auth/refresh")

POST_LOGOUT_STATUS=$(echo "$POST_LOGOUT_REFRESH" | tail -n1)
if [ "$POST_LOGOUT_STATUS" = "401" ]; then
  pass "Refresh after logout returns 401 (token revoked)"
else
  fail "Refresh after logout returned $POST_LOGOUT_STATUS (expected 401)"
fi

echo ""

# ─── Test 7: Rate limiting ──────────────────────────────
echo "Test 7: Rate limiting (11 rapid login attempts)"
# First, login once to get a valid session, then fire 10 more
for i in $(seq 1 11); do
  RL_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "$BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"fake@nestly.dev\", \"password\": \"fakepassword\"}")
  RL_STATUS=$(echo "$RL_RESPONSE" | tail -n1)

  if [ "$i" -eq 11 ]; then
    if [ "$RL_STATUS" = "429" ]; then
      pass "11th request returned 429 (rate limited)"
    else
      fail "11th request returned $RL_STATUS (expected 429)"
    fi
  fi
done

echo ""

# ─── Summary ─────────────────────────────────────────────
echo -e "${YELLOW}══════════════════════════════════════════════════${NC}"
echo -e "${YELLOW} Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}, $TOTAL total"
echo -e "${YELLOW}══════════════════════════════════════════════════${NC}"
echo ""

# Cleanup
rm -f "$COOKIE_JAR"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
