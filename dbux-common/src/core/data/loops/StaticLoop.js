import Loc from "../Loc";
import StaticVar from '../StaticVar';

export default class StaticLoop {
  staticLoopId: number;
  staticContextId: number;
  // type: number;
  loc: Loc;

  vars: Array<StaticVar>;
  
  displayName: string;
}