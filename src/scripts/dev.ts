import NodeCodeGenerator from "../services/NodeCodeGenerator";
import CustomSpecStager from "../services/CustomSpecStager";
import CustomSpecAdjuster from "../services/CustomSpecAdjuster";
import FilePrinter from "../utils/FilePrinter";
import OpenApiStager from "../services/OpenApiStager";
import PackageJsonGenerator from "../services/PackageJsonGenerator";

// for quick testing only

// const adjustedParams = new CustomSpecAdjuster("abc.yaml").run();
// const stagedParams = new CustomSpecStager(adjustedParams).run();

const stagedParams = new OpenApiStager("misp.json").run();

new FilePrinter(stagedParams).print({ format: "json" });
new NodeCodeGenerator(stagedParams.mainParams).run();

// new PackageJsonGenerator(stagedParamsFromYaml.metaParams).run();
