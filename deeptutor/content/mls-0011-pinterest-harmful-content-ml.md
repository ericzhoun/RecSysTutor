# #11 How Pinterest fights harmful content with Machine Learning.

*Machine Learning at Scale collection — Ludovico Bessi, 2023-03-12 · topic: recsys*

# Table of contents

  1. **Introduction**

  2. **Batch model**

  3. **Online model**

# Introduction

This week I have came across an interesting architecture from Pinterest to fight abuse [1]. 

Pins (read: a collection of pictures) with similar images are grouped together and uniquely defined by an hash signature. Then, machine learning models generate scores for each image-signature to classify if a a given group of Pins is abusive or not.

The interesting bit of the system is that it runs models both in batch mode and online mode.

The two are complementary: if the image-signature is present already in the store, then the corresponding store is used for enforcement online. Otherwise, the online prediction kicks in and predicts on the fly:

[](../assets/a60b29d483390e1f.png)

There could have been another way to go: attach different heads to the "MultiCategory DNN" and create a different binary model for each abusive content. The advantage would be that it is much easier to fine-tune the decision threshold in that case. Plus, It's also easier to investigate and fix if something goes bad. It's also easier to add a new label, if needed.

Clearly, there is more model overhead management: training N models as opposed to just one and serving more models. The more the models, the more the problems as they say!

The model is multi-modal: images, words and graphs. I find that quite impressive and I'd be curious to know more about the inner details.

All the different inputs are used to train the "PinSage" embeddings, that I assume are used across different teams, not just for this particular application.

This is one of the lessons learned from Booking.com engineers, I talked about them in one of my previous articles:

Machine learning at scaleLudovico Bessi

The interference is run daily using Spark. The whole corpus of Pins is scored and action is taken in case content is flagged as abusive.

This batch run is _o_ ffline: the model has all possible inputs, but intervention time is slow. In the best case where all inputs are available immediately (rarely), it could still be the case that abusive content stays online for 24h.

I want to focus on the fact that the offline data to be fed to the model will for sure take some processing time, so I believe abusive content could stay up for days.

This is a lot of time for abusers to abuse.

* * *

# Online model

To intervene faster, there is a second version of the model that runs inference online.

The online model trades **recall** for speed: the architecture is the same with one difference, the graph input is missing.

This means that the model loses out on recall because of the data source missing. Still, It is able to run in real time for a significant reduction in classification latency.

Why one particular source of input is not available online, you might ask?

Either fetching that data online is too expensive (latency or just plain memory) or it's impossible for an infrastructure point of view.

A possible solution for the first problem would be to cache it and using a batch job to update it. However, the data could be very sensitive to temporal changes which could seriously damage model **precision**.

The second problem is more organizational in nature and could require a big political push to change the infrastructure to allow this to happen. To make that happen, it would probably be important to showcase how much damage is saved by having an offline data source online.

The inference is triggered by events happening in real time stored in Kafka and performed by a Flink job.

* * *

# References

  1. How Pinterest fights misinformation, hate speech, and self-harm content with machine learning
