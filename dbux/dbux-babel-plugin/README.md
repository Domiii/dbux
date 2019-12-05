# babel-plugin-dbux-babel-plugin



## Example

**In**

```js
// input code
```

**Out**

```js
"use strict";

// output code
```

## Installation

```sh
$ npm install babel-plugin-dbux-babel-plugin
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["dbux-babel-plugin"]
}
```

### Via CLI

```sh
$ babel --plugins dbux-babel-plugin script.js
```

### Via Node API

```javascript
require("babel-core").transform("code", {
  plugins: ["dbux-babel-plugin"]
});
```
