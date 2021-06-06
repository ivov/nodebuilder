import Generator from "../services/TypeScriptGenerator";
import YamlParser from "../services/YamlParser";
import YamlStager from "../services/YamlStager";
import YamlTraverser from "../services/YamlTraverser";
import FilePrinter from "../utils/FilePrinter";

// for quick testing only

const preTraversalParams = new YamlParser("elasticsearch.yaml").run();
const traversedParams = new YamlTraverser(preTraversalParams).run();
const stagedParams = new YamlStager(traversedParams).run();

new FilePrinter(stagedParams).print({ format: "json" });
new Generator(stagedParams.mainParams).run();
