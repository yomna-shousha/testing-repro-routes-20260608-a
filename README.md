# Worker Route Ownership Repro

This private repro demonstrates the deployment split for Workers code and route bindings.

The Worker is `testing-repro-routes-20260608-a` in account `ca913382d1ac39b396106331875a1313`.

Routes are intentionally not declared in `wrangler.jsonc`. The intended model is:

- Terraform or the Routes API owns zone-level Worker routes.
- CI/CD owns Worker code deployment through Wrangler.
- `workers_dev` and `preview_urls` are explicitly disabled to avoid adding a public workers.dev target during CI deploys.

The test routes were created outside Wrangler with the zone-scoped Workers Routes API. This models a Terraform-owned route binding without requiring Terraform for the repro.

Do not add `routes` to `wrangler.jsonc` unless you are intentionally testing Wrangler-owned route state replacement.

## Bootstrap Note

If Terraform or the Workers API creates a Worker parent before any code has been uploaded, that Worker is versionless. A versionless Worker has a name and identity, but no Worker version and no runnable deployment.

Routes require at least one Worker version to exist. Create the Worker parent first, deploy the first Worker version through CI/CD, and then create the route binding in Terraform or with the Routes API. After that bootstrap step, future Wrangler deploys can keep omitting `routes` and will preserve the externally managed route.

Recommended order:

```text
1. Terraform/API creates Worker parent.
2. CI/CD deploys the first Worker code version.
3. Terraform/API creates the route binding.
4. Future CI/CD deploys omit routes from Wrangler and preserve the externally managed route.
```

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
