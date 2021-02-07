import OpenApiGenerator from "../OpenApiGenerator";
import nodegenParams from "../input/_nodegenParams.json";

try {
  const mainParams = nodegenParams.mainParams as MainParams;
  new OpenApiGenerator(mainParams).run();

  console.log("Successfully converted JS object into TypeScript node");
} catch (e) {
  // throw new Error("Failed to convert JS object into TypeScript node");
  console.log(e);
}
