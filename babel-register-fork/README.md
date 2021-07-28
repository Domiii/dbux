# About this version of `@babel/register`

This version is a copy+paste of the **built** files of [`babel-register`](https://github.com/babel/babel/tree/main/packages/babel-register).

This is so we can (under time pressure) find a quick-and-dirty solution for [non-functional caching](https://github.com/babel/babel/issues/5667) in `@babel/register`.

Things that were changed:

* `package.json`, so we can easily link it locally
* `node.js`, `cache.js` to address the caching issues


# @babel/register

> babel require hook

See our website [@babel/register](https://babeljs.io/docs/en/babel-register) for more information or the [issues](https://github.com/babel/babel/issues?utf8=%E2%9C%93&q=is%3Aissue+label%3A%22pkg%3A%20register%22+is%3Aopen) associated with this package.

## Install

Using npm:

```sh
npm install --save-dev @babel/register
```

or using yarn:

```sh
yarn add @babel/register --dev
```
