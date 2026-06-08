# Worker Route Ownership Repro

This private repro demonstrates the deployment split for Workers code and route bindings.

The Worker is `testing-repro-routes-20260608-a` in account `ca913382d1ac39b396106331875a1313`.

Routes are intentionally not declared in `wrangler.jsonc`. The intended model is:

- Terraform or the Routes API owns zone-level Worker routes.
- CI/CD owns Worker code deployment through Wrangler.
- `workers_dev` and `preview_urls` are explicitly disabled to avoid adding a public workers.dev target during CI deploys.

The test routes were created outside Wrangler with the zone-scoped Workers Routes API. This models a Terraform-owned route binding without requiring Terraform for the repro.

Do not add `routes` to `wrangler.jsonc` unless you are intentionally testing Wrangler-owned route state replacement.

See `REPRO.md` for the step-by-step reproduction log.

## CI/CD

GitHub Actions deploys on pushes to `main` and via manual `workflow_dispatch`.

Required repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The workflow runs:

```sh
npx wrangler@4.92.0 deploy
```
