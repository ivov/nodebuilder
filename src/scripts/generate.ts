import OpenApiGenerator from "../OpenApiGenerator";

try {
  // const ex = new Extractor(json);
  // const nodegenParams = ex.run();
  const gen = new OpenApiGenerator("SingleFile");
  gen.run();
  console.log("Successfully converted JS object into TypeScript node");
} catch (e) {
  // throw new Error("Failed to convert JS object into TypeScript node");
  console.log(e);
}
