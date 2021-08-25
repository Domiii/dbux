import { monkeyPatchHolderOverrideDefault } from '../util/monkeyPatchUtil';

export default function patchObject() {
  [
    "assign",
    "getOwnPropertyDescriptor",
    "getOwnPropertyDescriptors",
    "getOwnPropertyNames",
    "getOwnPropertySymbols",
    "is",
    "preventExtensions",
    "seal",
    "create",
    "defineProperties",
    "defineProperty",
    "freeze",
    "getPrototypeOf",
    "setPrototypeOf",
    "isExtensible",
    "isFrozen",
    "isSealed",
    "keys",
    "entries",
    "fromEntries",
    "values"
  ].forEach(key => monkeyPatchHolderOverrideDefault(Object, key));
}