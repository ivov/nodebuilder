import json from "../input/lichess.json";
import OpenApiExtractor from "../OpenApiExtractor";
import FilePrinter from "../FilePrinter";

try {
  const extractor = new OpenApiExtractor(json);
  const nodegenParams = extractor.run();
  const printer = new FilePrinter(nodegenParams);
  printer.print({ format: "ts" });
  console.log("Successfully converted OpenAPI JSON into JS object");
  printer.print({ format: "json" });
  console.log("Successfully converted OpenAPI JSON into custom JSON");
} catch (e) {
  // throw new Error("Failed to convert OpenAPI JSON into JS object");
  console.log(e);
}
