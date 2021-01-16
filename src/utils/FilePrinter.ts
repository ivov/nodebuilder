import { writeFileSync } from "fs";
import { join, resolve } from "path";
import { execSync } from "child_process";
import { Project } from "ts-morph";

/**Converts nodegen params into TypeScript or JSON, or treeview into TXT.*/
export default class FilePrinter {
  private readonly basePath = resolve("./", "src", "input");
  private readonly nodegenPath = join(this.basePath, "nodegenParams");
  private readonly treeviewPath = join(this.basePath, "treeview");

  constructor(private readonly printable: NodegenParams | string) {}

  public print({ format }: { format: "json" | "ts" | "txt" }) {
    if (format === "json") this.printJson();
    if (format === "ts") this.printTypeScript();
    if (format === "txt") this.printTxt();
  }

  private getJson() {
    return JSON.stringify(this.printable, null, 2);
  }

  private printJson() {
    writeFileSync(this.nodegenPath + ".json", this.getJson(), "utf8");
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
