import Generator from "../services/TypeScriptGenerator";
import OpenApiParser from "../services/OpenApiParser";
import YamlParser from "../services/YamlParser";
import FilePrinter from "../utils/FilePrinter";
import Prompter from "../services/Prompter";
import YamlTraverser from "../services/YamlTraverser";
import YamlStager from "../services/YamlStager";

// (async () => {
//   const prompter = new Prompter();
//   const sourceType = await prompter.askForSourceType();

//   let nodegenParams: NodegenParams;
//   if (sourceType === "YAML") {
//     const yamlFile = await prompter.askForYamlFile();
//     nodegenParams = new YamlParser(yamlFile).run();
//   } else {
//     const openApiFile = await prompter.askForOpenApiFile();
//     nodegenParams = new OpenApiParser(openApiFile).run();
//   }

//   new FilePrinter(nodegenParams).print({ format: "json" });
//   new Generator(nodegenParams.mainParams).run();
// })();

// for quick testing

(async () => {
  const preTraversalParams = new YamlParser("elasticsearch.yaml").run();
  const traversedParams = new YamlTraverser(preTraversalParams).run();
  const stagedParams = new YamlStager(traversedParams).run();

  new FilePrinter(stagedParams).print({ format: "json" });
  new Generator(stagedParams.mainParams).run();
})();
