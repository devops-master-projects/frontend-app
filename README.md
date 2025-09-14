# Before opening pr make sure all ci-cd jobs are successful
- Install act locally
```bash
act pull_request -j build-and-test
npx commitlint --from origin/develop --to HEAD --config frontend-app/commitlint.config.cjs
```