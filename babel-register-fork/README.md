# About this version of `@babel/register`

This version is a copy+paste of the **built** files of [`babel-register`](https://github.com/babel/babel/tree/main/packages/babel-register).

This version applies a quick-and-dirty solution for caching, as discussed [here](https://github.com/babel/babel/issues/5667).

Things that are different in this fork:

* `node.js`, `cache.js` to address the caching issues
* `package.json`, so we can easily link it locally

This is being made use of by [@dbux/cli](../dbux-cli#readme), which, thanks to this modification, offers a reliable and efficient cache implementation that can be enabled with the `--cache` flag.
