# Sami MCP Gallery

Curated public catalog of MCP servers used and verified by the Sami team.

This repository stores open metadata only and follows the official MCP `server.json` format with optional Sami UI extensions.

## Goals

- Keep server metadata portable and ecosystem-compatible
- Provide a clean and human-readable gallery for discovery
- Preserve richer card UX in Sami without breaking canonical compatibility

## Data model

Canonical records follow the official MCP schema:

- `https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json`

Sami-specific UI fields are stored in `_meta` namespaced keys:

- `_meta["io.sami/gallery"]`
- `_meta["io.sami/install"]`

## Repository structure

```text
registry/
  servers/
    <server-id-or-slug>.json
    <server-id-or-slug>/server.json   # optional when side files are needed
assets/
  icons/
docs/
  public/
```

Default layout is flat (`registry/servers/<id>.json`). Use a dedicated folder only when a server needs sidecar files (docs, localized assets, examples, etc.).

## Open-data policy

This repository must contain only public information.

Allowed:

- public descriptions and links
- package metadata and transport details
- environment variable names and descriptions (without values)
- public tool summaries for UI

Forbidden:

- secret values (tokens, API keys, passwords)
- private/internal URLs and endpoints
- internal runbooks, infrastructure details, operational instructions

## Validation rules

Each server record should pass:

1. Official schema validation
2. Basic quality checks (required fields, readable description)
3. Security checks (no secrets, no internal links)

Run local validation:

- `npm run validate:registry`

## Contribution flow

1. Add or update one server record in `registry/servers/<id>.json` (preferred) or `registry/servers/<id>/server.json` (if sidecar files are required)
2. Keep canonical fields valid and complete
3. Put UI-only fields under `_meta` Sami namespace
4. Run validation checks
5. Open a pull request with a concise change summary

Quick start for contributors:

- `docs/public/new-server-checklist.md`

## Publish MCP bundle into `sami-web-content` (no Sami repo)

Help markdown and `help-index.json` stay the **source of truth in the Sami app repo** and land in `sami-web-content/dist` via the full `publish-web-content` flow there. If you only change this gallery, refresh the MCP slice **without** rebuilding help:

1. Clone **`sami-mcp-gallery`** and **`sami-web-content`** (and **`sami-site`** if you work on the UI). You do **not** need the Sami application repo for registry-only edits.
2. Ensure `sami-web-content/dist/` already exists and contains a valid `manifest.json` with a `help` section (from a prior full publish or from `git pull` on `main`).
3. From this repository root — **`validate:registry` then publish** (one step):

   ```bash
   npm run publish:web-content-mcp:release -- --target "D:\path\to\sami-web-content"
   ```

   `--target` is the **repository root** of `sami-web-content` (the folder that contains `dist/`, not `dist` itself).

   **Windows:** [`deploy/publish-mcp-to-web-content.bat`](./deploy/publish-mcp-to-web-content.bat) runs the same pipeline, then `git add dist` / `git commit` when there are changes, and **Y/N** to `git push origin main`. No args → expects `sami-web-content` next to this repo; optional first argument is the full path to the `sami-web-content` root.

The script updates only:

- `dist/data/mcp-registry.json`
- `dist/icons/*.svg` (rebuilt from icon keys referenced in the registry)
- `manifest.json` — `sections.mcpRegistry`, `sections.mcpIcons`, and `generatedAt` (help section is left unchanged)

Then commit/push **`sami-web-content`** as your team prefers.

## Consumption via npm

After [publishing](#publishing-to-npm), install:

`npm install @sami-projects/mcp-gallery`

Published contents: `registry/`, `assets/icons/`, `LICENSE`, `README.md`, and `scripts/validate-registry.mjs` for local checks.

Paths inside the package mirror this repository layout (e.g. `registry/index.json`, `registry/servers/*.json`).

## Publishing to npm

Prerequisites: npm account / org **`sami-projects`**, repo public on GitHub.

1. Clone/pull this repo and run `npm run validate:registry`.
2. Bump **`version`** in `package.json` (semver).
3. `npm login` (once per machine).
4. From repo root: `npm publish`

`prepublishOnly` runs validation automatically before publish.

## License

MIT — see [LICENSE](./LICENSE).
