---
title: "[RecSys] Part 1: Intro and common blind spots"
subtitle: "aka let's begin the month of RecSys! :)"
date: 2025-08-03
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [recsys]
series: "RecSys series"
paywalled: false
words: 982
---

# [RecSys] Part 1: Intro and common blind spots

*aka let's begin the month of RecSys! :)*

*aka let's begin the month of RecSys! :)*

[![](../assets/cb0f2573fa6905bc.png)](../assets/cb0f2573fa6905bc.png)

# Introduction

First article for RecSys month. Let’s go!

The goal of a recommendation system is to, well, recommend *things* to users.

They are EVERYWHERE in your digital journey:

  * Which videos you watch on YouTube (that’s me, btw!)

  * Which things you buy on Amazon

  * Which hotels you pick for your vacation

  * and the list goes on.

I chose to work on Recommendation systems because they are the perfect blend of:

  * Advanced ML techniques grounded in math.

  * You work from early retrieval to ranking, essentially it’s the most E2E ML system you could ever touch. You work with a tons of different systems and tradeoffs, every day is unique!

  * You work on re-shaping how a platform “feels” and how users interact with it. How cool is that?

If you are a follower of the newsletter, you have probably heard of some techniques, namely:

  * **Content-based filtering** : suggest items to a user that are similar to items they liked in the past.

  * **Collaborative filtering** : suggest items relying on opinions of a community. They can be user-based when they rely on user-user similarities, or item-based if they rely on item-item similarities.

  * **Context-based** : like collaborative filtering, but also exploits the interaction context to improve the quality of recommendations.

And you also know some evaluations techniques:

  * MAE and MSE for regression metrics

  * Precision and Recall for classification metrics

  * MAP, NDCG@K, MRR@K, Hit Rate@K for ranking metrics

Let’s take an example algorithm for each of those, and let’s describe metrics so that everyone is on the same page before we start touching the real nitty-gritty topics later on in the month!

Note that I am going to take a very different approach than standard things you find online, so stay tuned for that! :) 

## **Content-based filtering**

Not much to be said here. Look at user history, find patterns and output some recommendations based on that pattern. Good for “surely they will like this” recommendations, but that’s about it.

## **Collaborative filtering (CF)**

The most common approach to CF is based on neighborhood models, which are:

  * Intuitive and relatively simple

  * Easily justifiable (very useful!)

  * No costly training and inference: they are efficient as you can pre-compute things offline and use the cached result online.

  * they are stable with respect to addition of users, items and ratings.

You can do collaborative filtering in many ways. A common one in the modern deep learning world is to create user embeddings and use those embeddings to find similar users at inference time, and then lookup items those users liked.

You can do the same on items: if a user likes an item and this item is very similar to some other item, then recommend that as well.

## **Ranking metrics**

I assume you know what all metrics are. As for ranking metrics:

  * MAP: Average precision for each query, then mean across all

  * NDCG@K: Normalized discounted cumulative gain, the gold metric which takes into account position bias and relevance scores.

  * MRR@K: Mean reciprocal rank in the top K, it’s 1 / (rank of first relevant item)

  * Hi Rate@K: Did you get at least one relevant item in the top K?

## **Ok, so? What’s the big deal?**

At this point you might be thinking: 

“Ok, whatever. You have some training data, you have some metrics you want to optimize for. What else is there to do? How’s that different from just another kind of model that you deploy”

Glad you asked!

If you think recommendation systems are all about the model you use… you will learn a lot from the upcoming articles ;)

First of all, **the scale** is ENORMOUS.

Every day 3.7M videos are uploaded on YouTube ([public figure i randomly googled](https://techjury.net/industry-analysis/how-many-videos-are-uploaded-to-youtube-a-day/))

Do you think you can do all your fancy ML modelling things online? When Amazon showed that a 100ms latency increase [cost them 1% of their total revenue?](https://www.gigaspaces.com/blog/amazon-found-every-100ms-of-latency-cost-them-1-in-sales)

Think again! You need to make offline and online systems work in harmony. And there are a TONS of tradeoffs.

And **metrics**? If you think in terms of nDCG@K you already lost.

That’s not the only business metrics that counts (I argue it’s not even a business metric)

You need to account for diversity, serendipity, novelty.

And don’t forget to account for *long term* user value, not just short term gains!

The optimization needs to be multi-objective:

  * Optimize for click through rate of videos, and you get clickbaity content

  * Optimize for watch time only as a proxy of value, and you get those weird insta reels where you watch all the way only to find out it’s a loop to get you to watch it as long as possible

  * Optimize for number of views, and new creators will never get discovered, in a “winning videos keep on winning more”. Which also kills freshness btw.

  * Optimize for viewer side only, and you will never have new creators that get inspired

And don’t get me started on testing changes. Control vs Experiment setup is not going to work. You need long term running holdbacks to account for user learning and user fatigue.

And you also want to adapt to online changes from the user as fast as possible. Sometimes a batch heavy system will not give you the speed you need so you will need to make Multi-armed bandits work. Yes, for real: not just in papers.

Btw, I just spelled out all of my monthly content for you. Excited?

Also, if you are interested in some valid resources, take a look at the reference below!

# References

  1. [Recommender systems handbook](https://link.springer.com/book/10.1007/978-0-387-85820-3)

  2. [Building Recommendation systems in Python and Jax](https://www.oreilly.com/library/view/building-recommendation-systems/9781492097983/)

  3. [System design for discovery](https://eugeneyan.com/writing/system-design-for-discovery/)

  4. [Real time machine learning for recommendations](http://Real-time Machine Learning For Recommendations)

  5. [RecSys 2024 industry track](https://recsys.acm.org/recsys24/)
