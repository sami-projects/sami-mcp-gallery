# New Server Checklist

Use this quick checklist when adding a new MCP server to the public Sami gallery.

## 1) Pick a stable ID

- Use kebab-case: `builtin-foo`
- Keep ID stable (do not rename without migration note)

## 2) Create server record

- Add file: `registry/servers/<server-id>.json`
- Follow official schema: `https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json`
- Put Sami-specific fields only in:
  - `_meta["io.sami/gallery"]`
  - `_meta["io.sami/install"]`

## 3) Handle icon (optional but recommended)

- Store custom icons in: `assets/icons/<icon-key>.svg`
- Reference that key in `_meta["io.sami/gallery"].icon`

## 4) Register it in index

- Add exactly one item to `registry/index.json`:

```json
{
  "id": "builtin-foo",
  "path": "registry/servers/builtin-foo.json"
}
```

## 5) Validate before PR

- Run: `npm run validate:registry`
- Confirm no secrets/private URLs
- Open PR with short `what/why` summary

## Minimal template

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
      "transport": { "type": "stdio" },
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
