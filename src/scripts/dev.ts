import OpenApiStager from "../services/OpenApiStager";
import PackageJsonGenerator from "../services/PackageJsonGenerator";
import NodeCodeGenerator from "../services/NodeCodeGenerator";
// import CustomSpecParser from "../services/CustomSpecParser";
import CustomSpecStager from "../services/CustomSpecStager";
import CustomSpecAdjuster from "../services/CustomSpecAdjuster";
import FilePrinter from "../utils/FilePrinter";

// for quick testing only

// const preTraversalParams = new YamlParser("Freshservice.yaml").run();
// const traversedParams = new YamlTraverser(preTraversalParams).run();
// const stagedParamsFromYaml = new YamlStager(traversedParams).run();

const stagedParamsFromOpenApi = new OpenApiStager("misp.json").run();

new FilePrinter(stagedParamsFromOpenApi).print({ format: "json" });
new NodeCodeGenerator(stagedParamsFromOpenApi.mainParams).run();
// new PackageJsonGenerator(stagedParamsFromYaml.metaParams).run();
