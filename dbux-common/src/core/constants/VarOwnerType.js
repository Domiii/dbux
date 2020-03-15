import Enum from "../../util/Enum";

let VarOwnerType = {
  Function: 1,
  Loop: 2
};
VarOwnerType = new Enum(VarOwnerType);

export default VarOwnerType;