/*! For license information please see 99545d96.197a0549.js.LICENSE.txt */
(self.webpackChunkdbux_docs=self.webpackChunkdbux_docs||[]).push([[999],{3905:function(e,t,a){"use strict";a.d(t,{Zo:function(){return d},kt:function(){return h}});var n=a(7294);function r(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function l(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),a.push.apply(a,n)}return a}function i(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{};t%2?l(Object(a),!0).forEach((function(t){r(e,t,a[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(a)):l(Object(a)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(a,t))}))}return e}function o(e,t){if(null==e)return{};var a,n,r=function(e,t){if(null==e)return{};var a,n,r={},l=Object.keys(e);for(n=0;n<l.length;n++)a=l[n],t.indexOf(a)>=0||(r[a]=e[a]);return r}(e,t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);for(n=0;n<l.length;n++)a=l[n],t.indexOf(a)>=0||Object.prototype.propertyIsEnumerable.call(e,a)&&(r[a]=e[a])}return r}var s=n.createContext({}),c=function(e){var t=n.useContext(s),a=t;return e&&(a="function"==typeof e?e(t):i(i({},t),e)),a},d=function(e){var t=c(e.components);return n.createElement(s.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},u=n.forwardRef((function(e,t){var a=e.components,r=e.mdxType,l=e.originalType,s=e.parentName,d=o(e,["components","mdxType","originalType","parentName"]),u=c(a),h=r,m=u["".concat(s,".").concat(h)]||u[h]||p[h]||l;return a?n.createElement(m,i(i({ref:t},d),{},{components:a})):n.createElement(m,i({ref:t},d))}));function h(e,t){var a=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var l=a.length,i=new Array(l);i[0]=u;var o={};for(var s in t)hasOwnProperty.call(t,s)&&(o[s]=t[s]);o.originalType=e,o.mdxType="string"==typeof e?e:r,i[1]=o;for(var c=2;c<l;c++)i[c]=a[c];return n.createElement.apply(null,i)}return n.createElement.apply(null,a)}u.displayName="MDXCreateElement"},5002:function(e,t,a){"use strict";a.d(t,{Z:function(){return c}});var n=a(7462),r=a(3366),l=a(7294),i=a(3616),o=["toc","className","linkClassName","linkActiveClassName","minHeadingLevel","maxHeadingLevel"];function s(e){var t=e.toc,a=e.className,n=e.linkClassName,r=e.isChild;return t.length?l.createElement("ul",{className:r?void 0:a},t.map((function(e){return l.createElement("li",{key:e.id},l.createElement("a",{href:"#"+e.id,className:null!=n?n:void 0,dangerouslySetInnerHTML:{__html:e.value}}),l.createElement(s,{isChild:!0,toc:e.children,className:a,linkClassName:n}))}))):null}function c(e){var t=e.toc,a=e.className,c=void 0===a?"table-of-contents table-of-contents__left-border":a,d=e.linkClassName,p=void 0===d?"table-of-contents__link":d,u=e.linkActiveClassName,h=void 0===u?void 0:u,m=e.minHeadingLevel,f=e.maxHeadingLevel,g=(0,r.Z)(e,o),k=(0,i.LU)(),v=null!=m?m:k.tableOfContents.minHeadingLevel,y=null!=f?f:k.tableOfContents.maxHeadingLevel,b=(0,i.DA)({toc:t,minHeadingLevel:v,maxHeadingLevel:y}),x=(0,l.useMemo)((function(){if(p&&h)return{linkClassName:p,linkActiveClassName:h,minHeadingLevel:v,maxHeadingLevel:y}}),[p,h,v,y]);return(0,i.Si)(x),l.createElement(s,(0,n.Z)({toc:b,className:c,linkClassName:p},g))}},3755:function(e,t,a){"use strict";a.d(t,{Z:function(){return s}});var n=a(7462),r=a(3366),l=a(7294),i=a(9700),o=["path","children","title"];function s(e){var t=e.path,a=e.children,s=e.title,c=(0,r.Z)(e,o);if(!t)throw new Error('invalid <CodeLink /> missing "path". - props: '+JSON.stringify(e,null,2));var d=(0,i.B)(t);a=a||d,s=s||a;var p="https://github.com/Domiii/dbux/tree/master/"+t;return l.createElement("a",(0,n.Z)({title:s,href:p},c),a)}},5679:function(e,t,a){"use strict";a.d(t,{Z:function(){return l}});var n=a(7294),r=a(633);function l(e){var t=Object.assign({},e);return"darkLight"in t||(t.darkLight=!0),n.createElement(r.Z,t)}},633:function(e,t,a){"use strict";a.d(t,{Z:function(){return m}});var n=a(7462),r=a(3366),l=a(7294),i=a(4184),o=a.n(i),s=a(7037),c=a.n(s),d=a(5350),p=a(8767);var u=["src","title","zoomable","darkLight","screen","concept","className","maxWidth","mb","style"];function h(e){return e.startsWith("/")||e.includes("://")}function m(e){var t=e.src,a=e.title,i=e.zoomable,s=e.darkLight,m=e.screen,f=e.concept,g=e.className,k=e.maxWidth,v=e.mb,y=e.style,b=(0,r.Z)(e,u);f&&(t.startsWith("concept")||h(t)||(t="concepts/"+t)),m&&(t.startsWith("screen")||h(t)||(t="screens/"+t));var x=f||m||i;x&&void 0===i&&(i=!0);var N=function(e){var t=e.src,a=e.darkLight,n=(0,d.Z)().isDarkTheme;return(0,p.Z)()+(a?n?"dark/":"light/":"")+t}({src:t,darkLight:s}),w=a=a||t;g=o()(g,{"border-screen":x,"img-crisp":x,zoomable:i});var C=l.createElement("img",(0,n.Z)({className:g,style:y,src:N,alt:w,title:a},b));if(k){k=c()(k)?k:k+"px",v=void 0===v?"mb-2":v;var T=o()(v),O={display:"inline-block",maxWidth:k,lineHeight:0};C=l.createElement("div",{className:T,style:O},C)}return C}},8640:function(e,t,a){"use strict";a.d(t,{Z:function(){return s}});var n=a(7294),r="tableOfContentsInline_0DDH",l=a(5002);var i=function(e){var t=e.toc,a=e.minHeadingLevel,i=e.maxHeadingLevel;return n.createElement("div",{className:r},n.createElement(l.Z,{toc:t,minHeadingLevel:a,maxHeadingLevel:i,className:"table-of-contents",linkClassName:null}))},o={display:"none"};function s(e){var t=e.toc;return n.createElement("div",{style:o},n.createElement(i,{toc:t}))}},1333:function(e,t,a){"use strict";a.d(t,{Z:function(){return d}});var n=a(7294),r=a(8767),l="acg",i="background/debugging",o={cgrs:"cgr","call graph root":"cgr","call graph roots":"cgr",aes:"ae","asynchronous event":"ae","asynchronous events":"ae","asynchronous call graph":"acg","race conditions":"race condition"},s={"call graph":"dbux-features/call-graph",acg:l,cgr:l,ae:l,"dynamic dynamic analysis":i,idbe:i,"race condition":"https://www.google.com/search?q=race+condition&hl=en"},c={trace:"trace",statictrace:"trace",context:"context",staticcontext:"staticContext","call graph":"call-graph",acg:"",cgr:"cgr",ae:"ae","dynamic dynamic analysis":"",idbe:""};function d(e){var t=e.term,a=e.children,l=void 0===a?t:a,i=function(e){var t=e.toLowerCase(),a=s[t=o[t]||t]||"advanced/terminology",n=c[t];return a||n?(n=n?"#"+n:"",""+(0,r.Z)()+a+n):null}(t);return i?n.createElement("a",{href:i,title:'lookup term: "'+t+'"'},l,n.createElement("sup",null,"\u2754")):n.createElement(n.Fragment,null,"$",l,n.createElement("span",{className:"color-gray border-gray round",title:'(could not look up "'+l+'")'},n.createElement("sup",null,"\u2753")))}},8767:function(e,t,a){"use strict";a.d(t,{Z:function(){return r}});var n=a(2263);function r(){return(0,n.Z)().siteConfig.baseUrl}},9700:function(e,t,a){"use strict";a.d(t,{B:function(){return r}});var n={"dbux-code":"Dbux VSCode Extension"};function r(e){var t=n[e];return t||(e.startsWith("dbux-")&&!e.startsWith("dbux-code")?"@dbux/"+e.substring(5):e)}},5235:function(e,t,a){"use strict";a.r(t),a.d(t,{frontMatter:function(){return u},contentTitle:function(){return h},metadata:function(){return m},toc:function(){return f},default:function(){return k}});var n=a(7462),r=a(3366),l=(a(7294),a(3905)),i=a(3755),o=a(1333),s=a(633),c=a(5679),d=a(8640),p=["components"],u={title:"Call Graph",sidebar_class_name:"sidebar-call-graph"},h='Call Graph <DarkLightImg src="tree.svg" width=',m={unversionedId:"dbux-features/call-graph",id:"dbux-features/call-graph",title:"Call Graph",description:'The call graph serves as a "map of your runtime execution": it provides a bird\'s eye overview of all file and function executions.',source:"@site/content/dbux-features/10-call-graph.mdx",sourceDirName:"dbux-features",slug:"/dbux-features/call-graph",permalink:"/dbux/dbux-features/call-graph",editUrl:"https://github.com/Domiii/dbux/blob/master/docs/content/dbux-features/10-call-graph.mdx",tags:[],version:"current",sidebarPosition:10,frontMatter:{title:"Call Graph",sidebar_class_name:"sidebar-call-graph"},sidebar:"tutorialSidebar",previous:{title:"Global View",permalink:"/dbux/dbux-features/global"},next:{title:"ACG: Asynchronous Call Graph",permalink:"/dbux/acg"}},f=[{value:"Why do we need a Call Graph?",id:"why-do-we-need-a-call-graph",children:[],level:2},{value:"Synchronous Call Graph",id:"sync",children:[],level:2},{value:"Asynchronous Call Graph",id:"async",children:[],level:2},{value:"Call Graph vs. Call Stack",id:"stack",children:[],level:2},{value:"Example 1: fibonacci graph vs. stack",id:"acs-example1",children:[],level:2},{value:"Example 2: sequelize stack",id:"acs-example2",children:[],level:2},{value:"Toolbar",id:"toolbar",children:[{value:"Sync/Async Mode Toggle",id:"syncasync-mode-toggle",children:[],level:3},{value:"detail",id:"detail",children:[],level:3},{value:"stack",id:"stack",children:[],level:3},{value:"loc",id:"loc",children:[],level:3},{value:"call",id:"call",children:[],level:3},{value:"val",id:"val",children:[],level:3},{value:"thin mode",id:"thin-mode",children:[],level:3},{value:"\ud83d\udd0d search",id:"-search",children:[],level:3},{value:"follow",id:"follow",children:[],level:3},{value:"pause/resume/clear",id:"pauseresumeclear",children:[{value:'<span className="color-red">\ud83d\udd34</span> pause/resume',id:"-pauseresume",children:[],level:4},{value:"<code>x</code> Clear (show/hide already recorded traces)",id:"x-clear-showhide-already-recorded-traces",children:[],level:4}],level:3}],level:2},{value:"Call Graph Colors",id:"color-scheme",children:[],level:2},{value:"Call Graph Implementation Details",id:"call-graph-implementation-details",children:[],level:2}],g={toc:f};function k(e){var t=e.components,a=(0,r.Z)(e,p);return(0,l.kt)("wrapper",(0,n.Z)({},g,a,{components:t,mdxType:"MDXLayout"}),(0,l.kt)("h1",{id:"call-graph-"},"Call Graph ",(0,l.kt)(c.Z,{src:"tree.svg",width:56,mdxType:"DarkLightImg"})),(0,l.kt)(d.Z,{toc:f,mdxType:"TOC"}),(0,l.kt)("p",null,'The call graph serves as a "map of your runtime execution": it provides a bird\'s eye overview of all file and function executions.'),(0,l.kt)("h2",{id:"why-do-we-need-a-call-graph"},"Why do we need a Call Graph?"),(0,l.kt)("p",null,"An interactive call graph allows investigating the control flow of your application. For example, it lets you:"),(0,l.kt)("ul",null,(0,l.kt)("li",{parentName:"ul"},"Identify all ",(0,l.kt)(o.Z,{term:"ae",mdxType:"Term"},"asynchronous events")," and their connections."),(0,l.kt)("li",{parentName:"ul"},"Visualize ",(0,l.kt)("a",{parentName:"li",href:"#acs-example1"},"recursion trees"),"."),(0,l.kt)("li",{parentName:"ul"},"...and more...")),(0,l.kt)("p",null,'As an analogy, the call graph can be seen as a high-level "Map" while the ',(0,l.kt)("a",{parentName:"p",href:"#trace-details"},"trace details view"),' is a low-level "Street View" of our applications\' execution. Together, they offer a multi-resolutional interactive tool to investigate control flow and many other aspects of runtime behavior.'),(0,l.kt)("h2",{id:"sync"},"Synchronous Call Graph"),(0,l.kt)(s.Z,{screen:!0,src:"dbux-all-longest-word.png",mdxType:"Img"}),(0,l.kt)("p",null,"When investigating an application without any ",(0,l.kt)(o.Z,{term:"ae",mdxType:"Term"},"asynchronous events"),", the call graph is best viewed in ",(0,l.kt)("inlineCode",{parentName:"p"},"Sync")," mode."),(0,l.kt)("p",null,"The synchronous call graph has the following properties:"),(0,l.kt)("ul",null,(0,l.kt)("li",{parentName:"ul"},(0,l.kt)("strong",{parentName:"li"},"Roots"),': By default, the synchronous call graph shows a list of all root nodes (or "',(0,l.kt)(o.Z,{term:"CGR",mdxType:"Term"},"call graph roots"),'" or "CGRs"): the entry point of the application, as well as the starting point of any ',(0,l.kt)(o.Z,{term:"asynchronous event",mdxType:"Term"}),", vertically sorted by time of recording (later is lower)."),(0,l.kt)("li",{parentName:"ul"},(0,l.kt)("strong",{parentName:"li"},"Nodes"),": ",(0,l.kt)(o.Z,{term:"CGR",mdxType:"Term"},"CGRs")," can have children and entire ",(0,l.kt)("strong",{parentName:"li"},"subtrees"),'. Each child node represents the execution of a file or function that was called by its parent node. Conventionally, each node is referred to as a "stack frame", but we felt that that terminology is confusing in the context of the more general call graph. We usually refer to these nodes as ',(0,l.kt)(o.Z,{term:"context",mdxType:"Term"},"contexts")," instead."),(0,l.kt)("li",{parentName:"ul"},(0,l.kt)("strong",{parentName:"li"},"Real-time"),": The call graph updates in real-time. A new ",(0,l.kt)(o.Z,{term:"CGR",mdxType:"Term"},"CGR")," is added to the graph, for each newly recorded asynchronous event.")),(0,l.kt)("p",null,"Non-empty nodes have two of three buttons to their left in order to expand and collapse children and/or entire subtrees."),(0,l.kt)("div",{className:"flex flex-col flex-center"},(0,l.kt)(s.Z,{screen:!0,src:"call_graph_1_one_root.png",maxWidth:300,mb:"",mdxType:"Img"}),(0,l.kt)("div",{className:"font-size-3"},"\u2193"),(0,l.kt)(s.Z,{screen:!0,src:"call_graph_2_expanded.png",maxWidth:400,mdxType:"Img"})),(0,l.kt)("p",null,"Above screenshots: (1) the call graph has a single collapsed root. (2) The entire subtree is expanded."),(0,l.kt)("h2",{id:"async"},"Asynchronous Call Graph"),(0,l.kt)("p",null,"In ",(0,l.kt)("inlineCode",{parentName:"p"},"Async")," mode, the call graph becomes the ",(0,l.kt)("a",{parentName:"p",href:"/dbux/acg"},"asynchronous call graph")," (short: ACG), which is explained on ",(0,l.kt)("a",{parentName:"p",href:"/dbux/acg"},"the next page"),"."),(0,l.kt)("h2",{id:"stack"},"Call Graph vs. Call Stack"),(0,l.kt)("p",null,"The ",(0,l.kt)("strong",{parentName:"p"},"call stack")," is the list of all stack frames at a current point in time. That means: all executed functions that have not yet concluded and are not currently suspended",(0,l.kt)("sup",null,(0,l.kt)("span",{className:"cursor-help",title:"e.g. by await or yield"},"?")),". While useful, the call stack only represents a small fraction of our application. In fact, the call stack can be defined as a slice of the call graph during its ",(0,l.kt)("a",{parentName:"p",href:"https://en.wikipedia.org/wiki/Depth-first_search"},"depth-first traversal"),", at a specific point in time."),(0,l.kt)("h2",{id:"acs-example1"},"Example 1: fibonacci graph vs. stack"),(0,l.kt)("p",null,"Example: The following screenshot shows call graph and stack of ",(0,l.kt)("inlineCode",{parentName:"p"},"fibonacci(6)"),"."),(0,l.kt)(s.Z,{screen:!0,src:"sample-fibonacci-graph-vs-stack.png",mdxType:"Img"}),(0,l.kt)("ul",null,(0,l.kt)("li",{parentName:"ul"},"The stack is shown on the right."),(0,l.kt)("li",{parentName:"ul"},"The call graph (left) also reveals the (non-asynchronous) stack (nested toward the right). You can find all stack frames by going up the parents from the selected node in the graph."),(0,l.kt)("li",{parentName:"ul"},"In this recursive example, the call graph also serves as ",(0,l.kt)("a",{parentName:"li",href:"https://www.google.com/search?q=recursion+trees"},"recursion tree"),".")),(0,l.kt)("h2",{id:"acs-example2"},"Example 2: sequelize stack"),(0,l.kt)("p",null,"Lack of a proper asynchronous call stack (ACS) has been frequently lamented by developers",(0,l.kt)("sup",{parentName:"p",id:"fnref-1"},(0,l.kt)("a",{parentName:"sup",href:"#fn-1",className:"footnote-ref"},"1")),".\nThat is why Dbux offers a dedicated ",(0,l.kt)("strong",{parentName:"p"},"call stack view"),". In ",(0,l.kt)("a",{parentName:"p",href:"#acs-example1"},"Example 1"),", the call stack can be relatively easily understood from the call graph view alone. But there are many scenarios where a dedicated call stack view is still necessary, especially in case of long-winded, asynchronous control flows."),(0,l.kt)("p",null,"For example, ",(0,l.kt)("a",{parentName:"p",href:"https://github.com/sequelize/sequelize/issues/8199"},"sequelize issue #8199")," demonstrates how inadequate support for asynchronous execution in modern JavaScript engines and debuggers asynchronous execution is a real concern. If an error arises, the developer has no easy way of finding the sequelize call that caused it because the execution stack is missing asynchronous nodes. The Dbux call stack attempts to address that issue:"),(0,l.kt)(s.Z,{screen:!0,src:"sequelize-acs-full.png",mdxType:"Img"}),(0,l.kt)("p",null,"Above screenshot shows the asynchronous call stack of an Error captured when executing sequelize's ",(0,l.kt)("a",{parentName:"p",href:"https://sequelize.org/master/manual/model-querying-finders.html#-code-findorcreate--code-"},"findOrCreate"),".\nNote that the method called by the user ",(0,l.kt)("inlineCode",{parentName:"p"},"Model.findOrCreate")," is prominently displayed near the top of the stack."),(0,l.kt)("h2",{id:"toolbar"},"Toolbar"),(0,l.kt)("p",null,"The toolbar allows changing how the call graph is displayed."),(0,l.kt)("h3",{id:"syncasync-mode-toggle"},"Sync/Async Mode Toggle"),(0,l.kt)("p",null,"Toggles between ",(0,l.kt)("a",{parentName:"p",href:"#sync"},"Sync")," and ",(0,l.kt)("a",{parentName:"p",href:"#async"},"Async")," mode."),(0,l.kt)("h3",{id:"detail"},"detail"),(0,l.kt)("p",null,(0,l.kt)("strong",{parentName:"p"},"Async"),": In ",(0,l.kt)("inlineCode",{parentName:"p"},"async")," mode, disabling ",(0,l.kt)("inlineCode",{parentName:"p"},"details")," visually compacts the graph. This is used to better expose high-level patterns between ",(0,l.kt)(o.Z,{term:"CGR",mdxType:"Term"},"CGRs"),'. One can better see the "big picture" by disabling ',(0,l.kt)("inlineCode",{parentName:"p"},"details")," and then zooming out."),(0,l.kt)("p",null,(0,l.kt)("strong",{parentName:"p"},"Sync"),": ",(0,l.kt)("inlineCode",{parentName:"p"},"details")," currently does nothing in ",(0,l.kt)("inlineCode",{parentName:"p"},"Sync")," mode."),(0,l.kt)("h3",{id:"stack"},"stack"),(0,l.kt)("p",null,"Toggles the ",(0,l.kt)("a",{parentName:"p",href:"#stack"},"asynchronous stack"),"."),(0,l.kt)("h3",{id:"loc"},"loc"),(0,l.kt)("p",null,"Show/hide locations in context nodes."),(0,l.kt)("h3",{id:"call"},"call"),(0,l.kt)("p",null,(0,l.kt)("strong",{parentName:"p"},"Sync"),': Show/hide caller traces of all contexts that are function invocations. This allows to quickly understand how a context node ("stack frame") was called.'),(0,l.kt)("h3",{id:"val"},"val"),(0,l.kt)("p",null,"Show/hide ",(0,l.kt)("inlineCode",{parentName:"p"},"value")," in context nodes."),(0,l.kt)("p",null,(0,l.kt)("strong",{parentName:"p"},"Sync"),": In synchronous mode, it shows ",(0,l.kt)("inlineCode",{parentName:"p"},"(arguments) -> returnValue")," of the context's call expression."),(0,l.kt)("p",null,(0,l.kt)("strong",{parentName:"p"},"Async"),": In asynchronous mode, it shows the value of the first trace of the currently selected trace in each root. Among other uses, this allows you identifying the roots that executed the selected trace's code and what the value of that root was. This in turn can be used to better understand the main purpose of different roots, if the right trace is selected. (TODO: examples)"),(0,l.kt)("h3",{id:"thin-mode"},"thin mode"),(0,l.kt)("p",null,(0,l.kt)("strong",{parentName:"p"},"Sync"),": Enable to render a horizontally more compact graph."),(0,l.kt)("p",null,(0,l.kt)("strong",{parentName:"p"},"Async"),": Does not do anything in async mode currently."),(0,l.kt)("h3",{id:"-search"},"\ud83d\udd0d search"),(0,l.kt)("p",null,"\u2192"," See ",(0,l.kt)("a",{parentName:"p",href:"/dbux/dbux-features/search"},"the search section")," for more information."),(0,l.kt)("h3",{id:"follow"},"follow"),(0,l.kt)("p",null,"When ",(0,l.kt)("inlineCode",{parentName:"p"},"follow")," mode is activated, the call graph always zooms in on the call graph node of the currently ",(0,l.kt)("a",{parentName:"p",href:"/dbux/dbux-features/select-trace"},"selected trace"),"."),(0,l.kt)("h3",{id:"pauseresumeclear"},"pause/resume/clear"),(0,l.kt)("p",null,"These features let you isolate the part of the call graph responsible for executing specific events (such as clicking a buggy button), while removing (hiding) all kinds of unrelated clutter."),(0,l.kt)("h4",{id:"-pauseresume"},(0,l.kt)("span",{className:"color-red"},"\ud83d\udd34")," pause/resume"),(0,l.kt)("p",null,"Use the \ud83d\udd34 button to pause/resume the rendering of new incoming data, so we can focus on what we already have.\nThis is useful to prevent cluttering the call graph with events that get recorded once we have recorded the bug (or other event of interest)."),(0,l.kt)("p",null,'For example, when investigating a bug that happens after pressing some button (a "buggy button" if you will) in your application, you can:'),(0,l.kt)("ol",null,(0,l.kt)("li",{parentName:"ol"},'Wait for the application to finish initialization and for the "buggy button" to show up.'),(0,l.kt)("li",{parentName:"ol"},"Press ",(0,l.kt)("inlineCode",{parentName:"li"},"x"),"."),(0,l.kt)("li",{parentName:"ol"},"Press a buggy button."),(0,l.kt)("li",{parentName:"ol"},"(if necessary) Wait until the bug occurs."),(0,l.kt)("li",{parentName:"ol"},"Press \ud83d\udd34 (pause).")),(0,l.kt)("div",{className:"admonition admonition-caution alert alert--warning"},(0,l.kt)("div",{parentName:"div",className:"admonition-heading"},(0,l.kt)("h5",{parentName:"div"},(0,l.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,l.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"16",height:"16",viewBox:"0 0 16 16"},(0,l.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M8.893 1.5c-.183-.31-.52-.5-.887-.5s-.703.19-.886.5L.138 13.499a.98.98 0 0 0 0 1.001c.193.31.53.501.886.501h13.964c.367 0 .704-.19.877-.5a1.03 1.03 0 0 0 .01-1.002L8.893 1.5zm.133 11.497H6.987v-2.003h2.039v2.003zm0-3.004H6.987V5.987h2.039v4.006z"}))),"caution")),(0,l.kt)("div",{parentName:"div",className:"admonition-content"},(0,l.kt)("p",{parentName:"div"},'You might be tempted into thinking that pausing with this button will stop all recording, however that is not what happens. Currently, Dbux keeps on recording for as long as the application is running. This button only hides that new data behind a single "Hidden Node". That inability to completely pause recording, can make things very slow and thus make debugging of games and other kinds of high performance applications very difficult. ',(0,l.kt)("a",{parentName:"p",href:"https://github.com/Domiii/dbux/tree/master/#performance"},"You can read more about performance considerations here"),"."))),(0,l.kt)("h4",{id:"x-clear-showhide-already-recorded-traces"},(0,l.kt)("inlineCode",{parentName:"h4"},"x")," Clear (show/hide already recorded traces)"),(0,l.kt)("p",null,"The clear button (",(0,l.kt)("inlineCode",{parentName:"p"},"x"),") is useful for removing clutter when investigating a bug that does not appear immediately, or is not part of the initialization routine."),(0,l.kt)("h2",{id:"color-scheme"},"Call Graph Colors"),(0,l.kt)("p",null,"Node colors are assigned pseudo-randomly. Same color means same ",(0,l.kt)(o.Z,{term:"staticContext",mdxType:"Term"})," (same function/file)."),(0,l.kt)("h2",{id:"call-graph-implementation-details"},"Call Graph Implementation Details"),(0,l.kt)("p",null,"A few more notes on the Call Graph GUI implementation:"),(0,l.kt)("ul",null,(0,l.kt)("li",{parentName:"ul"},"The Call Graph is implemented as a ",(0,l.kt)("a",{parentName:"li",href:"https://code.visualstudio.com/api/extension-guides/webview"},"VSCode WebView"),".",(0,l.kt)("ul",{parentName:"li"},(0,l.kt)("li",{parentName:"ul"},"Inside of ",(0,l.kt)("inlineCode",{parentName:"li"},"dbux-code"),", the graph is defined in ",(0,l.kt)(i.Z,{path:"dbux-code/src/webViews/graphWebView.js",mdxType:"CodeLink"})))),(0,l.kt)("li",{parentName:"ul"},"The Call Graph consists of three modules:",(0,l.kt)("ul",{parentName:"li"},(0,l.kt)("li",{parentName:"ul"},(0,l.kt)(i.Z,{path:"dbux-graph-common",mdxType:"CodeLink"})),(0,l.kt)("li",{parentName:"ul"},(0,l.kt)(i.Z,{path:"dbux-graph-client",mdxType:"CodeLink"})),(0,l.kt)("li",{parentName:"ul"},(0,l.kt)(i.Z,{path:"dbux-graph-host",mdxType:"CodeLink"})))),(0,l.kt)("li",{parentName:"ul"},"Client and host are running in separate runtimes. They share the ",(0,l.kt)("inlineCode",{parentName:"li"},"graph-common")," module.",(0,l.kt)("ul",{parentName:"li"},(0,l.kt)("li",{parentName:"ul"},"For a better call graph experience, we developed an IPC-first component system to easily render things on the client, while allowing us to control it from the host. Its implementation can be found in the three modules' ",(0,l.kt)("inlineCode",{parentName:"li"},"src/componentLib")," folders."),(0,l.kt)("li",{parentName:"ul"},"Theoretically, the client can also be rendered independent of VSCode, on a website, in an iframe etc.",(0,l.kt)("ul",{parentName:"li"},(0,l.kt)("li",{parentName:"ul"},(0,l.kt)("inlineCode",{parentName:"li"},"client")," and ",(0,l.kt)("inlineCode",{parentName:"li"},"host")," communicate via a ",(0,l.kt)("inlineCode",{parentName:"li"},"IpcAdapter")," which must provide two functions (whose implementation depends on the environment that they run in): ",(0,l.kt)("inlineCode",{parentName:"li"},"onMessage")," and ",(0,l.kt)("inlineCode",{parentName:"li"},"postMessage"),"."),(0,l.kt)("li",{parentName:"ul"},"The custom client would require its own ",(0,l.kt)("inlineCode",{parentName:"li"},"IpcAdapter")," implementation. ",(0,l.kt)("inlineCode",{parentName:"li"},"dbux-code"),"'s can be found in ",(0,l.kt)(i.Z,{path:"dbux-code/src/codeUtil/WebviewWrapper.js",mdxType:"CodeLink"}),".")))))),(0,l.kt)("div",{className:"footnotes"},(0,l.kt)("hr",{parentName:"div"}),(0,l.kt)("ol",{parentName:"div"},(0,l.kt)("li",{parentName:"ol",id:"fn-1"},(0,l.kt)("a",{parentName:"li",href:"https://github.com/nodejs/node/issues/36126"},"GitHub Issue: Incomplete async stack traces in Node.js"),(0,l.kt)("a",{parentName:"li",href:"#fnref-1",className:"footnote-backref"},"\u21a9")))))}k.isMDXComponent=!0},4184:function(e,t){var a;!function(){"use strict";var n={}.hasOwnProperty;function r(){for(var e=[],t=0;t<arguments.length;t++){var a=arguments[t];if(a){var l=typeof a;if("string"===l||"number"===l)e.push(a);else if(Array.isArray(a)){if(a.length){var i=r.apply(null,a);i&&e.push(i)}}else if("object"===l)if(a.toString===Object.prototype.toString)for(var o in a)n.call(a,o)&&a[o]&&e.push(o);else e.push(a.toString())}}return e.join(" ")}e.exports?(r.default=r,e.exports=r):void 0===(a=function(){return r}.apply(t,[]))||(e.exports=a)}()},2705:function(e,t,a){var n=a(5639).Symbol;e.exports=n},4239:function(e,t,a){var n=a(2705),r=a(9607),l=a(2333),i=n?n.toStringTag:void 0;e.exports=function(e){return null==e?void 0===e?"[object Undefined]":"[object Null]":i&&i in Object(e)?r(e):l(e)}},1957:function(e,t,a){var n="object"==typeof a.g&&a.g&&a.g.Object===Object&&a.g;e.exports=n},9607:function(e,t,a){var n=a(2705),r=Object.prototype,l=r.hasOwnProperty,i=r.toString,o=n?n.toStringTag:void 0;e.exports=function(e){var t=l.call(e,o),a=e[o];try{e[o]=void 0;var n=!0}catch(s){}var r=i.call(e);return n&&(t?e[o]=a:delete e[o]),r}},2333:function(e){var t=Object.prototype.toString;e.exports=function(e){return t.call(e)}},5639:function(e,t,a){var n=a(1957),r="object"==typeof self&&self&&self.Object===Object&&self,l=n||r||Function("return this")();e.exports=l},1469:function(e){var t=Array.isArray;e.exports=t},7005:function(e){e.exports=function(e){return null!=e&&"object"==typeof e}},7037:function(e,t,a){var n=a(4239),r=a(1469),l=a(7005);e.exports=function(e){return"string"==typeof e||!r(e)&&l(e)&&"[object String]"==n(e)}}}]);