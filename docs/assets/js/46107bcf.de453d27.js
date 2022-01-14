"use strict";(self.webpackChunkdbux_docs=self.webpackChunkdbux_docs||[]).push([[88],{3905:function(e,t,a){a.d(t,{Zo:function(){return p},kt:function(){return m}});var n=a(7294);function r(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function o(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),a.push.apply(a,n)}return a}function i(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{};t%2?o(Object(a),!0).forEach((function(t){r(e,t,a[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(a)):o(Object(a)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(a,t))}))}return e}function l(e,t){if(null==e)return{};var a,n,r=function(e,t){if(null==e)return{};var a,n,r={},o=Object.keys(e);for(n=0;n<o.length;n++)a=o[n],t.indexOf(a)>=0||(r[a]=e[a]);return r}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(n=0;n<o.length;n++)a=o[n],t.indexOf(a)>=0||Object.prototype.propertyIsEnumerable.call(e,a)&&(r[a]=e[a])}return r}var s=n.createContext({}),d=function(e){var t=n.useContext(s),a=t;return e&&(a="function"==typeof e?e(t):i(i({},t),e)),a},p=function(e){var t=d(e.components);return n.createElement(s.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},c=n.forwardRef((function(e,t){var a=e.components,r=e.mdxType,o=e.originalType,s=e.parentName,p=l(e,["components","mdxType","originalType","parentName"]),c=d(a),m=r,f=c["".concat(s,".").concat(m)]||c[m]||u[m]||o;return a?n.createElement(f,i(i({ref:t},p),{},{components:a})):n.createElement(f,i({ref:t},p))}));function m(e,t){var a=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var o=a.length,i=new Array(o);i[0]=c;var l={};for(var s in t)hasOwnProperty.call(t,s)&&(l[s]=t[s]);l.originalType=e,l.mdxType="string"==typeof e?e:r,i[1]=l;for(var d=2;d<o;d++)i[d]=a[d];return n.createElement.apply(null,i)}return n.createElement.apply(null,a)}c.displayName="MDXCreateElement"},5002:function(e,t,a){a.d(t,{Z:function(){return d}});var n=a(7462),r=a(3366),o=a(7294),i=a(3616),l=["toc","className","linkClassName","linkActiveClassName","minHeadingLevel","maxHeadingLevel"];function s(e){var t=e.toc,a=e.className,n=e.linkClassName,r=e.isChild;return t.length?o.createElement("ul",{className:r?void 0:a},t.map((function(e){return o.createElement("li",{key:e.id},o.createElement("a",{href:"#"+e.id,className:null!=n?n:void 0,dangerouslySetInnerHTML:{__html:e.value}}),o.createElement(s,{isChild:!0,toc:e.children,className:a,linkClassName:n}))}))):null}function d(e){var t=e.toc,a=e.className,d=void 0===a?"table-of-contents table-of-contents__left-border":a,p=e.linkClassName,u=void 0===p?"table-of-contents__link":p,c=e.linkActiveClassName,m=void 0===c?void 0:c,f=e.minHeadingLevel,k=e.maxHeadingLevel,h=(0,r.Z)(e,l),v=(0,i.LU)(),b=null!=f?f:v.tableOfContents.minHeadingLevel,y=null!=k?k:v.tableOfContents.maxHeadingLevel,g=(0,i.DA)({toc:t,minHeadingLevel:b,maxHeadingLevel:y}),x=(0,o.useMemo)((function(){if(u&&m)return{linkClassName:u,linkActiveClassName:m,minHeadingLevel:b,maxHeadingLevel:y}}),[u,m,b,y]);return(0,i.Si)(x),o.createElement(s,(0,n.Z)({toc:g,className:d,linkClassName:u},h))}},3755:function(e,t,a){a.d(t,{Z:function(){return s}});var n=a(7462),r=a(3366),o=a(7294),i=a(9700),l=["path","children","title"];function s(e){var t=e.path,a=e.children,s=e.title,d=(0,r.Z)(e,l);if(!t)throw new Error('invalid <CodeLink /> missing "path". - props: '+JSON.stringify(e,null,2));var p=(0,i.B)(t);a=a||p,s=s||a;var u="https://github.com/Domiii/dbux/tree/master/"+t;return o.createElement("a",(0,n.Z)({title:s,href:u},d),a)}},8640:function(e,t,a){a.d(t,{Z:function(){return s}});var n=a(7294),r="tableOfContentsInline_0DDH",o=a(5002);var i=function(e){var t=e.toc,a=e.minHeadingLevel,i=e.maxHeadingLevel;return n.createElement("div",{className:r},n.createElement(o.Z,{toc:t,minHeadingLevel:a,maxHeadingLevel:i,className:"table-of-contents",linkClassName:null}))},l={display:"none"};function s(e){var t=e.toc;return n.createElement("div",{style:l},n.createElement(i,{toc:t}))}},9700:function(e,t,a){a.d(t,{B:function(){return r}});var n={"dbux-code":"Dbux VSCode Extension"};function r(e){var t=n[e];return t||(e.startsWith("dbux-")&&!e.startsWith("dbux-code")?"@dbux/"+e.substring(5):e)}},9661:function(e,t,a){a.r(t),a.d(t,{frontMatter:function(){return d},contentTitle:function(){return p},metadata:function(){return u},toc:function(){return c},default:function(){return f}});var n=a(7462),r=a(3366),o=(a(7294),a(3905)),i=a(3755),l=a(8640),s=["components"],d={},p="Dbux Data Analysis",u={unversionedId:"advanced/data-analysis",id:"advanced/data-analysis",title:"Dbux Data Analysis",description:"Dbux provides several tools for manual data analysis. However, this page explains how to use advanced data analysis tools and techniques.",source:"@site/content/advanced/05-data-analysis.mdx",sourceDirName:"advanced",slug:"/advanced/data-analysis",permalink:"/dbux/advanced/data-analysis",editUrl:"https://github.com/Domiii/dbux/blob/master/docs/content/advanced/05-data-analysis.mdx",tags:[],version:"current",sidebarPosition:5,frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Terminology",permalink:"/dbux/advanced/terminology"},next:{title:"Who is Using Dbux?",permalink:"/dbux/advanced/dbux-uses"}},c=[{value:"Exporting + Importing Trace Logs",id:"art-vandelay",children:[],level:2},{value:"Python Experiments",id:"python-experiments",children:[],level:2}],m={toc:c};function f(e){var t=e.components,a=(0,r.Z)(e,s);return(0,o.kt)("wrapper",(0,n.Z)({},m,a,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"dbux-data-analysis"},"Dbux Data Analysis"),(0,o.kt)(l.Z,{toc:c,mdxType:"TOC"}),(0,o.kt)("p",null,"Dbux provides several tools for manual data analysis. However, this page explains how to use ",(0,o.kt)("strong",{parentName:"p"},"advanced data analysis tools and techniques"),"."),(0,o.kt)("ol",null,(0,o.kt)("li",{parentName:"ol"},"You probably want to start by exporting the data, using the ",(0,o.kt)("inlineCode",{parentName:"li"},'"Dbux: Export Application Data"')," command",(0,o.kt)("sup",{parentName:"li",id:"fnref-1"},(0,o.kt)("a",{parentName:"sup",href:"#fn-1",className:"footnote-ref"},"1")),"."),(0,o.kt)("li",{parentName:"ol"},"\u200b",(0,o.kt)(i.Z,{path:"dbux-data",mdxType:"CodeLink"})," is our main data processing JavaScript package. We use it to preprocess and manage all runtime data. ",(0,o.kt)(i.Z,{path:"dbux-code",mdxType:"CodeLink"})," uses ",(0,o.kt)(i.Z,{path:"dbux-data",mdxType:"CodeLink"}),"'s preprocessed data for visualization and user interactions."),(0,o.kt)("li",{parentName:"ol"},"\u200b",(0,o.kt)(i.Z,{path:"analysis",mdxType:"CodeLink"})," contains a few Python functions and example notebooks that use extracted data for testing and development purposes. NOTE: This package is not matured and, unlike ",(0,o.kt)("inlineCode",{parentName:"li"},"@dbux/data"),", has almost no Dbux-specific data processing utilities. More details ",(0,o.kt)("a",{parentName:"li",href:"#python-experiments"},"below"),".")),(0,o.kt)("p",null,"Make sure to give it a good try, and feel free to complain or otherwise report back to us on the ",(0,o.kt)("a",{parentName:"p",href:"https://discord.gg/QKgq9ZE"},"Dbux DISCORD"),"."),(0,o.kt)("h2",{id:"art-vandelay"},"Exporting + Importing Trace Logs"),(0,o.kt)("p",null,"You can export and import application data using corresponding ",(0,o.kt)("a",{parentName:"p",href:"/dbux/tools-and-configuration/dbux-code#commands"},"commands"),". "),(0,o.kt)("p",null,"Specifically:"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("inlineCode",{parentName:"li"},"Dbux: Export Application Data")," and"),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("inlineCode",{parentName:"li"},"Dbux: Import Application Data"))),(0,o.kt)("p",null,"Cross-platform imports are supported, but there is an ",(0,o.kt)("a",{parentName:"p",href:"https://github.com/Domiii/dbux/issues/642"},"open bug")," that should soon be resolved."),(0,o.kt)("h2",{id:"python-experiments"},"Python Experiments"),(0,o.kt)("p",null,"In the ",(0,o.kt)("inlineCode",{parentName:"p"},"analyze/")," folder, you find several example notebooks that allow you to analyze the data that ",(0,o.kt)("inlineCode",{parentName:"p"},"dbux")," generates. Here is how you set that up:"),(0,o.kt)("ol",null,(0,o.kt)("li",{parentName:"ol"},"Run some program with Dbux enabled (e.g. ",(0,o.kt)("inlineCode",{parentName:"li"},"samples/[...]/oop1.js"),")"),(0,o.kt)("li",{parentName:"ol"},"Use the ",(0,o.kt)("a",{parentName:"li",href:"#art-vandelay"},'"Export Application Data" command'),"."),(0,o.kt)("li",{parentName:"ol"},"Make sure you have Python + Jupyter setup",(0,o.kt)("ul",{parentName:"li"},(0,o.kt)("li",{parentName:"ul"},"Windows",(0,o.kt)("ol",{parentName:"li"},(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("a",{parentName:"li",href:"https://chocolatey.org/packages/anaconda3"},"Install ",(0,o.kt)("inlineCode",{parentName:"a"},"Anaconda")," with ",(0,o.kt)("inlineCode",{parentName:"a"},"chocolatey"))),(0,o.kt)("li",{parentName:"ol"},"Set your ",(0,o.kt)("inlineCode",{parentName:"li"},"%PYTHONPATH%")," in system config to your Anaconda ",(0,o.kt)("inlineCode",{parentName:"li"},"Lib")," + ",(0,o.kt)("inlineCode",{parentName:"li"},"DLLs")," folders (e.g. ",(0,o.kt)("inlineCode",{parentName:"li"},"C:\\tools\\Anaconda3\\Lib;C:\\tools\\Anaconda3\\DLLs;"),")"),(0,o.kt)("li",{parentName:"ol"},"Done!"))),(0,o.kt)("li",{parentName:"ul"},"TODO: Other OS'es"))),(0,o.kt)("li",{parentName:"ol"},"Run one of the notebooks, load the file, and analyze.")),(0,o.kt)("p",null,"NOTE: this is not currently well maintained. Make sure to ",(0,o.kt)("a",{parentName:"p",href:"https://discord.gg/QKgq9ZE"},"reach out"),", if things go wrong."),(0,o.kt)("p",null,"PS: If you want more/better support for automatic data analysis, please let us know on Discord and also feel free to up-vote ",(0,o.kt)("a",{parentName:"p",href:"https://github.com/Domiii/dbux/issues/208"},"this issue"),"."),(0,o.kt)("div",{className:"footnotes"},(0,o.kt)("hr",{parentName:"div"}),(0,o.kt)("ol",{parentName:"div"},(0,o.kt)("li",{parentName:"ol",id:"fn-1"},(0,o.kt)(i.Z,{path:"dbux-data/src/applications/importExport.js",mdxType:"CodeLink"}),(0,o.kt)("p",{parentName:"li"},(0,o.kt)("a",{parentName:"p",href:"#fnref-1",className:"footnote-backref"},"\u21a9"))))))}f.isMDXComponent=!0}}]);