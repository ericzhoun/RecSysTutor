# #17 Uber's Offline Platform For Optimal Feature Discovery.

*Machine Learning at Scale collection — Ludovico Bessi, 2023-04-23 · topic: mlops*

[](../assets/ba5ee764da4cb79c.jpg)

  1. **Introduction**

  2. **Optimal feature discovery through a centralised Feature Store**

  3. **Results**

# Introduction

Today's topic is about feature selection.

As a Machine Learning engineer, you are tempted to ingest as many features as possible from different teams in hope to improve your model performance.

However, improving model performance by 0.1% to boost your end of quarter results by adding 20% more features (aka dependencies) is not the wisest choice.

In general, the following anti-patterns can be identified:

  * **Feature Sprawl** :**** How many times have you removed a feature in a new version of a model?

  * **Feature redundance** : How do you know the new features you are adding are worth adding?

Adding features blindly to models, lead to:

  * **Model outages** : more features means more possibility of model degradation.

  * **Increased costs and overhead** : more servers, more computing costs, more overhead in dealing with changing features and more expertise needed in understanding them.

I know what you are thinking!

"How can I trim down dependencies without hurting model performance?"

Let's see how Uber does it!

* * *

# Optimal feature discovery through a centralised Feature Store.

### Information-theoretic Feature Selection

To select features, the metric used is based on Information theory.

Assuming _S_ is te set of features, and _I(X, Y)_ is the mutual information between _X_ and _Y_ , then features can be ranked based on the Maximum Relevance, Minimum Redundance (MRMR) score:

At each stage in the feature selection, MRMR ranks all remaining features on the their relevance in a greedy manner.

### Mutual Information for the Data Warehouse

Uber employs a centralized Feature Store (Palette), which is crowdsourced from various teams across the company,

In practice, a data mining tool (X-Ray) that quantifies signals in datasets using information theoretic techniques across all Uber data! Using this tool, Machine Learning engineers can identify existing features in the Feature Store that are relevant to their models.

The article did not mention if the Feature Store is online or offline. Given its centralized nature, I'd bet It is an offline feature store. Still, pretty cool!

### Optimal Feature Discovery

[](../assets/a7e3bbd871e06a37.png)

The workflow assumes a baseline model is already trained.

First of all, the dataset is enriched with all applicable features from the Feature Store.

This step increases the total number of features into the tens of thousands (!!).

After this, the X-Ray tool employs MRMR to prune the dataset.

The model is validated by data scientist to make sure there is no data leakage or compliance issues.

At this point, competing models are trained with different numbers of top K candidate features and the best performing model is selected.

* * *

# Results

Uber improved bottom line metrics of a business critical model.

The number of features was reduced from 75 to 37, only 15 of which are from the old set of features.

A minimal set of features has also the advantage of:

  * Reducing complexity.

  * Minimizing serving latency.

  * Lowering storage cost.

  * Last but not least: **decreasing the number of dependencies to other systems.**

* * *

# References

  1. Optimal Feature Discovery: Better, Leaner Machine Learning Models Through Information Theory.
