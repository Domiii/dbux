/**
 * @file
 * @see https://github.com/Domiii/dbux/issues/685
 */

class O {
    get a() {
        throw new Error('Cannot access prop "a"');
    }
    get b(){
        return 1;
    }
}

let o = new O();

o.a; // no trace for 'o.a'