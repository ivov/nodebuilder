import fs from "fs";
import path from "path";

import { load as toJsObject } from "js-yaml";
import { assertType } from "typescript-is";

import { customInputDir } from "../config";

/**
 * Readis a YAML containing an API mapping, converts it into
 * a JS object and validates its shape before traversal.
 */
export default class YamlParser {
  constructor(private yamlInputFileName: string) {}

  public run() {
    const yamlContent = this.readYaml();
    const preTraversalParams = toJsObject(yamlContent);

    if (arePreTraversalParams(preTraversalParams)) return preTraversalParams;

    throw new Error("YAML file invalid");
  }

  private readYaml() {
    const fullYamlFilePath = path.join(customInputDir, this.yamlInputFileName);
    return fs.readFileSync(fullYamlFilePath, "utf-8");
  }
}

function arePreTraversalParams(object: unknown): object is PreTraversalParams {
  assertType<YamlInput>(object);
  return true;
}
