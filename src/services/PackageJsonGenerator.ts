import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import axios from "axios";
import { hygen, outputDir } from "../config";

export default class PackageJsonGenerator {
  private metaParams: MetaParams;
  private outputPackageJsonPath = path.join(outputDir, "package.json");
  private packageJson: PackageJson;
  private packageJsonUrl =
    "https://raw.githubusercontent.com/n8n-io/n8n/master/packages/nodes-base/package.json";

  constructor(metaParams: MetaParams) {
    this.metaParams = metaParams;
  }

  public async run() {
    this.packageJson = await this.getPackageJson();
    this.checkIfNodeExists();
    this.storePackageJson();
    this.insertNodeInPackageJson();
  }

  private async getPackageJson() {
    return await axios
      .get<PackageJson>(this.packageJsonUrl)
      .then((response) => response.data);
  }

  private checkIfNodeExists() {
    const newNodeName = this.metaParams.serviceName.replace(/\s/, "");

    this.packageJson.n8n.nodes.forEach((nodePath) => {
      const existingNodeName = this.getNameFromNodePath(nodePath);

      if (newNodeName === existingNodeName) {
        throw new Error(
          "The node you are trying to create already exists in the n8n repo"
        );
      }
    });
  }

  private getNameFromNodePath(nodePath: string) {
    return nodePath.split("/").slice(-1)[0].replace(".node.js", "");
  }

  private storePackageJson() {
    fs.writeFileSync(
      this.outputPackageJsonPath,
      JSON.stringify(this.packageJson, null, 2)
    );
  }

  private insertNodeInPackageJson() {
    const serviceName = this.metaParams.serviceName.replace(/\s/, "");
    const args = `--serviceName ${serviceName} --nodeSpot ${this.findNodeSpot()}`;

    execSync(`env HYGEN_OVERWRITE=1 node ${hygen} insert packageJson ${args}`);
  }

  /**
   * Find the node after which the new node is to be inserted in `package.json`.
   * Comparison with dir and name: `Lichess/Lichess` vs. `Lemlist/Lemlist`
   */
  private findNodeSpot() {
    const newDirAndName = `${this.metaParams.serviceName}/${this.metaParams.serviceName}`;

    for (const nodePath of this.packageJson.n8n.nodes) {
      const dirAndName = nodePath.match(/dist\/nodes\/(.*)\.node\.js/)![1];
      if (dirAndName < newDirAndName) continue;
      return dirAndName;
    }

    throw new Error(
      "No node path insertion spot found in `package.json` retrieved from n8n repo"
    );
  }
}
