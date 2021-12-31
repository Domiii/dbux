"use strict";(self.webpackChunkdbux_docs=self.webpackChunkdbux_docs||[]).push([[120],{3905:function(e,t,n){n.d(t,{Zo:function(){return c},kt:function(){return m}});var a=n(7294);function i(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function r(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function l(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?r(Object(n),!0).forEach((function(t){i(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):r(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function o(e,t){if(null==e)return{};var n,a,i=function(e,t){if(null==e)return{};var n,a,i={},r=Object.keys(e);for(a=0;a<r.length;a++)n=r[a],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);for(a=0;a<r.length;a++)n=r[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var u=a.createContext({}),s=function(e){var t=a.useContext(u),n=t;return e&&(n="function"==typeof e?e(t):l(l({},t),e)),n},c=function(e){var t=s(e.components);return a.createElement(u.Provider,{value:t},e.children)},d={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},p=a.forwardRef((function(e,t){var n=e.components,i=e.mdxType,r=e.originalType,u=e.parentName,c=o(e,["components","mdxType","originalType","parentName"]),p=s(n),m=i,b=p["".concat(u,".").concat(m)]||p[m]||d[m]||r;return n?a.createElement(b,l(l({ref:t},c),{},{components:n})):a.createElement(b,l({ref:t},c))}));function m(e,t){var n=arguments,i=t&&t.mdxType;if("string"==typeof e||i){var r=n.length,l=new Array(r);l[0]=p;var o={};for(var u in t)hasOwnProperty.call(t,u)&&(o[u]=t[u]);o.originalType=e,o.mdxType="string"==typeof e?e:i,l[1]=o;for(var s=2;s<r;s++)l[s]=n[s];return a.createElement.apply(null,l)}return a.createElement.apply(null,n)}p.displayName="MDXCreateElement"},7783:function(e,t,n){n.d(t,{Z:function(){return l}});var a=n(7294),i="tableOfContentsInline_0DDH",r=n(5002);var l=function(e){var t=e.toc,n=e.minHeadingLevel,l=e.maxHeadingLevel;return a.createElement("div",{className:i},a.createElement(r.Z,{toc:t,minHeadingLevel:n,maxHeadingLevel:l,className:"table-of-contents",linkClassName:null}))}},5002:function(e,t,n){n.d(t,{Z:function(){return s}});var a=n(7462),i=n(3366),r=n(7294),l=n(3616),o=["toc","className","linkClassName","linkActiveClassName","minHeadingLevel","maxHeadingLevel"];function u(e){var t=e.toc,n=e.className,a=e.linkClassName,i=e.isChild;return t.length?r.createElement("ul",{className:i?void 0:n},t.map((function(e){return r.createElement("li",{key:e.id},r.createElement("a",{href:"#"+e.id,className:null!=a?a:void 0,dangerouslySetInnerHTML:{__html:e.value}}),r.createElement(u,{isChild:!0,toc:e.children,className:n,linkClassName:a}))}))):null}function s(e){var t=e.toc,n=e.className,s=void 0===n?"table-of-contents table-of-contents__left-border":n,c=e.linkClassName,d=void 0===c?"table-of-contents__link":c,p=e.linkActiveClassName,m=void 0===p?void 0:p,b=e.minHeadingLevel,f=e.maxHeadingLevel,h=(0,i.Z)(e,o),g=(0,l.LU)(),v=null!=b?b:g.tableOfContents.minHeadingLevel,k=null!=f?f:g.tableOfContents.maxHeadingLevel,x=(0,l.DA)({toc:t,minHeadingLevel:v,maxHeadingLevel:k}),N=(0,r.useMemo)((function(){if(d&&m)return{linkClassName:d,linkActiveClassName:m,minHeadingLevel:v,maxHeadingLevel:k}}),[d,m,v,k]);return(0,l.Si)(N),r.createElement(u,(0,a.Z)({toc:x,className:s,linkClassName:d},h))}},5679:function(e,t,n){n.d(t,{Z:function(){return r}});var a=n(7294),i=n(633);function r(e){var t=Object.assign({},e);return"darkLight"in t||(t.darkLight=!0),a.createElement(i.Z,t)}},633:function(e,t,n){n.d(t,{Z:function(){return s}});var a=n(7462),i=n(3366),r=n(7294),l=n(5350),o=n(8767);var u=["src","title","zoomable","darkLight"];function s(e){var t=e.src,n=e.title,s=e.zoomable,c=e.darkLight,d=(0,i.Z)(e,u),p=function(e){var t=e.src,n=e.darkLight,a=(0,l.Z)().isDarkTheme;return(0,o.Z)()+(n?a?"dark/":"light/":"")+t}({src:t,darkLight:c}),m=s?"zoomable":"",b=n=n||t;return r.createElement("img",(0,a.Z)({className:m,src:p,alt:b,title:n},d))}},1044:function(e,t,n){n.d(t,{Z:function(){return l}});var a=n(7294),i=n(7783),r={display:"none"};function l(e){var t=e.toc;return a.createElement("div",{style:r},a.createElement(i.Z,{toc:t}))}},8767:function(e,t,n){n.d(t,{Z:function(){return i}});var a=n(2263);function i(){return(0,a.Z)().siteConfig.baseUrl}},6513:function(e,t,n){n.r(t),n.d(t,{frontMatter:function(){return s},contentTitle:function(){return c},metadata:function(){return d},toc:function(){return p},default:function(){return b}});var a=n(7462),i=n(3366),r=(n(7294),n(3905)),l=n(5679),o=n(1044),u=["components"],s={slug:"/using-dbux/"},c="Enable Dbux",d={unversionedId:"using-dbux/enable-dbux",id:"using-dbux/enable-dbux",title:"Enable Dbux",description:"Once installed, using Dbux involves two steps:",source:"@site/content/02-using-dbux/02-enable-dbux.mdx",sourceDirName:"02-using-dbux",slug:"/using-dbux/",permalink:"/dbux/using-dbux/",editUrl:"https://github.com/Domiii/dbux/blob/master/docs/content/content/02-using-dbux/02-enable-dbux.mdx",tags:[],version:"current",sidebarPosition:2,frontMatter:{slug:"/using-dbux/"},sidebar:"tutorialSidebar",previous:{title:"Installation",permalink:"/dbux/using-dbux/installation"},next:{title:"The Run Button",permalink:"/dbux/using-dbux/the-run-button"}},p=[{value:"Run an Application with Dbux Enabled",id:"run-an-application-with-dbux-enabled",children:[],level:2},{value:"Runtime Analysis",id:"runtime-analysis",children:[],level:2}],m={toc:p};function b(e){var t=e.components,n=(0,i.Z)(e,u);return(0,r.kt)("wrapper",(0,a.Z)({},m,n,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("h1",{id:"enable-dbux"},"Enable Dbux"),(0,r.kt)(o.Z,{toc:p,mdxType:"TOC"}),(0,r.kt)("p",null,"Once ",(0,r.kt)("a",{parentName:"p",href:"./using-dbux/installation"},"installed"),", using Dbux involves two steps:"),(0,r.kt)("ol",null,(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("a",{parentName:"li",href:"#run-an-application-with-dbux-enabled"},"Run an Application with Dbux Enabled"),"."),(0,r.kt)("li",{parentName:"ol"},"Use the Dbux VSCode Extension for ",(0,r.kt)("a",{parentName:"li",href:"#runtime-analysis"},"runtime analysis"),".")),(0,r.kt)("h2",{id:"run-an-application-with-dbux-enabled"},"Run an Application with Dbux Enabled"),(0,r.kt)("p",null,"The first step is to execute a JS application with Dbux enabled, meaning: the application must be instrumented by ",(0,r.kt)("a",{parentName:"p",href:"./tools-and-configuration/dbux-babel-plugin"},"@dbux/babel-plugin")," and injected with the ",(0,r.kt)("a",{parentName:"p",href:"./tools-and-configuration/dbux-runtime"},"@dbux/runtime"),"."),(0,r.kt)("p",null,"There are four different ways to run an application with Dbux enabled:"),(0,r.kt)("ol",null,(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("a",{parentName:"li",href:"./using-dbux/the-run-button"},"The Run Button")," ",(0,r.kt)(l.Z,{src:"play.svg",mdxType:"DarkLightImg"})," allows you to easily run a simple Node application with Dbux enabled."),(0,r.kt)("li",{parentName:"ol"},"The ",(0,r.kt)("a",{parentName:"li",href:"./tools-and-configuration/dbux-cli"},"Dbux CLI")," provides the magic that makes ",(0,r.kt)("a",{parentName:"li",href:"./using-dbux/the-run-button"},"The Run Button")," work. You can use it directly in order to run any non-bundled Node application."),(0,r.kt)("li",{parentName:"ol"},(0,r.kt)("a",{parentName:"li",href:"./dbux-practice"},"Dbux Practice")," allows the user to execute a curated list of real-world applications (some with real-world bugs) at the click of a single button, in order to explore and analyze them."),(0,r.kt)("li",{parentName:"ol"},"In order to enable Dbux for frontend and other bundled applications the developer needs to manually ",(0,r.kt)("a",{parentName:"li",href:"./tools-and-configuration/build-pipeline-integration"},"integrate Dbux into the project's build pipeline"),".")),(0,r.kt)("p",null,"Once running, an instrumented target application will try to record and send all runtime data to the ",(0,r.kt)("a",{parentName:"p",href:"./tools-and-configuration/dbux-code#runtime-server"},"runtime server")," where the developer can commence with ",(0,r.kt)("a",{parentName:"p",href:"#runtime-analysis"},"runtime analysis"),"."),(0,r.kt)("h2",{id:"runtime-analysis"},"Runtime Analysis"),(0,r.kt)("p",null,"Once executed, the recorded application should show up in the ",(0,r.kt)("a",{parentName:"p",href:"./using-dbux/applications"},"Application View"),"."),(0,r.kt)("p",null,"Once ",(0,r.kt)("a",{parentName:"p",href:"#run-an-application-with-dbux-enabled"},"recorded"),", the Dbux VSCode Extension offers several tools for runtime analysis:"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},"Use the ",(0,r.kt)("a",{parentName:"li",href:"./using-dbux/applications"},"Application View")," to go to the Application entry point."),(0,r.kt)("li",{parentName:"ul"},"Get a high-level overview with:",(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},"the ",(0,r.kt)("a",{parentName:"li",href:"./using-dbux/global"},"Global View"),"."),(0,r.kt)("li",{parentName:"ul"},"the ",(0,r.kt)("a",{parentName:"li",href:"./using-dbux/call-graph"},"Call Graph"),"."))),(0,r.kt)("li",{parentName:"ul"},"Get down into the nitty-gritty:",(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"./using-dbux/select-trace"},"Select a Trace")," ",(0,r.kt)(l.Z,{src:"crosshair_red.svg",mdxType:"DarkLightImg"}),"."),(0,r.kt)("li",{parentName:"ul"},"Investigate individual traces using the ",(0,r.kt)("a",{parentName:"li",href:"./using-dbux/trace-details"},"Trace Details View")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"./using-dbux/trace-details#navigation"},"Navigate")," TODO(pic) between traces."),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"./using-dbux/search"},"Search")," for traces, contexts, modules or data."))),(0,r.kt)("li",{parentName:"ul"},"Understand where data came from and where it went using the ",(0,r.kt)("a",{parentName:"li",href:"./using-dbux/data-flow"},"Data Flow View"),".")),(0,r.kt)("div",{className:"admonition admonition-tip alert alert--success"},(0,r.kt)("div",{parentName:"div",className:"admonition-heading"},(0,r.kt)("h5",{parentName:"div"},(0,r.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,r.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"12",height:"16",viewBox:"0 0 12 16"},(0,r.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M6.5 0C3.48 0 1 2.19 1 5c0 .92.55 2.25 1 3 1.34 2.25 1.78 2.78 2 4v1h5v-1c.22-1.22.66-1.75 2-4 .45-.75 1-2.08 1-3 0-2.81-2.48-5-5.5-5zm3.64 7.48c-.25.44-.47.8-.67 1.11-.86 1.41-1.25 2.06-1.45 3.23-.02.05-.02.11-.02.17H5c0-.06 0-.13-.02-.17-.2-1.17-.59-1.83-1.45-3.23-.2-.31-.42-.67-.67-1.11C2.44 6.78 2 5.65 2 5c0-2.2 2.02-4 4.5-4 1.22 0 2.36.42 3.22 1.19C10.55 2.94 11 3.94 11 5c0 .66-.44 1.78-.86 2.48zM4 14h5c-.23 1.14-1.3 2-2.5 2s-2.27-.86-2.5-2z"}))),"tip")),(0,r.kt)("div",{parentName:"div",className:"admonition-content"},(0,r.kt)("p",{parentName:"div"},"All buttons in the Dbux VSCode Extension have corresponding ",(0,r.kt)("a",{parentName:"p",href:"./tools-and-configuration/dbux-code#commands"},"commands")," which in turn (are not by default but) ",(0,r.kt)("a",{parentName:"p",href:"https://code.visualstudio.com/docs/getstarted/keybindings"},"can be key-bound"),"."))))}b.isMDXComponent=!0}}]);