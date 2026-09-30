# #28 Evaluating Machine Learning ranking models offline and online

*Machine Learning at Scale collection — Ludovico Bessi, 2023-07-09 · topic: recsys*

[](../assets/bff055612e9a2eba.jpg)

# Table of contents

  1. **Introduction.**

  2. **Offline ranking metrics.**

  3. **Closing thoughts.**

# Introduction

In today's article I am going to discuss how to evaluate ranking models. I find ranking models pretty interesting as they have unusual loss functions / evaluation metrics, but it is crucial to understand well how they perform. Let's get started!

* * *

# Offline ranking metrics

**Mean reciprocal rank (MRR)**

Probably the simplest metric. For each query, you look for the _first_ rank of an item relevant to the query and calculate its reciprocal value. Averaging the reciprocal values for all queries gives you the Mean reciprocal rank.

The issue with this metric is that we don't take into account the possibility that multiple relevant items are listed.

**Recall @k**

As the name suggests, this metrics measures the ratio between the number of relevant items in the output list and the total number of relevant items available in the entire dataset.

The issue with this metrics is that for large datasets, it is not a very good proxy for model quality.

**Precision @k**

This metric measures the proportion of relevant items among the top k items in the output list.

The issue with this metric is the ranking itself is not evaluate, just how many relevant items are in there.

**Mean average precision (mAP)**

This metric first computes the average precision (AP) for each output list then averages AP values.

Since the precisions are average, this time the ranking quality is considered. However, mAP is designed for binary relevances only.

**Normalized discounted cumulative gain (nDCG)**

DCG calculates the cumulative gain of items in a list by summing up the relevance score of each item. Then the score is discounted at lower ranks by applying a logarithmic factor. [1]

To get a more meaningful score, DCG is normalized by the DCG of an ideal ranking, that is a ranking ordered by the relevance scores of items.

* * *

# Online ranking metrics

**Click-through rate**

When the model moves online, the performance needs to be evaluated on the user behaviour. The most used metric is the Click-through rate, which is defined as the ratio between the number of clicked items over the total number of suggested items.

A high CTR indicates that user click on the displayed items often.

However, there is subtle issue here. Engaging with many items does not mean that the user is happy: probably on the contrary the user is maybe trying unsuccessfully to find what he/she needs. That's why it is also interesting to log how much time the user spends on the suggested image to get an understanding of the quality of a single item.

* * *

# Closing thoughts

I hope this article was useful to understand how to evaluate ranking models, both offline and online.

Choosing a good metric to verify success of your model is crucial when developing machine learning systems, otherwise it is going to be impossible to confidently say that your launch improved something.

* * *

# References

  1. A Theoretical Analysis of Normalized Discounted Cumulative Gain (NDCG)
