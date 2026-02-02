#!/bin/bash
# Apply pending migrations to production database

echo "🚀 Applying migrations to production..."
echo ""

# Get production database URL
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable not set"
  echo "Please set it with: export DATABASE_URL='your-production-db-url'"
  exit 1
fi

# Apply migrations in order
MIGRATIONS=(
  "supabase/migrations/20260201_usage_summary_function.sql"
  "supabase/migrations/20260201_pilot_billing_events.sql"
  "supabase/migrations/20260202_pilot_roles.sql"
  "supabase/migrations/20260202_assign_pilot_roles.sql"
  "supabase/migrations/20260202_list_pilot_users.sql"
  "supabase/migrations/20260202_update_signup_with_pilot_role.sql"
  "supabase/migrations/20260202_simple_profiles_with_pilot_role.sql"
  "supabase/migrations/20260202_admins_non_billable.sql"
  "supabase/migrations/20260202_admin_can_view_all_users.sql"
  "supabase/migrations/20260202_fix_rls_policies.sql"
)

for migration in "${MIGRATIONS[@]}"; do
  if [ -f "$migration" ]; then
    echo "📝 Applying: $(basename $migration)"
    psql "$DATABASE_URL" -f "$migration" -q
    if [ $? -eq 0 ]; then
      echo "   ✅ Success"
    else
      echo "   ❌ Failed"
      exit 1
    fi
  else
    echo "   ⚠️  File not found: $migration"
  fi
done

echo ""
echo "✨ All migrations applied successfully!"
echo ""
echo "Next steps:"
echo "1. Verify the usage page loads: https://hireinbox.co.za/pilot/usage"
echo "2. Check dashboard stats are showing correctly"
