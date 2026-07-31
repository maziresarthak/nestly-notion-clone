#!/usr/bin/env bash
# Milestone 6 Manual API Tests — Trash, Dates, Search
# Run with: bash server/tests/milestone6-manual.sh
# Requires: server running on localhost:3001

set -e
BASE="http://localhost:3001/api"

echo "=== Milestone 6 API Tests ==="
echo ""

# ─── Register + setup ────────────────────────────────────────
EMAIL="m6-test-$(date +%s)@nestly.dev"
REG=$(curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"testpass123\",\"name\":\"M6 Tester\"}")

TOKEN=$(echo "$REG" | jq -r '.data.accessToken')
AUTH="Authorization: Bearer $TOKEN"

WS=$(curl -s -X GET "$BASE/workspaces" -H "$AUTH")
WS_ID=$(echo "$WS" | jq -r '.data[0].id')

echo "Registered: $EMAIL"
echo "Workspace:  $WS_ID"
echo ""

# ─── Test 1: Create parent + 2 children ──────────────────────
echo "Test 1: Create parent + 2 children"
PARENT=$(curl -s -X POST "$BASE/workspaces/$WS_ID/pages" -H "$AUTH" -H "Content-Type: application/json" -d '{"title":"Parent Page"}')
PARENT_ID=$(echo "$PARENT" | jq -r '.data.id')
echo "  Parent: $PARENT_ID"

CHILD1=$(curl -s -X POST "$BASE/workspaces/$WS_ID/pages" -H "$AUTH" -H "Content-Type: application/json" -d "{\"parentId\":\"$PARENT_ID\"}")
CHILD1_ID=$(echo "$CHILD1" | jq -r '.data.id')
echo "  Child1: $CHILD1_ID"

CHILD2=$(curl -s -X POST "$BASE/workspaces/$WS_ID/pages" -H "$AUTH" -H "Content-Type: application/json" -d "{\"parentId\":\"$PARENT_ID\"}")
CHILD2_ID=$(echo "$CHILD2" | jq -r '.data.id')
echo "  Child2: $CHILD2_ID"
echo ""

# ─── Test 2: Soft-delete parent ──────────────────────────────
echo "Test 2: Soft-delete parent"
DEL=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/workspaces/$WS_ID/pages/$PARENT_ID" -H "$AUTH")
echo "  Status: $DEL (expect 200)"
echo ""

# ─── Test 3: Trash list — parent should appear ───────────────
echo "Test 3: Trash list"
TRASH=$(curl -s -X GET "$BASE/workspaces/$WS_ID/pages/trash" -H "$AUTH")
TRASH_COUNT=$(echo "$TRASH" | jq '.data | length')
echo "  Trash count: $TRASH_COUNT (expect >= 1)"
FOUND=$(echo "$TRASH" | jq -r ".data[] | select(.id==\"$PARENT_ID\") | .id")
echo "  Parent in trash: $([ \"$FOUND\" = \"$PARENT_ID\" ] && echo 'YES' || echo 'NO')"
echo ""

# ─── Test 4: Restore parent ──────────────────────────────────
echo "Test 4: Restore parent"
RESTORE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/workspaces/$WS_ID/pages/$PARENT_ID/restore" -H "$AUTH")
echo "  Status: $RESTORE (expect 200)"
PAGES=$(curl -s -X GET "$BASE/workspaces/$WS_ID/pages" -H "$AUTH")
PARENT_BACK=$(echo "$PAGES" | jq -r ".data[] | select(.id==\"$PARENT_ID\") | .id")
echo "  Parent back in sidebar: $([ \"$PARENT_BACK\" = \"$PARENT_ID\" ] && echo 'YES' || echo 'NO')"
echo ""

