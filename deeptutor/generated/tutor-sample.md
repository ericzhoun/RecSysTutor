# Grounded tutor sample — DeepTutor `chat` over the course

Command:
    deeptutor run chat "In two sentences, why is logQ correction needed in two-tower retrieval? Ground it in the course notes." --kb recsys-course -t rag

Retrieved 9030 characters of grounded context from the `recsys-course` knowledge base.

**Answer**
In two-tower retrieval, the in-batch negatives used for the sampled-softmax loss are drawn from the training batch rather
than from the true item corpus distribution, so popular items are over-represented as negatives and the gradient is
biased. Subtracting log q(i) — the estimated sampling probability of each item — corrects this bias by restoring the
weighting the loss would have had under the true distribution.

session=unified_1790052489360_9ee5107c  capability=chat  rounds=1  tokens=5.2k  cost=$0.0009
