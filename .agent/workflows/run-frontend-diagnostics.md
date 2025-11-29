---
description: How to run the frontend UI/UX diagnostics
---

1. Start the backend server:

   ```bash
   cd backend
   cargo run
   ```

   (Keep this running in a separate terminal)

2. Start the frontend server:

   ```bash
   cd frontend
   npm run dev
   ```

   (Keep this running in a separate terminal)

3. Run the diagnostic script:

   ```bash
   ./scripts/run-frontend-diagnostics.sh
   ```

4. View the report:
   The report will be generated at `docs/project-management/FRONTEND_UI_UX_PLAYWRIGHT_DIAGNOSTIC.md`.
