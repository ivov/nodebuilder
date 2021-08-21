import { execSync } from "child_process";
import fs from "fs";
import path from "path";

import { Project } from "ts-morph";

import { inputDir } from "../config";

/**Converts nodegen params into TypeScript or JSON, or treeview into TXT.*/
export default class FilePrinter {
  private readonly nodegenPath = path.join(inputDir, "_nodegenParams");
  private readonly treeviewPath = path.join(inputDir, "_treeview");
  private readonly apiMapPath = path.join(inputDir, "_apiMap");

  constructor(private readonly printable: NodegenParams | TreeView | ApiMap) {}

  public print({ format }: { format: "json" | "ts" | "txt" }) {
    if (format === "json") this.printJson();
    if (format === "ts") this.printTypeScript();
    if (format === "txt") this.printTxt();
  }

  private getJson() {
    return JSON.stringify(this.printable, null, 2);
  }

  private printJson() {
    if (isNodegenParams(this.printable)) {
      fs.writeFileSync(this.nodegenPath + ".json", this.getJson(), "utf8");
    } else {
      fs.writeFileSync(this.apiMapPath + ".json", this.getJson(), "utf8");
    }
  }

  private printTypeScript() {
    new Project()
      .createSourceFile(
        this.nodegenPath + ".ts",
        `export default ${this.getJson()}`,
        { overwrite: true }
      )
      .saveSync();

    execSync(`npx prettier --write ${this.nodegenPath + ".ts"}`);
  }

  private printTxt() {
    if (typeof this.printable !== "string") {
      throw new Error("This method is only allowed for printing a treeview.");
    }
    fs.writeFileSync(this.treeviewPath + ".txt", this.printable, "utf8");
  }
}

function isNodegenParams(value: any): value is NodegenParams {
  return "metaParams" in value && "mainParams" in value;
}

export function printTranslation(
  yamlMainParams: CustomSpecParams["mainParams"]
) {
  console.log(yamlMainParams);
  fs.writeFileSync(
    "translation.json",
    JSON.stringify(yamlMainParams, null, 2),
    "utf8"
  );
}

export function printStagedParams(mainParams: MainParams) {
  fs.writeFileSync(
    "stagedParams.json",
    JSON.stringify(mainParams, null, 2),
    "utf8"
  );
}
