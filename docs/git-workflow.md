# Inkloom AI — Git Collaboration & Workflow Guide

To ensure smooth pair programming and independent feature delivery across four developers, follow this Git workflow.

---

## 1. Branch Strategy

- `main`: The single source of truth for stable, deployable code. Direct pushes to `main` are disallowed.
- Assigned Feature Branches:
  - `backend`: Backend API, database models, permissions, workflow state machine.
  - `feature/frontend`: Next.js web application, design system, API integration.
  - `feature/ai-engine`: AI guideline analysis, tone/voice, claim verification.
  - `feature/media-qa`: Document extraction, OCR, visual analyzers, media QA fixtures.

---

## 2. Daily Developer Routine

### Step 1: Update your local `main`
```bash
git checkout main
git pull origin main
```

### Step 2: Switch to your assigned feature branch
```bash
git checkout <your-assigned-branch>
# Example: git checkout feature/ai-engine
```

### Step 3: Rebase on `main` to keep history clean
```bash
git fetch origin
git rebase origin/main
```

### Step 4: Work within your assigned directory
- Consult `docs/team-ownership.md` before creating new files.
- Never edit files owned by another teammate without prior agreement.
- Do not commit secrets, `.env` files, or binary uploads.

### Step 5: Test locally before pushing
```bash
# Backend / AI / Media QA:
cd backend
pytest -v

# Frontend:
cd frontend
npm run type-check
```

### Step 6: Commit and Push
```bash
git add <your-changed-files>
git commit -m "feat(ai-engine): add rule-based claim verification adapter"
git push origin <your-assigned-branch>
```

---

## 3. Pull Requests & Code Review

1. Open a Pull Request from `<your-assigned-branch>` against `main`.
2. Title PR with conventional commit format: `feat(...)`, `fix(...)`, `docs(...)`, `test(...)`.
3. Verify all GitHub Actions checks in `.github/workflows/tests.yml` pass.
4. Request review from at least one teammate (especially if touching shared files like `contracts/` or `audit_orchestrator.py`).
5. Use "Squash and Merge" or "Rebase and Merge" to maintain a linear git history.

---

## 4. Conflict Resolution Protocol

If Git warns of conflicts during rebase:
1. Identify the conflicting file.
2. If the conflict is in a **shared file** (e.g. `audit_orchestrator.py`, `requirements.txt`):
   - Confer with the author of the conflicting commit.
   - Do not discard their changes without verification.
3. If the conflict is in **your directory**:
   - Resolve by keeping the latest valid logic.
4. Stage resolved files:
   ```bash
   git add <resolved-file>
   git rebase --continue
   ```
5. Re-run tests to confirm resolution integrity before pushing.
