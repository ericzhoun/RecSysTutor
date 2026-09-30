# #15 Near real-time personalization at LinkedIn.

*Machine Learning at Scale collection — Ludovico Bessi, 2023-04-09 · topic: recsys*

[](../assets/d40e277de8bf5f24.jpg)

# Table of contents

  1. **Introduction.**

  2. **Past actions affect personalized recommendations with delay.**

  3. **Leveraging actions in near real-time to adapt recommendations.**

  4. **Results.**

# Introduction

In today's article, I will talk about LinkedIn transitioned from an offline update to a near real-time update of features for recommender systems that power website personalization.

* * *

# Past actions affect personalized recommendations with delay.

These action events are periodically logged an offline data store.

A batch job periodically reads the activity data of all members in this offline store and processes the data into features.

These features are then pushed to an online store.

When a member lands on a page that contains a recommendations module, the corresponding recommender system reads features from the online features store and uses them in a model to score candidate recommendation items and return recommendations ordered by their scores.

The problem with this flow is that the Online features used in the Recommender system are not updated in real time.

Depending on the schedule of the batch job and the computational time of pipeline, it could be days before the inputs are updated.

* * *

# Leveraging actions in near real-time to adapt recommendations.

[](../assets/5a1150a5ced380b2.png)

An example of an element stored in an "Attributes stores" would be the attributes of each job: such as its embeddings and/or geographic location where it's based.

Interestingly, the Online store only retains data for the past 96h. This is mainly to keep the size of the store manageable.

Observe that as input we have both the "Attributes stores" and the "Online store": the two inputs need to be joined in non trivial ways. The online store may contain an action related to a particular geolocation, but the embeddings of that location are stored in the Attributes stores.

The joining operation can be tricky and lead to considerations which can make or break such a system.

Sometimes it could be beneficial to join certain attributes only **after** retrieving actions from the Online store. Imagine the case where the embedding of each feed-article is a vector of dimension 1000: it might not be wise to store the embedding of each action in the Online store and instead be preferable to get those embeddings from the attributes store after getting the list of articles that a member clicked on.

Other times, it could be beneficial to have all the data available in the Online store.

The recommender system then uses these online features, alongside conventional feature pipeline (not everything HAS to be Online!) to score candidate recommendations.

These recommendations get logged for inspection and for offline training experiments.

* * *

# Results

The provided solution enables LinkedIn to:

  1. Record actions of interest in O(seconds).

  2. Retrieve actions in less than 50 ms.

The engineering effort allowed LinkedIn to improve the following business metrics:

  1. Dismisses of job recommendations: **-20%**

  2. Sessions in which members engage with feed: **+0.68%**

  3. Revenue from sponsored feed updates: **+0.46%**

If you liked this article, I believe you also like my past deep dive in TikTok recommendation system:

Machine learning at scaleLudovico Bessi

* * *

# References

  1. Near real-time features for near real-time personalization.
