function f() {
  try {
    try {
      throw new Error(`err`);
    }
    finally { }
  }
  finally { }
}

f();

// function g() {
//   try {
//     console.log(`try outside 1`);
//     try {
//       console.log(`try inside`);
//       throw new Error(`err`);
//     }
//     finally {
//       console.log(`finally inside`);
//     }
//     console.log(`try outside 2`);
//   }
//   finally {
//     console.log(`finally outside`);
//   }
// }

// g();