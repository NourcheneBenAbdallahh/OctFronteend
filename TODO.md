# Bon Livraison Document Upload Fix - TODO ✅

## Completed:
- [x] Step 1: Added import createBonLivraisonWithFile
- [x] Step 2: Restructured handleSubmit (if editing → update else → createWithFile(payload, file!))
- [x] Step 3: Fixed update payload (removed unnecessary cast, added setCommandeDropdownOpen(false))

## Completed:
- [x] Step 4: Fixed createBonLivraisonWithFile endpoint fallback to localhost:8000/graphql (likely missing env var)

## Remaining:
- [ ] Step 5: Test again (restart dev server `npm run dev` if running, then test new bon with file)

Next: Test & report Network tab (FormData POST?).

Next: Manual testing required (user action).
