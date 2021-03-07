import fs from "fs";
import { join } from "path";
import { promisify } from "util";

const deleteDir = promisify(fs.rmdir);
const deleteFile = promisify(fs.unlink);

const outputDir = join(__dirname, "..", "..", "src", "output");
const descriptionsDir = join(outputDir, "descriptions");

(async () => {
  if (fs.existsSync(descriptionsDir)) {
    await deleteDir(descriptionsDir, { recursive: true });
  }
})();

const filesToDelete = fs
  .readdirSync(outputDir)
  .filter((file) => fs.lstatSync(join(outputDir, file)).isFile())
  .filter((file) => file !== ".gitkeep");

filesToDelete.forEach(async (file) => {
  await deleteFile(join(outputDir, file));
});
