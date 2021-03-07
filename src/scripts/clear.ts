import fs, { existsSync } from "fs";
import { join } from "path";
import { promisify } from "util";

const deleteDir = promisify(fs.rmdir);
const deleteFile = promisify(fs.unlink);

const descriptionsDir = join("src", "output", "descriptions");

if (!existsSync(descriptionsDir)) {
  deleteDir(descriptionsDir);
}

const filesToDelete = fs
  .readdirSync(join("src", "output"))
  .filter((file) => file !== ".gitkeep");

filesToDelete.forEach(deleteFile);
