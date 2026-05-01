/**
 * Validate registry, then merge MCP artifacts into sami-web-content.
 * Forwards all CLI args to publish-mcp-to-web-content.cjs (e.g. --target).
 */
const path = require("path");
const { spawnSync } = require("child_process");

const galleryRoot = path.resolve(__dirname, "..");
const node = process.execPath;
const validateScript = path.join(galleryRoot, "scripts", "validate-registry.mjs");
const publishScript = path.join(galleryRoot, "scripts", "publish-mcp-to-web-content.cjs");

const validate = spawnSync(node, [validateScript], { stdio: "inherit", cwd: galleryRoot, env: process.env });
if (validate.status !== 0) process.exit(validate.status ?? 1);

const publish = spawnSync(node, [publishScript, ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: galleryRoot,
  env: process.env,
});
process.exit(publish.status ?? 0);
