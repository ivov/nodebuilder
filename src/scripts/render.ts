import json from "../input/openApi/lichess.json";

import TreeRenderer from "../utils/TreeRenderer";
import OpenApiStager from "../services/OpenApiStager";
import FilePrinter from "../utils/FilePrinter";

const nodegenParams = new OpenApiStager("lichess").run();
const treeViewer = new TreeRenderer(nodegenParams.mainParams, json);
const treeview = treeViewer.run();
const printer = new FilePrinter(treeview);
printer.print({ format: "txt" });
