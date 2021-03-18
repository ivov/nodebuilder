import { readFileSync } from "fs";
import yaml from "js-yaml";
import { join } from "path";

import OpenApiExtractor from "../OpenApiExtractor";
import FilePrinter from "../utils/FilePrinter";
import Generator from "../Generator";
import YamlAdjuster from "../utils/YamlAdjuster";

const source = "YAML" as GenerationSource;

try {
  if (source === "OpenAPI") {
    const nodegenParams = new OpenApiExtractor("lichess").run();
    new FilePrinter(nodegenParams).print({ format: "json" });
    new Generator(nodegenParams.mainParams).run();
  } else if (source === "YAML") {
    const yamlFilePath = join("src", "input", "copper.yaml");
    const yamlParams = yaml.load(readFileSync(yamlFilePath, "utf-8")) as {
      mainParams: YamlMainParams;
      metaParams: MetaParams;
    };

    const nodegenParams = {
      metaParams: yamlParams.metaParams,
      mainParams: new YamlAdjuster(yamlParams.mainParams).run(),
    };

    // new FilePrinter(nodegenParams).print({ format: "json" });
    // new Generator(nodegenParams.mainParams).run();
  }
  console.log("Successfully converted JS object into TypeScript node");
} catch (e) {
  console.log(e);
}
