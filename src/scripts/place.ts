import { OutputPlacer } from "../services/OutputPlacer";
import Prompter from "../services/Prompter";

new Prompter().askForPlacementTargetType().then((targetType) => {
  new OutputPlacer({ targetType }).run();
});
