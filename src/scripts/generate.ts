import OpenApiGenerator from "../OpenApiGenerator";
// @ts-ignore TODO: Fix import when no file exists
import nodegenParams from "../input/nodegenParams";

try {
  new OpenApiGenerator({
    // @ts-ignore
    mainParams: nodegenParams.mainParams as MainParams,
    nodeGenerationType: "SingleFile",
  }).run();

  // const gen2 = new OpenApiGenerator(nodegenParams.mainParams, "MultiFile");
  // gen2.run();

  console.log("Successfully converted JS object into TypeScript node");
} catch (e) {
  // throw new Error("Failed to convert JS object into TypeScript node");
  console.log(e);
}
