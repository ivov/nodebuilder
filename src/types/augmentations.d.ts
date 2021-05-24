// ----------------------------------
//        Module augmentations
// ----------------------------------

declare module "object-treeify" {
  export default function treeify(jsObject: Object): string;
}

declare module "js-yaml" {
  export function load(json: string): JsonObject;
}
