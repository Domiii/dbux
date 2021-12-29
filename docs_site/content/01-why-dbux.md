---
slug: /
# path: why-dbux
---

# Dbux: What and Why?

Dbux is an integrated debugging environment (IDbE) and omniscient debugger for JavaScript runtime analysis. We hope to help developers (i) improve program comprehension and (ii) increase debugging efficiency. To that end, Dbux records an application's runtime data, visualizes it and makes it interactive.

TODO(improve + add architectural diagram)

This (too long) video explains what Dbux is and features two examples of how to use the Dbux VSCode extension:

<a href="https://www.youtube.com/watch?v=m1ANEuZJFT8" target="_blank" alt="video">
   <img width="150px" src="https://img.youtube.com/vi/m1ANEuZJFT8/0.jpg" />
</a>

If you have any questions, feel free to [join us on DISCORD](https://discord.gg/QKgq9ZE).


## On Debugging

"Debugging is just plain hard." "Real programmers don't need debugging tools," skeptics say, according to Henry Lieberman[^1]. Back in 1997, in a heart-warming, informal call to arms, Lieberman envisions a future where new innovative debugging tools like his ZStep 95[^2] omniscient LISP debugger will surely become a staple of developer tool boxes around the world. 24 years later, the skeptics seem to have been proven right, and him wrong. While a lot of progress has been made in domain-specific debugging tools, commonly available general purpose debuggers are still mostly the same as back then. We also agree with Lieberman on modern computational resources, in that we can "use some of that speed and storage to process information that the programmer needs to understand what's going on in the program". 

On the plus side, some strides have been made. Coverage reporting, for example, has become standard industry practice. It uses some of that "speed and storage" to record code execution metrics in order to help developers with an important aspect of automated testing. Another example is the wide range of browser tools that especially frontend developers enjoy. Examples include the DOM inspector, the trusty network tab and many domain-specific tools that caring framework developers put in our hands, such as the React and Redux Developer tools[^3].

Imagine the manager of a large factory, running the factory based on observations from inputs and outputs, a "fax machine" and a "blueprint" alone. That is what is still happening in software development. Debugging is still commonly performed by correlating input and output events, and sometimes specialized logs (the "fax machine"), interleaved with reading and re-reading the code (the "blueprint"). To us this makes no sense. We believe that the 2020s shall finally be the time for the "next generation of debugging tools".

<!-- TODO(re-write + move this)  Some of that data comprises already existing inputs and outputs of the program, sometimes data is produced from a properly reported error, sometimes, we have next to no information, e.g. when staring at a silent console of a server that just gives us the wrong data, when looking at an empty page on the frontend or when looking at syntax errors that only occurred after webpacking/bundling. -->


## How is Dbux Different?

Debugging is an investigative process that requires the developer to spend most time making (more or less well-educated) guesses, and then spend time looking for clues, i.e. gathering and sifting data from the ill-behaved application.
When facing down most non-trivial bugs, we usually start by looking at available data (e.g. logs), followed by guessing potential places that might be at fault, before moving on to gathering more relevant data. We then sift through the gathered data in search for clues, then change our angle of attack and the data gathering to better zoom in on where we think the root cause might lie, rinse and repeat, until we figure it all out.

The traditional debugger has a special place in our hearts. It can be a fantastic tool, **if** you know where to look, and **if** the root cause is downstream from observed symptoms. Sadly, most bugs don't work like that. Often times when we observe a failure, we have to backtrack, in order to find the root cause. The traditional debugger cannot go back in time, only with it. It also does not record runtime data, only presents us with highly localized data, most prominently: surrounding expression and variable values, as well as the call-stack.

We argue: this approach to debugging is of course **not bad**. Our goal is not to denounce. Rather, we sought out to look for new ways of approaching debugging, with the hope of making parts of it *more efficient*.

Dbux is an [omniscient debugger](https://scholar.google.com/scholar?hl=en&as_sdt=0%2C5&q=omniscient+debugger), meaning it automatically gathers and visualizes your application's runtime behavior, and makes it interactive. The term "omniscient" (meaning "**all-knowing**") is a quirky exaggeration (it does not know your grandma's birthday). The things that it does know can be configured. By default, it records the beginning and end of all executed files and functions, all asynchronous events and the entire trace log, meaning (almost) all statements and expressions and their values.

All that data is then available for use to the developer, as explained in the [Using Dbux](./using-dbux) chapter.


## Advantages of Dbux:

* Instead of only a call stack, Dbux presents us with the entire [call graph](./using-dbux/call-graph). A complete asynchronous call stack is also available when needed.
* Instead of guessing which files, third-party modules, console log statements executed and how, one can overview all that in Dbux's [global view](./using-dbux/global).
* Instead of using the traditional debugger as a "magnifying glass" to slowly crawl along the execution timeline, Dbux's [trace selection](./using-dbux/select-trace), [trace details and navigation](./using-dbux/trace-details) allow random-access investigation of any piece of code and all its executions. We also threw in [code decorations](./02-using-dbux/04-code-augmentation.mdx) to help us quickly see which code executed and how.
* Dbux eliminates the need for most of "[print-based debugging](https://www.google.com/search?q=print-based+debugging&hl=en)", because it logs for us, allowing to quickly overview. It even offers [searching for executed files, functions, values and more](./using-dbux/search). Note that it is not built to replace [logging](https://www.google.com/search?q=logging+programming+best+practices).
* [Data flow analysis](./using-dbux/data-flow) allows us to quickly trace the reads, writes and creation of a selected value.




<!-- ### Debugging Known vs. Unknown Code

TODO -->


## Concluding Remarks: "Dbux vs. Debugging"

I started this project on 11/16/2019 because I felt that, after programming and designing software, and debugging for 20 years, I have not fully mastered my craft. I would sometimes be stuck for 30 minutes or longer to **locate** a single bug. This frustration has not only led to the invention of Dbux, but to an exciting journey which brought about greater appreciation and many newly gained insights into the structures of the dynamic runtime execution of a program.

These days, even when I debug without Dbux, I feel I start by strategizing, rather than "going with my gut". I am much more likely to reason about and even visualize many aspects of the structures hidden beneath each statement, including its dynamic call sub-graph and the asynchronous events it was likely to have triggered or is affected by. It is my biased opinion that Dbux can be beneficial to many developers, not just by aiding runtime analysis, but also helping us re-evaluate our approach to debugging.


<!-- Debugging is a quintessential task in the day-to-day life of a software developer. Something went wrong, and it is our job to fix it. Sometimes it is something that we did, sometimes it is someone else in our team, and sometimes it is under-documented, malfunctioning behavior or a regression in a dependency. Sometimes the bug is hiding in code we have recently been working on, sometimes it is hiding in code that we have almost entirely forgotten, sometimes it is hidden in the depth of the `node_modules` folder. -->

<!-- While debugging can be tough, we can get a leg up if we have designed a decent software architecture and proper working knowledge of used technology, frameworks and libraries. But even then,  -->

## Joining the Community

While you can certainly try to get started on your own, you probably make your life a lot easier by joining us on 
[DISCORD](https://discord.gg/8kR2a7h) and ask questions as you go along.




[^1]: Lieberman, Henry. "The debugging scandal and what to do about it." Communications of the ACM 40.4 (1997): 26-30.
[^2]: Lieberman, Henry, and Christopher Fry. "ZStep 95: A reversible, animated source code stepper." (1997).
[^3]: Redux Developer Tools. https://github.com/zalmoxisus/redux-devtools-extension