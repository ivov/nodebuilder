import { readFileSync } from "fs";
import yaml from "js-yaml";
import { join } from "path";

import OpenApiExtractor from "../OpenApiExtractor";
import FilePrinter from "../utils/FilePrinter";
import Generator from "../Generator";

const source = "OpenAPI" as GenerationSource;

try {
  if (source === "OpenAPI") {
    const nodegenParams = new OpenApiExtractor("lichess").run();
    new FilePrinter(nodegenParams).print({ format: "json" });
    new Generator(source, nodegenParams.mainParams).run();
  } else if (source === "YAML") {
    const yamlFile = join("src", "input", "razorpay.yaml");
    const file = yaml.load(readFileSync(yamlFile, "utf-8")) as NodegenParams;
    new FilePrinter(file).print({ format: "json" });
    new Generator(source, file.mainParams).run();
  }
  console.log("Successfully converted JS object into TypeScript node");
} catch (e) {
  console.log(e);
}
