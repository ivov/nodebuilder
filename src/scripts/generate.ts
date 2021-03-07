import Generator from "../Generator";
import nodegenParams from "../input/_nodegenParams.json";

try {
  const mainParams = nodegenParams.mainParams as MainParams;
  new Generator("OpenAPI", mainParams).run();

  console.log("Successfully converted JS object into TypeScript node");
} catch (e) {
  console.log(e);
}
