import OpenApiExtractor from "../OpenApiExtractor";
import FilePrinter from "../utils/FilePrinter";
import Generator from "../Generator";
import YamlStager from "../utils/YamlStager";
import YamlTranslator from "../utils/YamlTranslator";

const source = "YAML" as GenerationSource;

try {
  if (source === "OpenAPI") {
    const nodegenParams = new OpenApiExtractor("lichess").run();
    new FilePrinter(nodegenParams).print({ format: "json" });
    new Generator(nodegenParams.mainParams).run();
  } else if (source === "YAML") {
    const translation = new YamlTranslator().run();
    new YamlStager(translation.mainParams).run();

    // const nodegenParams = {
    //   metaParams: yamlParams.metaParams,
    //   mainParams: new YamlAdjuster(yamlParams.mainParams).run(),
    // };

    // new FilePrinter(nodegenParams).print({ format: "json" });
    // new Generator(nodegenParams.mainParams).run();
  }
  console.log("Successfully converted JS object into TypeScript node");
} catch (e) {
  console.log(e);
}
