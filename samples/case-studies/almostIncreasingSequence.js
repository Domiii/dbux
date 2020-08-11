/**
 * @see https://app.codesignal.com/arcade/intro/level-2/2mxbGwLzvkTCKAJMG
 */
function almostIncreasingSequence(s) {
  var l = s.length;
  var c = 0;

  // legend: D = Down, U = Up
  // of any three neighbors consider the 6 different configurations:
  //      [1,2,3] [1,3,2] [2,1,3] [2,3,1] [3,1,2] [3,2,1]
  //        UUU     UDU     DUU     UDD     DUD     DDD
  for (var i = 0; i < s.length - 2; i++) {
    if (cmp(s, i, D, D, D)) {
      // strictly decreasing
      return false;
    }
    else if (cmp(s, i, U, D, U)) {
      // 1,3,2
      s.splice(i-- + 1, 1);
      ++c;
    }
    else if (cmp(s, i, D, U, D) || cmp(s, i, D, U, U)) {
      // 3,1,2 or 2,1,3
      s.splice(i--, 1);
      ++c;
    }
    else if (cmp(s, i, U, D, D)) {
      // 2,3,1
      s.splice(i-- + 2, 1);
      ++c;
    }
  }
  return c < 2;
}

function U(a, b) {
  return b > a;
}

function D(a, b) {
  return b <= a;
}

function cmp(s, i, o1, o2, o3) {
  //console.log(i, o1.name+o2.name+o3.name, o1(s[i], s[i+1]) && o2(s[i+1], s[i+2]) && o3(s[i], s[i+2]))
  return o1(s[i], s[i + 1]) && o2(s[i + 1], s[i + 2]) && o3(s[i], s[i + 2]);
}

function main() {
  var a1 = [3, 6, 5, 8, 10, 20, 15];
  almostIncreasingSequence(a1);
}

/**
 * 
 */
main();


/**

```
let t = document.querySelectorAll('.task-tests--value')[0].textContent;
copy(t.substring(t.indexOf(':')+1).trim())
```
 */