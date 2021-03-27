import Generator from "../services/TypeScriptGenerator";
import OpenApiExtractor from "../services/OpenApiExtractor";
import YamlParser from "../services/YamlParser";
import YamlStager from "../services/YamlStager";
import FilePrinter from "../utils/FilePrinter";

const source = "YAML" as GenerationSource; // TEMP

try {
  source === "OpenAPI"
    ? generateFromOpenAPI("lichess")
    : generateFromYaml("copper");

  console.log("Successfully converted JS object into TypeScript node");
} catch (e) {
  console.log(e);
}

function generateFromOpenAPI(file: string) {
  const nodegenParams = new OpenApiExtractor(file).run();
  new FilePrinter(nodegenParams).print({ format: "json" });
  new Generator(nodegenParams.mainParams).run();
}

function generateFromYaml(file: string) {
  const translation = new YamlParser(file).run();
  const nodegenParams = new YamlStager(translation).run();
  new FilePrinter(nodegenParams).print({ format: "json" });
  new Generator(nodegenParams.mainParams).run();
}
