# Security Policy

## Scope

This repository is a public MCP server metadata gallery.

Security scope includes:

- accidental publication of secrets
- publication of internal/private endpoints
- malicious or unsafe metadata that could mislead users
- integrity issues in server records and referenced resources

## Supported security model

The gallery is open-data only:

- no secret values must be stored in this repository
- only public metadata is allowed
- environment variable names are allowed, values are never allowed

## Reporting a vulnerability

If you discover a security issue, please report it privately to maintainers.

Your report should include:

- short summary of the issue
- affected file paths
- potential impact
- suggested mitigation (if known)

Do not open a public issue for vulnerabilities involving sensitive data leakage.

## What is considered a security issue here

- committed credentials/tokens/secrets of any kind
- links to private internal services or admin endpoints
- metadata that encourages unsafe command execution patterns
- tampering with source references intended to impersonate trusted servers

## Response process

1. Triage and acknowledge report
2. Assess impact and affected records
3. Remove or sanitize unsafe data
4. Publish a fix and, if needed, advisory notes
5. Review contribution process to prevent recurrence

## Hard safety rules for contributors

- Never commit `.env` files or any secrets
- Never include private infra details
- Keep installation examples generic and non-sensitive
- Use `_meta` only for UI metadata, not for hidden operational data

## Non-goals

This repository does not host or execute MCP servers.
It catalogs metadata only.

Security assessment of third-party MCP server code is out of direct scope, but maintainers may remove entries that are clearly unsafe or misleading.
