---
"@tenderly/hardhat-tenderly": patch
---

There was an issue while extracting compiler version from the contracts that were given for verification.
We extracted these configurations on our own, thus providing the first compiler configuration that is suitable for a file without minding the dependencies because at the time of implementation of this logic, there weren't any hardhat tasks that could do such things.

Now, there is a task that can get a compiler job for a given file.
A compiler job is hardhats' concept for all the data that is needed for compilation of contracts. It has all the dependencies and the configuration of the compiler.

We used this task to obtain the compiler job and send it to the backend, after which the problem was fixed.
