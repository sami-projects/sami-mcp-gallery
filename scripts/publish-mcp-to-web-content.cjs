/**
 * Merge MCP gallery artifacts into an existing sami-web-content `dist/` tree.
 *
 * Help (markdown, help-index.json, structure.json) is NOT touched — it must already
 * exist (published from the Sami app repo). This script only refreshes:
 *   - dist/data/mcp-registry.json
 *   - dist/icons/*.svg (rebuilt from referenced icon keys)
 *   - manifest.json sections mcpRegistry / mcpIcons (+ top-level generatedAt)
 *
 * Usage:
 *   node scripts/publish-mcp-to-web-content.cjs --target "D:\path\to\sami-web-content"
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const galleryRoot = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const args = { target: "" };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--target") {
      args.target = argv[i + 1] || "";
      i += 1;
    }
  }
  return args;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function sha256File(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(content).digest("hex");
}

const GALLERY_META = "io.sami/gallery";

function collectIconKeysFromMcpRegistry(mcpRegistry) {
  const keys = new Set();
  const list = Array.isArray(mcpRegistry?.servers) ? mcpRegistry.servers : [];
  for (const s of list) {
    const icon = s?._meta?.[GALLERY_META]?.icon;
    if (typeof icon === "string" && icon.trim()) keys.add(icon.trim());
  }
  return [...keys].sort((a, b) => a.localeCompare(b));
}

function cleanIconsDir(distIconsDir) {
  if (!fs.existsSync(distIconsDir)) return;
  for (const name of fs.readdirSync(distIconsDir)) {
    const full = path.join(distIconsDir, name);
    if (fs.statSync(full).isFile() && name.toLowerCase().endsWith(".svg")) {
      fs.unlinkSync(full);
    }
  }
}

function copyMcpGalleryIcons(distIconsDir, mcpRegistry) {
  const keys = collectIconKeysFromMcpRegistry(mcpRegistry);
  ensureDir(distIconsDir);
  cleanIconsDir(distIconsDir);
  let copied = 0;
  for (const key of keys) {
    const src = path.join(galleryRoot, "assets", "icons", `${key}.svg`);
    if (!fs.existsSync(src)) {
      console.warn(`publish-mcp-to-web-content: missing icon for key "${key}" (${src})`);
      continue;
    }
    fs.copyFileSync(src, path.join(distIconsDir, `${key}.svg`));
    copied += 1;
  }
  return { copied, keys };
}

function hashIconsDirectory(distIconsDir) {
  if (!fs.existsSync(distIconsDir)) return null;
  const names = fs
    .readdirSync(distIconsDir)
    .filter((n) => n.toLowerCase().endsWith(".svg"))
    .sort((a, b) => a.localeCompare(b));
  if (names.length === 0) return null;
  const h = crypto.createHash("sha256");
  for (const name of names) {
    h.update(name);
    h.update("\0");
    h.update(fs.readFileSync(path.join(distIconsDir, name)));
  }
  return h.digest("hex");
}

function loadMcpRegistryFromGallery() {
  const indexPath = path.join(galleryRoot, "registry", "index.json");
  if (!fs.existsSync(indexPath)) {
    throw new Error(`mcp gallery index not found: ${indexPath}`);
  }

  const indexJson = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  const entries = Array.isArray(indexJson?.servers) ? indexJson.servers : [];
  if (entries.length === 0) {
    throw new Error(`mcp gallery index is empty: ${indexPath}`);
  }

  const servers = entries.map((entry) => {
    if (!entry || typeof entry.path !== "string" || !entry.path.trim()) {
      throw new Error(`invalid gallery index entry: ${JSON.stringify(entry)}`);
    }

    const serverJsonPath = path.join(galleryRoot, entry.path);
    if (!fs.existsSync(serverJsonPath)) {
      throw new Error(`mcp server record not found: ${serverJsonPath}`);
    }

    return JSON.parse(fs.readFileSync(serverJsonPath, "utf8"));
  });

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: "sami-mcp-gallery",
    totalServers: servers.length,
    servers,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.target) {
    console.error('publish-mcp-to-web-content: missing required arg --target "<path-to-sami-web-content>"');
    process.exit(1);
  }

  const targetRoot = path.resolve(args.target);
  const distRoot = path.join(targetRoot, "dist");
  const manifestPath = path.join(distRoot, "manifest.json");
  const distDataDir = path.join(distRoot, "data");
  const distIconsDir = path.join(distRoot, "icons");

  if (!fs.existsSync(manifestPath)) {
    console.error(
      `publish-mcp-to-web-content: ${manifestPath} not found.\n` +
        "Run a full help publish from the Sami repo first, or clone sami-web-content that already contains dist/.",
    );
    process.exit(1);
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (e) {
    console.error(`publish-mcp-to-web-content: invalid manifest.json: ${e.message}`);
    process.exit(1);
  }

  if (!manifest.sections || typeof manifest.sections.help !== "object") {
    console.error(
      "publish-mcp-to-web-content: manifest has no sections.help — refusing to overwrite.\n" +
        "Use the full Sami publish-web-content flow once to create help + manifest, then use this script for MCP-only updates.",
    );
    process.exit(1);
  }

  const mcpRegistry = loadMcpRegistryFromGallery();
  const mcpTargetPath = path.join(distDataDir, "mcp-registry.json");
  writeJson(mcpTargetPath, mcpRegistry);

  const { copied } = copyMcpGalleryIcons(distIconsDir, mcpRegistry);
  const iconsHash = hashIconsDirectory(distIconsDir);

  const nextManifest = {
    ...manifest,
    generatedAt: new Date().toISOString(),
    sections: {
      ...manifest.sections,
      mcpRegistry: {
        file: "data/mcp-registry.json",
        hash: sha256File(mcpTargetPath),
        totalServers: mcpRegistry.totalServers,
        source: "sami-mcp-gallery",
      },
    },
  };

  if (iconsHash) {
    nextManifest.sections.mcpIcons = {
      root: "icons/",
      hash: iconsHash,
      fileCount: copied,
    };
  } else {
    delete nextManifest.sections.mcpIcons;
  }

  writeJson(manifestPath, nextManifest);

  const rel = (path.relative(targetRoot, distRoot) || "dist").replace(/\\/g, "/");
  const dest = `${path.basename(targetRoot)}/${rel}`;
  console.log(`publish-mcp: ${mcpRegistry.totalServers} servers, ${copied} icons -> ${dest}`);
}

main();
