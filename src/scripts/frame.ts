// import yaml from "../input/razorpay.yaml";

import { readFileSync } from "fs";
import yaml from "js-yaml";
import { join } from "path";

const yamlFile = join("src", "input", "razorpay.yaml");
const file = yaml.load(readFileSync(yamlFile, "utf-8"));

console.log(JSON.stringify(file, null, 2));
