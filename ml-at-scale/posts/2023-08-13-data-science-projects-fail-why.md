---
title: "#33 Why Data Science projects fail?"
date: 2023-08-13
author: Ludovico Bessi
collection: Machine Learning at Scale
topics: [career]
paywalled: false
words: 678
---

# #33 Why Data Science projects fail?

[![#33 Why Data Science projects fail?](../assets/30cb5212effb7971.jpg)](../assets/30cb5212effb7971.jpg)

# Table of contents

  1. **Introduction.**

  2. **Why Data Science projects fail?**

  3. **Closing thoughts.**

# Introduction

I came across [1] which peaked my interest. Machine learning projects are now everywhere in tech companies. Everyone wants to jump on the Machine Learning train!

Still, many of them fail / go nowhere.

Why?

Let's look at some common mistakes and how to avoid them.

* * *

# Why Data Science projects fail?

### Effective stakeholder management

Stakeholders should share equal responsability as the individual contributors. However, there is a gap between what stakeholders think machine learning can solve and what it can actually solve.

So, okay, better communication... You already know this!

But let's go one step ahead.

Processes should be defined to bridge the communication gap between organizational structure and leadership commitment.

Leadership does not commit to a project because it is not clear how the business metrics are going to be impacted. That's a problem that can be solved by having a process in place to define such metrics before even thinking about a machine learning solution.

A good business metric is defined but the organization structure does not support the new machine learning project. This is harder to solve, a few possibilities:

  * Individual contributor are stretched towards a different role for the duration of the project. (Could be a good thing!)

  * Cross team collaboration is supported to fill the knowledge gaps.

### Data quality issues

Most teams don't want to be "stuck" fixing data quality issues. Often times, these issues are not tangible enough and an individual contributor's incentives are aligned towards other deliverables.

In this case, either there is a specific tool / ninja-team that helps with data quality, or incentives should be re-aligned.

But there are some cases where it's even easier: the status-quo models contain data quality bug. Then, it's should be easy to prove the impact of the fix by duplicating (for little time and little effort!) the production models and assessing results.

### Model deployment and production

Many models are created offline in random colabs, and then handed to engineers that need to productionize them.

I believe there should be tight coupling between the model creation phase and model productionization phase:

  * Training data and labels should be accessible for both the offline experimentation and the model productization.

  * The model architecture should not be pushed to the limit to boost some offline metrics, if that means not being served at all.

  * The productization platform should allow for easy experimentation.

### Change management

Most of the data science project are either used for tactical fixes or time saving or cost saving using automation to reduce manual effort.

To handle change management, the machine learning team needs to engage with the team soon-to-be-affected team early on and illustrate how this is going to improve their work.

As an example, a platform might be moving from hand-made rules to machine learning models. This can scare operators that are used to create such rules.

The idea in this case is to show how the change can improve their bottom-line metrics if they move to a this new shiny tool. Good documentation is important here!

### Data governance

Data governance processes, roles, policies and standard are getting more stronger after GDPR.

> Around 30% of data science projects unable to go to production due to Data Governance rules according to [1].

And that number will only go up!

Machine learning teams need to come to the conclusion that less data will come through their pipeline and at a premium cost!

To prepare for this, they should be on the lookout for:

  * New sources of data that are do not contain Personal identifiable information (PII)

  * Making sure it is easy to remove features that are based on PII from production model seamlessly.

* * *

# Closing thoughts

I hope the list above gives you clarity into what mistakes to avoid when leading your next Machine Learning project!

* * *

# References

  1. [Why Data Science Projects Fail](https://arxiv.org/pdf/2308.04896.pdf)
