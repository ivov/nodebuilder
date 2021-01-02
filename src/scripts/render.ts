import json from "../input/lichess.json";

import TreeRenderer from "../TreeRenderer";
import OpenApiExtractor from "../OpenApiExtractor";
import FilePrinter from "../FilePrinter";

try {
  const extractor = new OpenApiExtractor(json);
  const nodegenParams = extractor.run();
  const treeViewer = new TreeRenderer(nodegenParams.mainParams, json);
  const treeview = treeViewer.run();
  const printer = new FilePrinter(treeview);
  printer.print({ format: "txt" });
  console.log("Successfully rendered OpenAPI JSON as treeview");
} catch (e) {
  throw new Error("Failed to render OpenAPI JSON as treeview");
}
