# Contributing to Sami MCP Gallery

Thanks for helping improve the public MCP server catalog.

Please keep changes small, reviewable, and consistent with the Data Contract v1.

## What can be contributed

- New MCP server records
- Metadata improvements (description, links, package info)
- Public tool summaries used for gallery UI
- Icon and documentation improvements

Need a short walkthrough first?

- `docs/public/new-server-checklist.md`

## Required rules

1. Canonical record must follow official MCP `server.json` format
2. Sami-specific fields must be namespaced in `_meta`
3. No secret values or internal-only information
4. Keep descriptions concise and factual
5. Prefer one server per pull request unless changes are tightly related

## Registry layout policy

1. `registry/index.json` is the source of truth for server discovery
2. Default record path is `registry/servers/<server-id>.json`
3. Use `registry/servers/<server-id>/server.json` only when sidecar files are needed
4. Keep `server-id` stable and kebab-case; do not rename without a migration note
5. Every server file must have exactly one matching `id` + `path` entry in `registry/index.json`
6. Do not duplicate the same server in both flat and folder layouts
7. Keep optional sidecar files public-only and server-scoped

## Security and data safety

Never commit:

- API keys, OAuth secrets, tokens, passwords
- private domains, staging/internal endpoints
- internal infrastructure notes or runbooks

If you are unsure whether data is safe to publish, do not commit it.

## Recommended PR checklist

- [ ] Canonical fields are valid (`name`, `description`, `version`, etc.)
- [ ] `_meta` extension uses Sami namespace keys
- [ ] Environment variables include names/descriptions only, no values
- [ ] Repository and docs links are public and reachable
- [ ] No internal/private information is present

## Add a new server in 5 steps

1. Choose stable `server-id` in kebab-case (example: `builtin-foo`)
2. Create `registry/servers/<server-id>.json` with official MCP schema + Sami `_meta` fields
3. If the server has custom icon, place it in `assets/icons/<icon-key>.svg` and reference `icon-key` in `_meta["io.sami/gallery"].icon`
4. Add one entry to `registry/index.json`:

```json
{
  "id": "builtin-foo",
  "path": "registry/servers/builtin-foo.json"
}
```

5. Run `npm run validate:registry` and open PR with short "what/why" summary

Minimal server file skeleton:

```json
{
  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
  "name": "io.github.example/foo-mcp-server",
  "title": "Foo",
  "description": "Short public description of capabilities.",
  "version": "0.1.0",
  "repository": {
    "url": "https://github.com/example/foo-mcp-server",
    "source": "github"
  },
  "websiteUrl": "https://example.com/docs",
  "packages": [
    {
      "registryType": "npm",
      "registryBaseUrl": "https://registry.npmjs.org",
      "identifier": "@example/foo-mcp-server",
      "transport": {
        "type": "stdio"
      },
      "runtimeHint": "npx"
    }
  ],
  "_meta": {
    "io.sami/gallery": {
      "legacyId": "builtin-foo",
      "icon": "foo",
      "iconBg": "#334155",
      "category": "Development",
      "maintained": "community",
      "toolsSummary": []
    },
    "io.sami/install": {
      "configSnippet": "{\n  \"mcpServers\": {\n    \"builtin-foo\": {\n      \"command\": \"npx\",\n      \"args\": [\"-y\", \"@example/foo-mcp-server\"]\n    }\n  }\n}"
    }
  }
}
```

## Pull request format

In the PR description, include:

- What was added/changed
- Why this change is useful for users
- Any assumptions or open questions

## Review policy

Maintainers may request:

- shorter or clearer description text
- normalization of package/transport fields
- cleanup of unsafe or non-public metadata
