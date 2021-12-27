---
slug: /
path: why-dbux
---

# What is Dbux? And Why?


## On Debugging

"Debugging is just plain hard" and "real programmers don't need debugging tools", Henry Lieberman[^1] quotes skeptics who don't believe in the possibility of a new era of superior debugging tools. In 1997, in a heart-warming, informal call to arms, Lieberman envisions a future where new innovative debugging tools like his ZStep 95[^2] omniscient LISP debugger will surely become a staple of developer tool boxes around the world. 23 years later, the skeptics seem to have been proven right, and he wrong. While a lot of progress has been made in domain-specific debugging tools, commonly available general purpose debuggers are still mostly the same as back then, despite, as Liebermann continues to argue, "Computers are now fast and have large memories and disks.".

We strongly agree with Liebermann. We also believe, it is almost nonsensical not to "use some of that speed and storage to process information that the programmer needs to understand what's going on in the program". Imagine the manager of a large factory, running the factory based on observations from inputs and outputs, a "fax machine" and a "blueprint" alone. That is what is still happening. Debugging is still commonly performed by correlating input and output events, and sometimes specialized logs (the "fax machine"), interleaved with reading and re-reading the code (the "blueprint").

Debugging is an investigative process that requires the developer to spend most time making (more or less well-educated) guesses, and then spend time looking for clues, i.e. gathering and sifting data from the ill-behaved application. Some of that data comprises already existing inputs and outputs of the program, sometimes data is produced from a properly reported error, sometimes, we have next to no information, e.g. when staring at a silent console of a server that just gives us the wrong data, when looking at an empty page on the frontend or when looking at syntax errors that only occurred after webpacking/bundling.

When facing down a particularly nasty bug, often times, we start by gathering data, then sift through the findings in search for clues, and then change the data gathering to better zoom in on where we think the root cause might lie.

## How is Dbux Different?

We argue: this approach to debugging is of course not a **bad** thing. Our goal is not to denounce. Rather, we sought out to look for new ways of approaching debugging, with the hope of making some parts of it more *efficient* and, maybe, just maybe, a little more *enjoyable*.

To that end, Dbux automatically gathers, visualizes and makes interactive your application's runtime behavior, which puts in the [omniscient debugger](https://scholar.google.com/scholar?hl=en&as_sdt=0%2C5&q=omniscient+debugger) category. The term "omniscient" (meaning "**all-knowing**") is a quirky exaggeration. It does not know your grandma's birthday. It knows a lot of things though, including (and depending on configuration) beginning and end of all executed files and functions, all asynchronous events and, at its most aggressive setting, the entire trace log, meaning (almost) all statements and expressions and their values.

TODO: refs to most relevant documentation articles


### Debugging Known vs. Unknown Code

TODO

## Dbux vs. Debugging

TODO


## Concluding Remarks

I started this project (on 11/16/2019) because I felt that, after programming, designing software and solving problems for 20 years, I have mastered my craft. I would sometimes be stuck for 30 minutes or longer to **locate** a single bug. That was the point when I decided to start working on Dbux. That work has not only led to the invention of Dbux, but also to a greater appreciation and many newly gained insights into the structures of the dynamic runtime execution of a program. Even when I don't use Dbux and I see a function call that is a potential subject of analysis, I feel I am much more likely to be able to reason about and even visualize many aspects of the structures hidden beneath it, including its dynamic call sub-graph and the asynchronous events it was likely to have triggered. It is my biased opinion that Dbux can be beneficial to many developers, by not just assisting them but maybe (just maybe) even helping them strengthen their analytical capabilities.


<!-- Debugging is a quintessential task in the day-to-day life of a software developer. Something went wrong, and it is our job to fix it. Sometimes it is something that we did, sometimes it is someone else in our team, and sometimes it is under-documented, malfunctioning behavior or a regression in a dependency. Sometimes the bug is hiding in code we have recently been working on, sometimes it is hiding in code that we have almost entirely forgotten, sometimes it is hidden in the depth of the `node_modules` folder. -->

<!-- While debugging can be tough, we can get a leg up if we have designed a decent software architecture and proper working knowledge of used technology, frameworks and libraries. But even then,  -->




[^1]: Lieberman, Henry. "The debugging scandal and what to do about it." Communications of the ACM 40.4 (1997): 26-30.
[^2]: Lieberman, Henry, and Christopher Fry. "ZStep 95: A reversible, animated source code stepper." (1997).