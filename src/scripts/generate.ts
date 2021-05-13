import Generator from "../services/TypeScriptGenerator";
import OpenApiParser from "../services/OpenApiParser";
import YamlParser from "../services/YamlParser";
import FilePrinter from "../utils/FilePrinter";
import Prompter from "../services/Prompter";

(async () => {
  const prompter = new Prompter();
  const sourceType = await prompter.askForSourceType();

  let nodegenParams: NodegenParams;
  if (sourceType === "YAML") {
    const yamlFile = await prompter.askForYamlFile();
    nodegenParams = new YamlParser(yamlFile).run();
  } else {
    const openApiFile = await prompter.askForOpenApiFile();
    nodegenParams = new OpenApiParser(openApiFile).run();
  }

  new FilePrinter(nodegenParams).print({ format: "json" });
  new Generator(nodegenParams.mainParams).run();
})();

// for quick testing

// (async () => {
//   const prompter = new Prompter();
//   const sourceType = "YAML";

//   let nodegenParams: NodegenParams;
//   if (sourceType === "YAML") {
//     nodegenParams = new YamlParser("zoho.yaml").run();
//   } else {
//     const openApiFile = await prompter.askForOpenApiFile();
//     nodegenParams = new OpenApiParser(openApiFile).run();
//   }

//   new FilePrinter(nodegenParams).print({ format: "json" });
//   new Generator(nodegenParams.mainParams).run();
// })();