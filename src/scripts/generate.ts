import { execSync } from "child_process";
import Generator from "../services/TypeScriptGenerator";
import OpenApiParser from "../services/OpenApiParser";
import YamlParser from "../services/YamlParser";
import FilePrinter from "../utils/FilePrinter";
import Prompter from "../services/Prompter";
import YamlStager from "../services/YamlStager";
import YamlTraverser from "../services/YamlTraverser";
import { openApiInputDir, swagger } from "../config";
import path from "path";

(async () => {
  const prompter = new Prompter();
  const sourceType = await prompter.askForSourceType();
  let stagedParams;
  if (sourceType === "Custom API mapping in YAML") {
    const customFile = await prompter.askForCustomYamlFile();
    const preTraversalParams = new YamlParser(customFile).run();
    const traversedParams = new YamlTraverser(preTraversalParams).run();
    stagedParams = new YamlStager(traversedParams).run();
  } else {
    let openApiFile = await prompter.askForOpenApiFile();

    if (openApiFile.endsWith(".yaml")) {
      const source = path.join(openApiInputDir, openApiFile);
      const openApiFileName = openApiFile.replace(/.yaml/, "");
      const target = path.join(openApiInputDir, `${openApiFileName}.json`);

      execSync(`node ${swagger} bundle -o ${target} ${source}`);

      openApiFile = `${openApiFileName}.json`;
    }

    stagedParams = new OpenApiParser(openApiFile).run();
  }

  new FilePrinter(stagedParams).print({ format: "json" });
  new Generator(stagedParams.mainParams).run();
})();
