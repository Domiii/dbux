---
slug: /
# path: why-dbux
---

# Dbux: What and Why?

import Img from '@src/components/Img';
import Term from '@src/components/Term';
import CodeLink from '@src/components/CodeLink';


Dbux is an integrated debugging environment (IDbE) and omniscient debugger for JavaScript runtime analysis. We hope to help developers (i) improve program comprehension and (ii) increase debugging efficiency. To that end, Dbux records an application's runtime data, visualizes it and makes it interactive.

<Img screen src="dbux-all-async1.png" />

The screenshot above demonstrates several of Dbux's features, including: omni-directional navigation, values, executions, data flow (left), code decorations and trace selection (middle), asynchronous call graph (right).

[This (slightly outdated) video](https://www.youtube.com/watch?v=m1ANEuZJFT8) [20 min] <span className="color-gray"></span> explains how Dbux came to be and shows two basic examples of how to use a subset of its features.
<!-- <a href="https://www.youtube.com/watch?v=m1ANEuZJFT8" target="_blank" alt="video">
   <img width="150px" src="https://img.youtube.com/vi/m1ANEuZJFT8/0.jpg" />
</a> -->


## Why Dbux?

<!-- https://docusaurus.io/docs/next/markdown-features/admonitions
:::caution -->

I (Dominik) started this project on 11/16/2019 because I felt that after programming/designing software, and debugging for 20 years, I have not fully mastered my craft. This became particularly apparent during problem solving sessions with clients, that is when being rather, or at least quite, unfamiliar with the code. Being stuck for 30 minutes or longer to locate a single bug was not a rare occasion. I felt like I was lacking something, lacking an approach, lacking strategy, and also lacking a sufficiently deep understanding of the semantics of the program at hand. It was this frustration that lead me on the journey to build Dbux.

Most importantly, I wanted to be able to answer (seemingly always the same type of) questions, like: How did THAT happen? Where did THAT data come from? Where did the execution take THAT turn?

I wanted to be able to more easily **see** (not just [guess/assume/theorize/conjecture/suppose/opine/test/prod/verify](https://www.thesaurus.com/browse/guess)) what is going on. I wanted to interact more with the runtime structure, not just indirectly through print statements, or one single small step at a time. I wanted to see the whole thing, zoom in and out, whenever necessary be able to zoom in real close, and then interact with it in order to investigate some of the non-obvious connections from where I am to where the bug is.

We (Dominik and Michael) believe that Dbux does NOT make someone good at debugging. However, it can help better see (and appreciate?) what is going on in our applications by revealing the hidden structures beneath it. What you do with that information, is up to you!



## Dbux Features

<!-- TODO: make this part bigger and more visual -->

Once an application has executed with [Dbux enabled](./runtime-analysis/02-enable-dbux.mdx), a collection of analytical tools is available via the [Dbux VSCode Extension](./tools-and-configuration/01-dbux-code.mdx):

* Dbux's [global view](./runtime-analysis/07-global.mdx) lists third-party modules, files and console log events. Takes user to the relevant code in a single click.
  * NOTE: While this eliminates the need for most of "[print-based debugging](https://www.google.com/search?q=print-based+debugging&hl=en)", it does not replace use of [proper logging](https://www.google.com/search?q=logging+programming+best+practices).
* [Trace selection](./runtime-analysis/05-select-trace.mdx) and the [Trace Details view](./runtime-analysis/30-trace-details.mdx) allow overviewing and investigating all executions of any piece of code and their respective values.
* Instead of only a call stack, Dbux presents us with the entire [call graph](./runtime-analysis/08-call-graph.mdx).
  * A complete [asynchronous call stack](./runtime-analysis/08-call-graph.mdx#call-stack) is also available when needed.
* Instead of using the traditional debugger as a "magnifying glass" to slowly crawl along the execution timeline, Dbux offers random-access [navigation](./runtime-analysis/30-trace-details.mdx#navigation), in both directions of the timeline.
* [Code decorations](./runtime-analysis/04-code-decorations.mdx) can make it a lot more obvious what code executed at all, and how.
* Executed files, functions and values [can be searched](./runtime-analysis/40-search.mdx) for/through (culls a lot of noise when compared to code-based search).
* [Data flow analysis](./runtime-analysis/50-data-flow.mdx) allows us to quickly trace the reads, writes and creation of a selected value. This can also take us to the place of creation of a value in a single click.


## Word of Caution: ALPHA Phase!

Dbux is currently still in ALPHA. While we have been testing it on many small <CodeLink path="samples" /> and <CodeLink path="dbux-projects/src/projects" >several real-world projects</CodeLink>, there is always a chance, that the next one does not exactly work the way it should. For example, tracing the internals of `react` is currently (01/2022) bugged: https://github.com/Domiii/dbux/issues/640.

If you run into any problems when using Dbux, please [let us know](https://discord.gg/8kR2a7h).

:::tip
Dbux has a bit of a learning curve. We recommend programming beginners to start with the [interactive tutorials](./dbux-practice/02-tutorial.md).

While you can certainly try to get started on your own, you are welcome to join us on [DISCORD](https://discord.gg/8kR2a7h), ask questions and complain as you go along.
:::



<!-- ### Debugging Known vs. Unknown Code

TODO -->



<!-- These days, I personally feel even when debugging without Dbux that I start by strategizing, rather than "going with my gut" and put together a priority queue of places to check, before taking the next step. -->


<!-- Debugging is a quintessential task in the day-to-day life of a software developer. Something went wrong, and it is our job to fix it. Sometimes it is something that we did, sometimes it is someone else in our team, and sometimes it is under-documented, malfunctioning behavior or a regression in a dependency. Sometimes the bug is hiding in code we have recently been working on, sometimes it is hiding in code that we have almost entirely forgotten, sometimes it is hidden in the depth of the `node_modules` folder. -->

<!-- While debugging can be tough, we can get a leg up if we have designed a decent software architecture and proper working knowledge of used technology, frameworks and libraries. But even then,  -->



