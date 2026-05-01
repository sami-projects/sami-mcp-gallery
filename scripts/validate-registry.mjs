import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const REGISTRY_DIR = path.join(ROOT, "registry", "servers");
const OFFICIAL_SCHEMA =
  "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json";

const SENSITIVE_PATTERNS = [
  /AKIA[0-9A-Z]{16}/g,
  /ghp_[A-Za-z0-9]{20,}/g,
  /xox[baprs]-[A-Za-z0-9-]{10,}/g,
  /-----BEGIN (?:RSA|EC|OPENSSH|PRIVATE) KEY-----/g,
];

function listServerFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const file = path.join(dir, entry.name, "server.json");
      if (fs.existsSync(file)) out.push(file);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".json")) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out.sort();
}

function fail(msg, failures) {
  failures.push(msg);
}

function validateServer(filePath) {
  const failures = [];
  const rel = path.relative(ROOT, filePath);
  let raw = "";
  let json;

  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    fail(`${rel}: cannot read file (${err.message})`, failures);
    return failures;
  }

  try {
    json = JSON.parse(raw);
  } catch (err) {
    fail(`${rel}: invalid JSON (${err.message})`, failures);
    return failures;
  }

  if (json.$schema !== OFFICIAL_SCHEMA) {
    fail(`${rel}: unexpected $schema`, failures);
  }

  for (const key of ["name", "description", "version"]) {
    if (typeof json[key] !== "string" || json[key].trim() === "") {
      fail(`${rel}: missing required string field '${key}'`, failures);
    }
  }

  if (!json._meta || typeof json._meta !== "object") {
    fail(`${rel}: missing _meta object`, failures);
  } else {
    if (!json._meta["io.sami/gallery"]) {
      fail(`${rel}: missing _meta['io.sami/gallery']`, failures);
    }
    if (!json._meta["io.sami/install"]) {
      fail(`${rel}: missing _meta['io.sami/install']`, failures);
    }
  }

  if (typeof json.websiteUrl === "string" && json.websiteUrl.includes(".local")) {
    fail(`${rel}: websiteUrl points to internal/local domain`, failures);
  }

  if (!Array.isArray(json.packages) && !Array.isArray(json.remotes)) {
    fail(`${rel}: must define at least one of packages/remotes`, failures);
  }

  for (const pattern of SENSITIVE_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(raw)) {
      fail(`${rel}: potential secret matched pattern ${pattern}`, failures);
    }
  }

  return failures;
}

function validateIndex(indexPath, serverFiles) {
  const failures = [];
  if (!fs.existsSync(indexPath)) {
    fail("registry/index.json: file missing", failures);
    return failures;
  }

  let index;
  try {
    index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  } catch (err) {
    fail(`registry/index.json: invalid JSON (${err.message})`, failures);
    return failures;
  }

  if (!Array.isArray(index.servers)) {
    fail("registry/index.json: missing 'servers' array", failures);
    return failures;
  }

  const declaredPaths = new Set(index.servers.map((s) => s?.path).filter(Boolean));
  const actualPaths = new Set(serverFiles.map((p) => path.relative(ROOT, p).replaceAll("\\", "/")));

  for (const p of actualPaths) {
    if (!declaredPaths.has(p)) {
      fail(`registry/index.json: missing entry for ${p}`, failures);
    }
  }

  for (const p of declaredPaths) {
    if (!actualPaths.has(p)) {
      fail(`registry/index.json: points to missing file ${p}`, failures);
    }
  }

  return failures;
}

const serverFiles = listServerFiles(REGISTRY_DIR);
if (serverFiles.length === 0) {
  console.error("No server files found in registry/servers.");
  process.exit(1);
}

const allFailures = [];
for (const file of serverFiles) {
  allFailures.push(...validateServer(file));
}
allFailures.push(...validateIndex(path.join(ROOT, "registry", "index.json"), serverFiles));

if (allFailures.length > 0) {
  console.error("Registry validation failed:");
  for (const f of allFailures) {
    console.error(`- ${f}`);
  }
  process.exit(1);
}

console.log(`Registry OK (${serverFiles.length} servers).`);
