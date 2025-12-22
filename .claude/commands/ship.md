# Ship Check

Before shipping, verify:

1. Run `npm run build` - check for errors
2. Check for TypeScript errors
3. Review any console warnings
4. Test critical flows:
   - B2B: Can create role, fetch emails, see candidates
   - B2C: Can upload CV, get AI feedback
5. Check mobile responsiveness
6. Verify no .env secrets are exposed
7. Check Supabase connection

Report: Ready to ship? Yes/No with reasons.
