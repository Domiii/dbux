/*! For license information please see d4327bae.8d7adb80.js.LICENSE.txt */
(self.webpackChunkdbux_docs=self.webpackChunkdbux_docs||[]).push([[374],{3905:function(e,t,r){"use strict";r.d(t,{Zo:function(){return l},kt:function(){return f}});var n=r(7294);function o(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function i(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function a(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?i(Object(r),!0).forEach((function(t){o(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):i(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function c(e,t){if(null==e)return{};var r,n,o=function(e,t){if(null==e)return{};var r,n,o={},i=Object.keys(e);for(n=0;n<i.length;n++)r=i[n],t.indexOf(r)>=0||(o[r]=e[r]);return o}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(n=0;n<i.length;n++)r=i[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(o[r]=e[r])}return o}var s=n.createContext({}),u=function(e){var t=n.useContext(s),r=t;return e&&(r="function"==typeof e?e(t):a(a({},t),e)),r},l=function(e){var t=u(e.components);return n.createElement(s.Provider,{value:t},e.children)},d={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},p=n.forwardRef((function(e,t){var r=e.components,o=e.mdxType,i=e.originalType,s=e.parentName,l=c(e,["components","mdxType","originalType","parentName"]),p=u(r),f=o,m=p["".concat(s,".").concat(f)]||p[f]||d[f]||i;return r?n.createElement(m,a(a({ref:t},l),{},{components:r})):n.createElement(m,a({ref:t},l))}));function f(e,t){var r=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var i=r.length,a=new Array(i);a[0]=p;var c={};for(var s in t)hasOwnProperty.call(t,s)&&(c[s]=t[s]);c.originalType=e,c.mdxType="string"==typeof e?e:o,a[1]=c;for(var u=2;u<i;u++)a[u]=r[u];return n.createElement.apply(null,a)}return n.createElement.apply(null,r)}p.displayName="MDXCreateElement"},3755:function(e,t,r){"use strict";r.d(t,{Z:function(){return s}});var n=r(7462),o=r(3366),i=r(7294),a=r(9700),c=["path","children","title"];function s(e){var t=e.path,r=e.children,s=e.title,u=(0,o.Z)(e,c);if(!t)throw new Error('invalid <CodeLink /> missing "path". - props: '+JSON.stringify(e,null,2));var l=(0,a.B)(t);r=r||l,s=s||r;var d="https://github.com/Domiii/dbux/tree/master/"+t;return i.createElement("a",(0,n.Z)({title:s,href:d},u),r)}},5679:function(e,t,r){"use strict";r.d(t,{Z:function(){return i}});var n=r(7294),o=r(633);function i(e){var t=Object.assign({},e);return"darkLight"in t||(t.darkLight=!0),n.createElement(o.Z,t)}},633:function(e,t,r){"use strict";r.d(t,{Z:function(){return m}});var n=r(7462),o=r(3366),i=r(7294),a=r(4184),c=r.n(a),s=r(7037),u=r.n(s),l=r(5350),d=r(8767);var p=["src","title","zoomable","darkLight","screen","concept","className","maxWidth","mb","style"];function f(e){return e.startsWith("/")||e.includes("://")}function m(e){var t=e.src,r=e.title,a=e.zoomable,s=e.darkLight,m=e.screen,b=e.concept,g=e.className,h=e.maxWidth,v=e.mb,x=e.style,y=(0,o.Z)(e,p);b&&(t.startsWith("concept")||f(t)||(t="concepts/"+t)),m&&(t.startsWith("screen")||f(t)||(t="screens/"+t));var k=b||m||a;k&&void 0===a&&(a=!0);var O=function(e){var t=e.src,r=e.darkLight,n=(0,l.Z)().isDarkTheme;return(0,d.Z)()+(r?n?"dark/":"light/":"")+t}({src:t,darkLight:s}),j=r=r||t;g=c()(g,{"border-screen":k,"img-crisp":k,zoomable:a});var w=i.createElement("img",(0,n.Z)({className:g,style:x,src:O,alt:j,title:r},y));if(h){h=u()(h)?h:h+"px",v=void 0===v?"mb-2":v;var N=c()(v),D={display:"inline-block",maxWidth:h,lineHeight:0};w=i.createElement("div",{className:N,style:D},w)}return w}},8767:function(e,t,r){"use strict";r.d(t,{Z:function(){return o}});var n=r(2263);function o(){return(0,n.Z)().siteConfig.baseUrl}},9700:function(e,t,r){"use strict";r.d(t,{B:function(){return o}});var n={"dbux-code":"Dbux VSCode Extension"};function o(e){var t=n[e];return t||(e.startsWith("dbux-")&&!e.startsWith("dbux-code")?"@dbux/"+e.substring(5):e)}},957:function(e,t,r){"use strict";r.r(t),r.d(t,{frontMatter:function(){return u},contentTitle:function(){return l},metadata:function(){return d},toc:function(){return p},default:function(){return m}});var n=r(7462),o=r(3366),i=(r(7294),r(3905)),a=r(633),c=r(3755),s=(r(5679),["components"]),u={sidebar_class_name:"sidebar-code-decorations"},l="Code Decorations",d={unversionedId:"dbux-features/code-decorations",id:"dbux-features/code-decorations",title:"Code Decorations",description:"After executing an application with Dbux enabled, all executed code is decorated with \u21b3 \u21b1 \u21b3 \u0192 etc.",source:"@site/content/dbux-features/04-code-decorations.mdx",sourceDirName:"dbux-features",slug:"/dbux-features/code-decorations",permalink:"/dbux/dbux-features/code-decorations",editUrl:"https://github.com/Domiii/dbux/blob/master/docs/content/dbux-features/04-code-decorations.mdx",tags:[],version:"current",sidebarPosition:4,frontMatter:{sidebar_class_name:"sidebar-code-decorations"},sidebar:"tutorialSidebar",previous:{title:"The Run Button",permalink:"/dbux/dbux-features/the-run-button"},next:{title:"Application View",permalink:"/dbux/dbux-features/applications"}},p=[{value:"Interpreting Decorations",id:"interpreting-decorations",children:[],level:2},{value:"Examples",id:"examples",children:[],level:2}],f={toc:p};function m(e){var t=e.components,r=(0,o.Z)(e,s);return(0,i.kt)("wrapper",(0,n.Z)({},f,r,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("h1",{id:"code-decorations"},"Code Decorations"),(0,i.kt)("p",null,"After ",(0,i.kt)("a",{parentName:"p",href:"/dbux/dbux-features/enable-dbux"},"executing an application with Dbux enabled"),", all executed code is decorated with ",(0,i.kt)("span",{className:"color-red"},"\u21b3 \u21b1")," ",(0,i.kt)("span",{className:"color-gray"},"\u21b3")," ",(0,i.kt)("span",{className:"color-orange"},"\u0192")," etc."),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},"These decorations allow us to better understand which parts of the code actually executed, and covey some basic properties of how the code executed."),(0,i.kt)("li",{parentName:"ul"},"You can toggle decorations via the ",(0,i.kt)("inlineCode",{parentName:"li"},"Dbux: Hide Decorations")," and ",(0,i.kt)("inlineCode",{parentName:"li"},"Dbux: Show Decorations")," commands:",(0,i.kt)(a.Z,{screen:!0,src:"toggle-deco.png",mdxType:"Img"}))),(0,i.kt)("h2",{id:"interpreting-decorations"},"Interpreting Decorations"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},"Example: ",(0,i.kt)("code",null,"f()",(0,i.kt)("span",{className:"color-red"},"\u21b1"),";")," - the function ",(0,i.kt)("inlineCode",{parentName:"li"},"f")," was executed and recorded, and we can step into it."),(0,i.kt)("li",{parentName:"ul"},"Example: ",(0,i.kt)("code",null,"g()",(0,i.kt)("span",{className:"color-gray"},"\u21b1"),";")," - the function ",(0,i.kt)("inlineCode",{parentName:"li"},"g")," was executed but not recorded, and we cannot step into it. This means that ",(0,i.kt)("inlineCode",{parentName:"li"},"g")," is a native function or ",(0,i.kt)("a",{parentName:"li",href:"/dbux/guides/runtime-trace-filtering"},"not recorded for other reasons"),"."),(0,i.kt)("li",{parentName:"ul"},"All code decorations and their meanings are defined in ",(0,i.kt)(c.Z,{path:"dbux-code/src/codeDeco/traceDecoConfig.js",mdxType:"CodeLink"}),".")),(0,i.kt)("h2",{id:"examples"},"Examples"),(0,i.kt)("p",null,"In this buggy code, we can see that line 6 never executed, just from the code decorations:"),(0,i.kt)(a.Z,{screen:!0,src:"code-deco1.png",mdxType:"Img"}),(0,i.kt)("p",null,"TODO: more examples"))}m.isMDXComponent=!0},4184:function(e,t){var r;!function(){"use strict";var n={}.hasOwnProperty;function o(){for(var e=[],t=0;t<arguments.length;t++){var r=arguments[t];if(r){var i=typeof r;if("string"===i||"number"===i)e.push(r);else if(Array.isArray(r)){if(r.length){var a=o.apply(null,r);a&&e.push(a)}}else if("object"===i)if(r.toString===Object.prototype.toString)for(var c in r)n.call(r,c)&&r[c]&&e.push(c);else e.push(r.toString())}}return e.join(" ")}e.exports?(o.default=o,e.exports=o):void 0===(r=function(){return o}.apply(t,[]))||(e.exports=r)}()},2705:function(e,t,r){var n=r(5639).Symbol;e.exports=n},4239:function(e,t,r){var n=r(2705),o=r(9607),i=r(2333),a=n?n.toStringTag:void 0;e.exports=function(e){return null==e?void 0===e?"[object Undefined]":"[object Null]":a&&a in Object(e)?o(e):i(e)}},1957:function(e,t,r){var n="object"==typeof r.g&&r.g&&r.g.Object===Object&&r.g;e.exports=n},9607:function(e,t,r){var n=r(2705),o=Object.prototype,i=o.hasOwnProperty,a=o.toString,c=n?n.toStringTag:void 0;e.exports=function(e){var t=i.call(e,c),r=e[c];try{e[c]=void 0;var n=!0}catch(s){}var o=a.call(e);return n&&(t?e[c]=r:delete e[c]),o}},2333:function(e){var t=Object.prototype.toString;e.exports=function(e){return t.call(e)}},5639:function(e,t,r){var n=r(1957),o="object"==typeof self&&self&&self.Object===Object&&self,i=n||o||Function("return this")();e.exports=i},1469:function(e){var t=Array.isArray;e.exports=t},7005:function(e){e.exports=function(e){return null!=e&&"object"==typeof e}},7037:function(e,t,r){var n=r(4239),o=r(1469),i=r(7005);e.exports=function(e){return"string"==typeof e||!o(e)&&i(e)&&"[object String]"==n(e)}}}]);