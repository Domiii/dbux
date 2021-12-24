import terminateCb from 'terminate';
import { promisify } from 'util';

const terminate = promisify(terminateCb);

export default terminate;