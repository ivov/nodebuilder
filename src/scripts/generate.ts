import OpenApiGenerator from "../OpenApiGenerator";
import nodegenParams from "../output/nodegenParams";

try {
  const gen = new OpenApiGenerator(nodegenParams.mainParams, "MultipleFiles");
  gen.run();
  console.log("Successfully converted JS object into TypeScript node");
} catch (e) {
  // throw new Error("Failed to convert JS object into TypeScript node");
  console.log(e);
}
