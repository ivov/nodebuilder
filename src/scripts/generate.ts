import Generator from "../services/TypeScriptGenerator";
import OpenApiExtractor from "../services/OpenApiExtractor";
import YamlParser from "../services/YamlParser";
import YamlStager from "../services/YamlStager";
import FilePrinter from "../utils/FilePrinter";

const source = "YAML" as GenerationSource;

try {
  if (source === "OpenAPI") {
    const nodegenParams = new OpenApiExtractor("lichess").run();
    new FilePrinter(nodegenParams).print({ format: "json" });
    new Generator(nodegenParams.mainParams).run();
  } else if (source === "YAML") {
    const translation = new YamlParser().run();
    const nodegenParams = new YamlStager(translation).run();
    new FilePrinter(nodegenParams).print({ format: "json" });
    new Generator(nodegenParams.mainParams).run();
  }
  console.log("Successfully converted JS object into TypeScript node");
} catch (e) {
  console.log(e);
}
