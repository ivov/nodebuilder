import json from "../input/sample.json";
import OpenApiExtractor from "../OpenApiExtractor";
import FilePrinter from "../FilePrinter";

try {
  const extractor = new OpenApiExtractor(json);
  const nodegenParams = extractor.run();
  const printer = new FilePrinter(nodegenParams);

  printer.print({ format: "ts" });
  console.log("Successfully converted OpenAPI JSON into JS object");

  // printer.print({ format: "json" });
  // console.log("Successfully converted OpenAPI JSON into custom JSON");
} catch (error) {
  console.log(error);
}
