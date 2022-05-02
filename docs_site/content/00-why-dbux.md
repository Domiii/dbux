---
slug: /
# path: why-dbux
---


TODO: change "Why Dbux?" to "00-Dbux-Overview" (move from nested folder)
  → re-write this as visual intro to Dbux
  → give a clearer picture of what it can do and which scenarios work and which won't
    → limitations
      → e.g. issues w/ react and performance
    → future work: list of all directly and indirectly tested/experimented packages




# Dbux: What and Why?

import Img from '@src/components/Img';
import Term from '@src/components/Term';
import CodeLink from '@src/components/CodeLink';


Dbux is an integrated debugging environment (IDbE) and omniscient debugger for JavaScript dynamic analysis. We hope to help developers (i) improve program comprehension and (ii) increase debugging efficiency. To that end, Dbux records an application's runtime data, visualizes it and makes it interactive.

<Img screen src="dbux-all-async1.png" />

The screenshot above demonstrates several of Dbux's features, including:

* Left: [omni-directional navigation, values, executions](./dbux-features/30-trace-details.mdx) and [data flow](./dbux-features/50-data-flow.mdx).
* Middle: [code decorations](./dbux-features/04-code-decorations.mdx) and [trace selection](./dbux-features/05-select-trace.mdx).
* Right: [asynchronous call graph](./dbux-features/20-asynchronous-call-graph.mdx).

<!-- <a href="https://www.youtube.com/watch?v=m1ANEuZJFT8" target="_blank" alt="video">
   <img width="150px" src="https://img.youtube.com/vi/m1ANEuZJFT8/0.jpg" />
</a> -->


## Video Introduction

To get a good first impression of Dbux, we recommend this video. It...:

* → explains why we need better Debuggers,
* → demonstrates all of Dbux's tools with plenty of examples,
* → is fully timestamped (if you are impatient, we recommend taking a quick glimpse by skipping around a bunch).

[![Video Introduction](https://img.youtube.com/vi/N9W6rhHMKbA/0.jpg)](https://www.youtube.com/watch?v=N9W6rhHMKbA)



## Why Dbux?

<!-- https://docusaurus.io/docs/next/markdown-features/admonitions
:::caution -->

I (Dominik) started this project on 11/16/2019 because I felt that after programming/designing software, and debugging for 20 years, I have not fully mastered my craft. This became particularly apparent during problem solving sessions with clients, when I'm rather, or at least quite, unfamiliar with the code. Being stuck for 30 minutes or longer to locate a single bug was not a rare occasion. I felt like I was lacking something, lacking an approach, lacking strategy, and also lacking a sufficiently deep understanding of the semantics of the program at hand. It was this frustration that lead me on the journey to build Dbux.

I started to realize that I wanted to be able to answer (seemingly always the same type of) questions, like: How did THAT happen? Where did THAT data come from? Where did the execution take THAT turn?

I wanted to be able to more easily **see** (not just [guess/assume/theorize/conjecture/suppose/opine/test/prod/verify](https://www.thesaurus.com/browse/guess)) what is going on. I wanted to interact more with the runtime structure, not just indirectly through print statements, or one single small step at a time. I wanted to see the whole thing, zoom in and out, whenever necessary be able to zoom in real close, and then interact with it in order to investigate some of the non-obvious connections from where I am to where the bug is.

The goal was clear: collect all relevant run-time data, record it and make it easily accessible. And thus, Dbux was born. 

We (Dominik and Michael) believe that Dbux does NOT make someone good at debugging. However, it can help better see (and appreciate?) what is going on in our applications by revealing the hidden structures beneath it. What you do with that information, is up to you! Luckily, it is (speaking from a rather biased position) kinda fun to interact with Dbux to poke around the actual recorded behavior of the code, navigating along the connections, and uncovering interesting little insights into what is actually going on in our applications. It is at least more fun (or so we feel) than just staring at the code guessing, more fun than adding/removing print/console statements, and more fun than waiting for the debugging session to re-start for the 5th time, after overshooting a crucial line of code yet again.



## Dbux Features

<!-- TODO: make this part bigger and more visual -->

Once an application has executed with [Dbux enabled](./dbux-features/02-enable-dbux.mdx), a collection of analytical tools is available via the [Dbux VSCode Extension](./tools-and-configuration/01-dbux-code.mdx), including:

* Dbux's [global view](./dbux-features/07-global.mdx) lists third-party modules, files and console log events. Takes user to the relevant code in a single click.
  * NOTE: While this eliminates the need for most of "[print-based debugging](https://www.google.com/search?q=print-based+debugging&hl=en)", it does not replace use of [proper logging](https://www.google.com/search?q=logging+programming+best+practices).
* [Trace selection](./dbux-features/05-select-trace.mdx) and the [Trace Details view](./dbux-features/30-trace-details.mdx) allow overviewing and investigating all executions of any piece of code and their respective values.
* Instead of only a call stack, Dbux presents us with the entire [call graph](./dbux-features/08-call-graph.mdx).
  * A complete [asynchronous call stack](./dbux-features/08-call-graph.mdx#stack) is also available.
* Instead of using the traditional debugger as a "magnifying glass" to slowly crawl along the execution timeline, Dbux offers random-access [navigation](./dbux-features/30-trace-details.mdx#navigation), in both directions of the timeline.
* [Code decorations](./dbux-features/04-code-decorations.mdx) can make it a lot more obvious what code executed at all, and how.
* Executed files, functions and values [can be searched](./dbux-features/40-search.mdx) for/through (culls a lot of noise when compared to code-based search).
* [Data flow analysis](./dbux-features/50-data-flow.mdx) allows us to quickly trace the reads, writes and creation of a selected value. This can also take us to the place of creation of a value in a single click.

## Call to Action

If you are so inclined, please check out Dbux, and feel free to bombard me with any questions, complaints, any kind of feedback. I would greatly appreciate it!

## Word of Caution: ALPHA Phase!

Dbux is currently still in ALPHA. While we have been testing it on many small <CodeLink path="samples" /> and <CodeLink path="dbux-projects/src/projects" >several real-world projects</CodeLink>, there is always a chance, that the next one does not exactly work the way it should. For example, tracing the internals of `react` is currently (01/2022) [bugged](https://github.com/Domiii/dbux/issues/640).

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



