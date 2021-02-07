import OpenApiExtractor from "../OpenApiExtractor";
import FilePrinter from "../utils/FilePrinter";

try {
  const nodegenParams = new OpenApiExtractor("bitwarden").run();
  new FilePrinter(nodegenParams).print({ format: "json" });

  console.log("Successfully converted OpenAPI JSON into custom JSON");
} catch (error) {
  console.log(error);
}
