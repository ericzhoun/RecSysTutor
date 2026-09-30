# LLM serving (3): Speculative decoding

*Machine Learning at Scale collection — Ludovico Bessi, 2025-04-20 · topic: serving*

# Introduction

In today’s article I will discuss speculative decoding which is a technique used to speed up inference of LLMs.

# Technique 3: Speculative decoding

**Speculative Decoding** achieves latency reduction _without_ modifying the target model's architecture or weights, and crucially, _without changing the exact output probability distribution_.

**Core Mechanism**

Speculative Decoding operates by using a smaller, faster **approximation model (Mq)** to propose candidate token sequences, which are then efficiently verified by the large, accurate **target model (Mp)**.

The process per decoding step is as follows:

  1. **Candidate Generation:** The faster approximation model Mq generates a short sequence of N candidate future tokens based on the current context (prefix).

  2. **Parallel Verification:** The core of the speedup lies here. The target model Mp is invoked _in parallel_ to compute the _true_ next-token probabilities for _each_ step of the sequence proposed by Mq. Specifically, N+1 forward passes of Mp are executed concurrently:

     * Mp(prefix) -> probabilities for the token after prefix

     * Mp(prefix + [guess_1]) -> probabilities for the token after prefix + guess_1

     * ...

     * Mp(prefix + [guess_1, ..., guess_N]) -> probabilities for the token after the full guessed sequence.  
This concurrent execution leverages available compute resources, often under utilized when single-token generation is memory-bandwidth bound.

  3. **Probabilistic Acceptance & Correction:** The generated candidates (guess_1 to guess_N) are validated against the probabilities computed by Mp in the previous step. This uses a sampling technique that mathematically guarantees the final output distribution matches Mp exactly:

     * For each candidate guess_i, compare its probability according to Mq (q(guess_i)) with its probability according to Mp (p(guess_i)).

     * If p(guess_i) >= q(guess_i), Mp agrees or finds the guess even more likely; the guess is accepted.

     * If p(guess_i) < q(guess_i), Mq was "overconfident." The guess is _still_ accepted, but only with probability p(guess_i) / q(guess_i). This probabilistic step is key to maintaining the original distribution.

     * Validation proceeds sequentially. If guess_i is rejected, all subsequent guesses (guess_{i+1} to guess_γ) are discarded.

  4. **Output:** The final output consists of the accepted prefix [guess_1, ..., guess_n] followed by the single token sampled in the final step. This yields between 1 and N+1 tokens per iteration, requiring only one (parallel) execution cycle of the target model Mp.

**Performance Factors & Trade-offs**

  * **Acceptance Rate (α):** The effectiveness hinges on the frequency with which Mp accepts Mq's candidates. A higher acceptance rate (meaning Mq is a better approximation of Mp for the given task) leads to more tokens generated per Mp step. This rate is intrinsically tied to the similarity between the probability distributions p(x) and q(x).

  * **Latency vs. Compute:** Speculative Decoding reduces wall-clock time (latency) by increasing parallel computation. The total number of arithmetic operations (FLOPS) _increases_ because Mp runs N+1 times concurrently per step, and computation for rejected guesses is effectively discarded.

  * **Hardware Implications:** The technique is most impactful when inference latency for Mp is dominated by memory bandwidth (loading weights, activations) rather than raw compute. In such scenarios, executing multiple Mp instances in parallel might not proportionally increase the step time, allowing the theoretical speedup to be realized.

  * **Model Selection (Mq) & γN:** Choosing Mq involves a trade-off. A very small Mq has negligible latency but may yield a low acceptance rate.   
A larger Mq might increase the acceptance rate but adds its own latency.

The number of guesses (N) also needs tuning; too few limits potential gains, too many increases Mq overhead and Mp parallelism requirements. Empirically, Mq models roughly two orders of magnitude smaller than Mp often provide a good balance.

**Key Advantages:**

  * **Preserves Output Distribution:** Guarantees statistically identical outputs to the original target model.

  * **No Retraining Required:** Works with existing, off-the-shelf model checkpoints for both Mp and Mq.

  * **No Architecture Modification:** Does not require changes to the target model's structure.

  * **Deployment Simplicity:** Offers a potentially straightforward way to accelerate existing deployments if computational overhead is acceptable and parallelism is feasible.

**Limitations:**

  * Increases total arithmetic operations (FLOPS).

  * Requires sufficient parallel compute capacity relative to memory bandwidth to translate theoretical gains into walltime reduction.

# Technique 4: Disaggregated serving

I will be closing this series with Disaggregated serving next week

# References

  1. Speculative decoding
