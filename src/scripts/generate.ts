import Generator from "../services/TypeScriptGenerator";
import OpenApiParser from "../services/OpenApiParser";
import YamlParser from "../services/YamlParser";
import FilePrinter from "../utils/FilePrinter";
import Prompter from "../services/Prompter";
import YamlStager from "../services/YamlStager";
import YamlTraverser from "../services/YamlTraverser";

(async () => {
  const prompter = new Prompter();
  const sourceType = await prompter.askForSourceType();

  let stagedParams;
  if (sourceType === "YAML") {
    const yamlFile = await prompter.askForYamlFile();
    const preTraversalParams = new YamlParser(yamlFile).run();
    const traversedParams = new YamlTraverser(preTraversalParams).run();
    stagedParams = new YamlStager(traversedParams).run();
  } else {
    const openApiFile = await prompter.askForOpenApiFile();
    stagedParams = new OpenApiParser(openApiFile).run();
  }

  new FilePrinter(stagedParams).print({ format: "json" });
  new Generator(stagedParams.mainParams).run();
})();
