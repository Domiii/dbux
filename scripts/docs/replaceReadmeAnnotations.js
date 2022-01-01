/**
 * @file Deprecated: we don't need to replace things anymore.
 */

// // make sure, we can import dbux stuff without any problems (and console log is pretty)
// require('../dbux-register-self');
// require('../../dbux-common/src/util/prettyLogs');

// const path = require('path');
// const fs = require('fs');
// // const fromEntries = require('object.fromentries');    // NOTE: Object.fromEntries was only added in Node v12

// const { genCommandsMd, genConfigMd } = require('./writeDbuxCodeMd');

// function getDbuxPath(...segments) {
//   return path.resolve(__dirname, '../..', ...segments);
// }



// // ###########################################################################
// // replace directives
// // ###########################################################################

// const markdownGenerators = {
//   codeCommands: genCommandsMd,
//   codeConfig: genConfigMd
// };

// function replaceDirectives(s, fpath) {
//   // see https://stackoverflow.com/questions/2575791/javascript-multiline-regexp-replace
//   return s.replace(/(<!--\s*dbux:(\w+) start\s*-->)([\s\S]*?)(<!--\s*dbux:(\w+) end\s*-->)/g,
//     (_all, pref, kind, content, suf, kind2) => {
//       // console.log(' match', { pref, kind, content, suf, kind2 });
//       if (kind !== kind2) {
//         throw new Error(`dbux annotation start<->end not matching in ${fpath}: "${pref}" does not match "${suf}"`);
//       }

//       const replacer = markdownGenerators[kind];
//       if (!replacer) {
//         throw new Error(`dbux annotation has invalid kind in ${fpath}: ${kind}`);
//       }
//       const replacement = replacer();
//       return `${pref}\n${replacement}\n${suf}`;
//     }
//   );
// }

// // ###########################################################################
// // urls
// // ###########################################################################

// const RootUrl = 'https://github.com/Domiii/dbux/tree/master/';

// // e.g. https://domiii.github.io/dbux/img/nav1.png
// const GithubPagesUrl = 'https://domiii.github.io/dbux/';

// /**
//  * Fix url for packaging VSCode extension.
//  * Essentially: just make it absolute to avoid any problems.
//  */
// function fixUrl(url, fpath, relativePath, raw = false) {
//   // if (isAbsolute(url)) {
//   let newUrl;
//   if (url.startsWith('https:') || url.startsWith('#')) {
//     newUrl = url;
//   }
//   else {
//     // try: `node -e "console.log(new URL('../d', 'http://a.b/c/X/').toString()); // http://a.b/c/d"`
//     const slash1 = !RootUrl.endsWith('/') && '/' || '';
//     const slash2 = !relativePath.endsWith('/') && '/' || '';
//     const base = `${RootUrl}${slash1}${relativePath}${slash2}`;
//     newUrl = new URL(url, base).toString();
//   }

//   if (raw && newUrl.startsWith(RootUrl)) {
//     // raw URLs need to go through Github Pages
//     newUrl = newUrl.replace(RootUrl, GithubPagesUrl);
//   }

//   if (newUrl !== url) {
//     console.debug(`  Replacing url: ${url} -> ${newUrl}`);
//   }

//   return newUrl;
// }

// function fixUrls(s, cb, fpath, relativePath) {
//   // s = '<img src="abc"> <img src="def">';
//   // s = 'x [a](b) y [c](d)z';
//   // why doesn't this work -> '![a](b)'.replace(/((?!!)\[.*?\]\()(.*?)(\))/g, (_all, pref, url, suf) => `${pref}X${url}X${suf}`)
//   const replacer = (_all, pref, url, suf) => `${pref}${cb(url, fpath, relativePath, false)}${suf}`;
//   const replacerRaw = (_all, pref, url, suf) => `${pref}${cb(url, fpath, relativePath, true)}${suf}`;

//   s = s.replace(/(<a.*?href=")(.*?)(")/g, replacer);
//   s = s.replace(/([^!]\[.*?\]\()(.*?)(\))/g, replacer);
//   s = s.replace(/(!\[.*?\]\()(.*?)(\))/g, replacerRaw);
//   s = s.replace(/(<img.*?src=")(.*?)(")/g, replacerRaw);

//   return s;
// }


// // ###########################################################################
// // markdown core
// // ###########################################################################

// function fixAndReplaceInMarkdown(fpath, relativePath) {
//   // var s = 'a <!-- dbux:commands start --> b <!-- dbux:commands end --> c';
//   let s = fs.readFileSync(fpath, 'utf-8');

//   // replace <!-- dbux:directives -->
//   s = replaceDirectives(s, fpath);

//   // fix `src`s, `href`s and [markdown](urls)
//   s = fixUrls(s, fixUrl, fpath, relativePath);

//   fs.writeFileSync(fpath, s);
// }

// function replaceInMarkdownFiles() {
//   fixAndReplaceInMarkdown(getDbuxPath('dbux-code/README.md'), 'dbux-code');
// }


// module.exports = {
//   replaceInMarkdownFiles
// };

// replaceInMarkdownFiles();
// // console.log(markdownReplacers.codeConfig());