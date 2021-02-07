import { writeFileSync } from "fs";
import { join, resolve } from "path";
import { execSync } from "child_process";
import { Project } from "ts-morph";

/**Converts nodegen params into TypeScript or JSON, or treeview into TXT.*/
export default class FilePrinter {
  private readonly basePath = resolve("./", "src", "input");
  private readonly nodegenPath = join(this.basePath, "_nodegenParams");
  private readonly treeviewPath = join(this.basePath, "_treeview");
  private readonly apiMapPath = join(this.basePath, "_apiMap");

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
      writeFileSync(this.nodegenPath + ".json", this.getJson(), "utf8");
    } else {
      writeFileSync(this.apiMapPath + ".json", this.getJson(), "utf8");
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
    writeFileSync(this.treeviewPath + ".txt", this.printable, "utf8");
  }
}

function isNodegenParams(value: any): value is NodegenParams {
  return "metaParams" in value && "mainParams" in value;
}
