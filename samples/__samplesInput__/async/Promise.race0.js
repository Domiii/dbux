/**
 * @file 
 */

import { A, P, sleep } from '../../util/asyncUtil';

A(
  'A',
  // [
  //   'BA',
  //   'BB'
  // ],
  () => Promise.race([
    P(
      () => {
        console.log(`C11`);
        return sleep(200);
      },
      () => {
        console.log(`C12`);
        return sleep(200);
      }
    ),
    P(
      () => {
        console.log(`C21`);
        return sleep(100);
      },
      () => {
        console.log(`C22`);
        return sleep(100);
      }
    )
  ]),
  () => 'D',
  () => 'E'
);

