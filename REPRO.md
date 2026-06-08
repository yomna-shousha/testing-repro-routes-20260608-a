# Worker Route Ownership Repro

Date: 2026-06-08

Account: `ca913382d1ac39b396106331875a1313`
Zone: `build.yomnashousha.com`
Zone ID: `8f1389c88325439b8bd92164b867073a`
Worker: `testing-repro-routes-20260608-a`

## Goal

Verify whether Worker code can be deployed independently from route bindings, and whether Wrangler preserves route bindings that are managed outside Wrangler.

## Step 1: Create Worker Through Script API

Created a new Worker named `testing-repro-routes-20260608-a` through the script upload API.

Result:

```json
{
  "success": true,
  "id": "testing-repro-routes-20260608-a",
  "last_deployed_from": "api"
}
```

## Step 2: Create Route Outside Wrangler

Created a route through the zone-scoped Workers Routes API, simulating Terraform ownership.

Route A:

```text
testing-repro-routes-20260608-a.build.yomnashousha.com/* -> testing-repro-routes-20260608-a
```

Verified route list contained:

```json
{
  "id": "284e8dc504fb417d81d76019baced34a",
  "pattern": "testing-repro-routes-20260608-a.build.yomnashousha.com/*",
  "script": "testing-repro-routes-20260608-a"
}
```

## Step 3: Deploy With Wrangler And No Routes Config

Initial `wrangler.jsonc`:

```jsonc
{
  "name": "testing-repro-routes-20260608-a",
  "main": "src/index.ts",
  "compatibility_date": "2026-06-08",
  "workers_dev": false,
  "preview_urls": false
}
```

Command:

```sh
npx wrangler deploy
```

Wrangler output included:

```text
Uploaded testing-repro-routes-20260608-a
No deploy targets for testing-repro-routes-20260608-a
```

Verified route A still existed after deploy.

Conclusion: when Wrangler has no `routes` config, it deploys code and does not mutate externally managed routes.

## Step 4: Deploy With Wrangler Route Config

Updated `wrangler.jsonc` to include route B only:

```jsonc
{
  "name": "testing-repro-routes-20260608-a",
  "main": "src/index.ts",
  "compatibility_date": "2026-06-08",
  "workers_dev": false,
  "preview_urls": false,
  "routes": [
    "testing-repro-routes-20260608-b.build.yomnashousha.com/*"
  ]
}
```

Command:

```sh
npx wrangler deploy
```

Wrangler output included:

```text
Uploaded testing-repro-routes-20260608-a
Deployed testing-repro-routes-20260608-a triggers
  testing-repro-routes-20260608-b.build.yomnashousha.com/*
```

Verified matching route list after deploy:

```json
[
  {
    "id": "3a52e3ef1c9d4b5db555c059e99183f0",
    "pattern": "testing-repro-routes-20260608-b.build.yomnashousha.com/*",
    "script": "testing-repro-routes-20260608-a"
  }
]
```

Route A was no longer present.

## Conclusion

REST APIs support the desired split: routes are separate zone-scoped resources and code/version/deployment operations do not require route updates.

Wrangler is safe for code deployment if `routes` is omitted from config. If `routes` is present, Wrangler treats those routes as desired trigger state and replaces the Worker's previous route bindings with the locally configured routes.

This reproduces the multiple-source-of-truth problem: Terraform can own route A, but a later Wrangler deploy containing route B can remove route A.

## Extra Check: Minimal Wrangler Config

After the route replacement case, created another route outside Wrangler:

```text
testing-repro-routes-20260608-c.build.yomnashousha.com/* -> testing-repro-routes-20260608-a
```

Then changed `wrangler.jsonc` to omit all route/subdomain-related fields:

```jsonc
{
  "name": "testing-repro-routes-20260608-a",
  "main": "src/index.ts",
  "compatibility_date": "2026-06-08"
}
```

Command:

```sh
npx wrangler deploy
```

Wrangler output included warnings that `workers_dev` and `preview_urls` would be enabled by default, and then deployed the workers.dev target:

```text
Deployed testing-repro-routes-20260608-a triggers
  https://testing-repro-routes-20260608-a.yomnas.workers.dev
```

Verified zone routes after deploy:

```json
[
  {
    "pattern": "testing-repro-routes-20260608-b.build.yomnashousha.com/*",
    "script": "testing-repro-routes-20260608-a"
  },
  {
    "pattern": "testing-repro-routes-20260608-c.build.yomnashousha.com/*",
    "script": "testing-repro-routes-20260608-a"
  }
]
```

Conclusion: even with a minimal Wrangler config, omitting `routes` did not delete externally managed zone routes. The side effect was enabling `workers.dev` and preview URLs by default.

## Extra Check: `wrangler versions upload` and `wrangler versions deploy`

Changed Worker code marker to:

```text
wrangler-versions-upload-no-routes
```

Kept `wrangler.jsonc` without `routes`:

```jsonc
{
  "name": "testing-repro-routes-20260608-a",
  "main": "src/index.ts",
  "compatibility_date": "2026-06-08",
  "workers_dev": false,
  "preview_urls": false
}
```

Ran:

```sh
npx wrangler versions upload
```

Output included:

```text
Worker Version ID: babd3e81-3fc8-499e-9af6-e8ca1da8ada1

To deploy this version to production traffic use the command wrangler versions deploy
Changes to triggers (routes, custom domains, cron schedules, etc) must be applied with the command wrangler triggers deploy
```

Verified externally managed routes were unchanged after upload.

Then ran:

```sh
npx wrangler versions deploy babd3e81-3fc8-499e-9af6-e8ca1da8ada1 --yes
```

Output included:

```text
No non-versioned settings to sync. Skipping...
SUCCESS Deployed testing-repro-routes-20260608-a version babd3e81-3fc8-499e-9af6-e8ca1da8ada1 at 100%
```

Verified latest deployment is 100% version `babd3e81-3fc8-499e-9af6-e8ca1da8ada1`, and externally managed zone routes remained:

```json
[
  {
    "pattern": "testing-repro-routes-20260608-b.build.yomnashousha.com/*",
    "script": "testing-repro-routes-20260608-a"
  },
  {
    "pattern": "testing-repro-routes-20260608-c.build.yomnashousha.com/*",
    "script": "testing-repro-routes-20260608-a"
  }
]
```

Conclusion: `wrangler versions upload` and `wrangler versions deploy` preserve externally managed routes when `routes` is omitted from Wrangler config. Trigger changes are explicitly separate and require `wrangler triggers deploy`.