# ─── Test 5: Soft-delete parent again + permanent delete ─────
echo "Test 5: Permanent delete (parent + descendants)"
curl -s -o /dev/null -X DELETE "$BASE/workspaces/$WS_ID/pages/$PARENT_ID" -H "$AUTH"
PERM=$(curl -s -X DELETE "$BASE/workspaces/$WS_ID/pages/$PARENT_ID/permanent" -H "$AUTH")
PERM_COUNT=$(echo "$PERM" | jq -r '.data.deletedCount')
echo "  Deleted count: $PERM_COUNT (expect 3 — parent + 2 children)"
# Verify children are gone
PAGES2=$(curl -s -X GET "$BASE/workspaces/$WS_ID/pages" -H "$AUTH")
C1_GONE=$(echo "$PAGES2" | jq -r ".data[] | select(.id==\"$CHILD1_ID\") | .id")
C2_GONE=$(echo "$PAGES2" | jq -r ".data[] | select(.id==\"$CHILD2_ID\") | .id")
echo "  Child1 gone: $([ -z \"$C1_GONE\" ] && echo 'YES' || echo 'NO')"
echo "  Child2 gone: $([ -z \"$C2_GONE\" ] && echo 'YES' || echo 'NO')"
echo ""

# ─── Test 6: Date validation ─────────────────────────────────
echo "Test 6: Date validation"
DATE_PAGE=$(curl -s -X POST "$BASE/workspaces/$WS_ID/pages" -H "$AUTH" -H "Content-Type: application/json" -d '{}')
DATE_PAGE_ID=$(echo "$DATE_PAGE" | jq -r '.data.id')

# Set valid dates
VALID=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/workspaces/$WS_ID/pages/$DATE_PAGE_ID" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"startDate":"2025-07-24T00:00:00Z","endDate":"2025-07-31T00:00:00Z"}')
echo "  Valid range: $VALID (expect 200)"

# Set invalid dates (end before start)
INVALID=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/workspaces/$WS_ID/pages/$DATE_PAGE_ID" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"startDate":"2025-07-31T00:00:00Z","endDate":"2025-07-24T00:00:00Z"}')
echo "  Invalid range: $INVALID (expect 422)"

# Set start date only
START_ONLY=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/workspaces/$WS_ID/pages/$DATE_PAGE_ID" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"startDate":"2025-07-24T00:00:00Z","endDate":null}')
echo "  Start only: $START_ONLY (expect 200)"

# Clear both
CLEAR=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/workspaces/$WS_ID/pages/$DATE_PAGE_ID" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"startDate":null,"endDate":null}')
echo "  Clear dates: $CLEAR (expect 200)"
echo ""

# ─── Test 7: Search ──────────────────────────────────────────
echo "Test 7: Search"
# Create pages with known titles
curl -s -o /dev/null -X POST "$BASE/workspaces/$WS_ID/pages" -H "$AUTH" -H "Content-Type: application/json" -d '{"title":"Alpha Blueprint"}'
curl -s -o /dev/null -X POST "$BASE/workspaces/$WS_ID/pages" -H "$AUTH" -H "Content-Type: application/json" -d '{"title":"Beta Blueprint"}'
curl -s -o /dev/null -X POST "$BASE/workspaces/$WS_ID/pages" -H "$AUTH" -H "Content-Type: application/json" -d '{"title":"Gamma Notes"}'

# Case-insensitive partial match
SEARCH=$(curl -s -X GET "$BASE/workspaces/$WS_ID/pages/search?q=blueprint" -H "$AUTH")
SEARCH_COUNT=$(echo "$SEARCH" | jq '.data | length')
echo "  'blueprint' results: $SEARCH_COUNT (expect 2)"

# Check breadcrumb exists
HAS_BC=$(echo "$SEARCH" | jq '.data[0].breadcrumb | length')
echo "  Has breadcrumb: $([ \"$HAS_BC\" -gt 0 ] && echo 'YES' || echo 'NO')"

# No results
EMPTY=$(curl -s -X GET "$BASE/workspaces/$WS_ID/pages/search?q=zzzznotfound" -H "$AUTH")
EMPTY_COUNT=$(echo "$EMPTY" | jq '.data | length')
echo "  No-match results: $EMPTY_COUNT (expect 0)"

# Empty query validation
EMPTY_Q=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE/workspaces/$WS_ID/pages/search?q=" -H "$AUTH")
echo "  Empty query: $EMPTY_Q (expect 422)"
echo ""

echo "=== All tests complete ==="
