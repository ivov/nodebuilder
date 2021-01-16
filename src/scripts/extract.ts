import json from "../input/lichess.json";
import OpenApiExtractor from "../OpenApiExtractor";
import FilePrinter from "../utils/FilePrinter";

try {
  const nodegenParams = new OpenApiExtractor(json).run();
  const printer = new FilePrinter(nodegenParams);

  printer.print({ format: "ts" });
  console.log("Successfully converted OpenAPI JSON into JS object");

  printer.print({ format: "json" });
  console.log("Successfully converted OpenAPI JSON into custom JSON");
} catch (error) {
  console.log(error);
}
