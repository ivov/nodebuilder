import { outputDir } from "../config";
import fs from "fs";
import { join } from "path";
import { promisify } from "util";

const deleteDir = promisify(fs.rmdir);
const deleteFile = promisify(fs.unlink);

(async () => {
  const descriptionsDir = join(outputDir, "descriptions");
  if (fs.existsSync(descriptionsDir)) {
    await deleteDir(descriptionsDir, { recursive: true });
  }
})();

const isFile = (file: string) => fs.lstatSync(join(outputDir, file)).isFile();

const filesToDelete = fs
  .readdirSync(outputDir)
  .filter(isFile)
  .filter((file) => file !== ".gitkeep");

filesToDelete.forEach(async (file) => {
  await deleteFile(join(outputDir, file));
});
