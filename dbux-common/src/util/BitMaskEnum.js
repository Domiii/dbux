// import FastBitSet from 'fastbitset';
// import Enum from './Enum';

// export default class BitMaskEnum extends Enum {
//   constructor(namesOrValuesByNames) {
//     super(namesOrValuesByNames);

//     this._initBitSet();
//   }

//   _initBitSet() {
//     this._bits = new FastBitSet(this.values);
//     this._tmpBits = new FastBitSet();

//     // make sure `_tmpBits` can hold all possible values
//     const msb = Math.max(...this.values); // TODO: find MSB
//     this._tmpBits.resize(msb);

//     if (this._tmpBits.words.length > 1) {
//       throw new Error('Bit set Enums currently only support up to 31 bits - ' + msb);
//     }
//   }

//   isValue(value, nameOrValue) {
//     return !!(value & this.getValue(nameOrValue));
//   }

//   getFirstIndex(bitMask) {
//     // value is bit mask -> convert to bit indexes
//     this._tmpBits.words[0] = bitMask;
//     for (const idx of iterateBitSet(this._tmpBits)) {
//       return idx;
//     }
//     return 0;
//   }

//   * getIndices(bitMask) {
//     // value is bit mask -> convert to bit indexes
//     this._tmpBits.words[0] = bitMask;
//     for (const idx of iterateBitSet(this._tmpBits)) {
//       yield idx;
//     }
//   }

//   getName = (bitMask) => {
//     bitMask = this.getFirstIndex(bitMask);
//     return this.namesByValues[bitMask];
//   }

//   getNames = (bitMask) => {
//     let names = '';
//     for (const idx of this.getIndices(bitMask)) {
//       names = `${names}${names && ',' || ':'}${this.namesByValues[idx]}`;
//     }
//     return names;
//   }

//   makeSimpleEnumObject(names) {
//     return Object.fromEntries(
//       names.map((name, i) => [name, 1 << (i + 1)])
//     );
//   }
// }

// // ###########################################################################
// // FastBitSet extensions
// // ###########################################################################

// /**
//  * Generator version of FastBitSet.array() function.
//  * @see https://github.com/lemire/FastBitSet.js/blob/5459a20c6b14e7eabc512db7eacf527fea88a0a3/FastBitSet.js#L163
//  */
// function* iterateBitSet(bitSet) {
//   const pos = 0 | 0;
//   const c = bitSet.words.length;
//   for (let k = 0; k < c; ++k) {
//     let w = bitSet.words[k];
//     while (w) {
//       const t = w & -w;
//       yield (k << 5) + bitSet.hammingWeight((t - 1) | 0);
//       w ^= t;
//     }
//   }
// }
