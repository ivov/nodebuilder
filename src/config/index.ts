import path from "path";

export const inputDir = path.join("src", "input");
export const yamlInputDir = path.join(inputDir, "yaml");
export const openApiInputDir = path.join(inputDir, "openApi");

export const outputDir = path.join("src", "output");
export const descriptionsOutputDir = path.join(outputDir, "descriptions");

export const hygen = path.join("node_modules", "hygen", "dist", "bin.js");
export const swagger = path.join(
  "node_modules",
  "@apidevtools",
  "swagger-cli",
  "bin",
  "swagger-cli.js"
);
