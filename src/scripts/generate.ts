import OpenApiGenerator from "../OpenApiGenerator";
// @ts-ignore TODO: Fix import when no file exists
import nodegenParams from "../input/_nodegenParams.json";

try {
  new OpenApiGenerator({
    mainParams: nodegenParams.mainParams as MainParams,
    nodeGenerationType: "SingleFile",
  }).run();

  console.log("Successfully converted JS object into TypeScript node");
} catch (e) {
  // throw new Error("Failed to convert JS object into TypeScript node");
  console.log(e);
}
