const fs = require("fs");
const path = require("path");

const indexJsPath = path.join(
  "c:\\Dev\\nodejs\\AeroP2Pchat",
  "src",
  "renderer",
  "index.js",
);
const domJsPath = path.join(
  "c:\\Dev\\nodejs\\AeroP2Pchat",
  "src",
  "renderer",
  "dom.js",
);

let content = fs.readFileSync(indexJsPath, "utf8");

// We will find all lines that define a const with document.querySelector or Array.from(document.querySelectorAll)
const lines = content.split("\n");
const extractedVariables = [];
let outDomJs = "";

let startIdx = -1;
let endIdx = -1;

for (let i = 8; i < 250; i++) {
  const line = lines[i];
  if (
    line.startsWith("const ") &&
    (line.includes("document.querySelector") ||
      line.includes("document.getElementById") ||
      line.includes("Array.from(document.querySelectorAll"))
  ) {
    if (startIdx === -1) startIdx = i;
    endIdx = i;
  } else if (
    startIdx !== -1 &&
    (line.trim() === "" || line.startsWith("  ") || line.startsWith(");"))
  ) {
    // might be multi-line query selector
    endIdx = i;
  } else if (
    startIdx !== -1 &&
    !line.startsWith("const ") &&
    line.trim() !== ""
  ) {
    // end of DOM block
    break;
  }
}

// Ensure we capture all
const domCodeBlock = lines.slice(startIdx, endIdx + 1).join("\n");

// Replace `const ` with `export const ` in domCodeBlock
const exportedDomBlock = domCodeBlock.replace(/^const /gm, "export const ");

// Parse all variable names for the import statement
const varRegex = /^export const\s+([a-zA-Z0-9_]+)\s*=/gm;
let importVars = [];
let vMatch;
while ((vMatch = varRegex.exec(exportedDomBlock)) !== null) {
  importVars.push(vMatch[1]);
}

const importStatement = `import {\n  ${importVars.join(
  ",\n  ",
)}\n} from "./dom.js";`;

lines.splice(startIdx, endIdx - startIdx + 1, importStatement);

fs.writeFileSync(domJsPath, exportedDomBlock, "utf8");
fs.writeFileSync(indexJsPath, lines.join("\n"), "utf8");

console.log(`Extracted ${importVars.length} DOM variables to dom.js`);
