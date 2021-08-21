import { execSync } from "child_process";
import NodeCodeGenerator from "../services/NodeCodeGenerator";
import OpenApiStager from "../services/OpenApiStager";
// import CustomSpecParser from "../services/CustomSpecParser";
import FilePrinter from "../utils/FilePrinter";
import Prompter from "../services/Prompter";
import CustomSpecStager from "../services/CustomSpecStager";
import CustomSpecAdjuster from "../services/CustomSpecAdjuster";
import { openApiInputDir, swagger } from "../config";
import path from "path";

(async () => {
  const prompter = new Prompter();
  const sourceType = await prompter.askForSourceType();
  let stagedParams;
  if (sourceType === "Custom API mapping in YAML") {
    const customFile = await prompter.askForCustomYamlFile();
    // const parsedParams = new CustomSpecParser(customFile).run();
    const adjustedParams = new CustomSpecAdjuster(customFile).run();
    stagedParams = new CustomSpecStager(adjustedParams).run();
  } else {
    let openApiFile = await prompter.askForOpenApiFile();

    if (openApiFile.endsWith(".yaml")) {
      const source = path.join(openApiInputDir, openApiFile);
      const openApiFileName = openApiFile.replace(/.yaml/, "");
      const target = path.join(openApiInputDir, `${openApiFileName}.json`);

      execSync(`node ${swagger} bundle -o ${target} ${source}`);

      openApiFile = `${openApiFileName}.json`;
    }

    stagedParams = new OpenApiStager(openApiFile).run();
  }

  new FilePrinter(stagedParams).print({ format: "json" });
  new NodeCodeGenerator(stagedParams.mainParams).run();
})();
