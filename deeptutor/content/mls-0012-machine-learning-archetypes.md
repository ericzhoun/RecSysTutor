# #12 The sprectrum of Machine Learning roles in industry: different archetypes for different organizations.

*Machine Learning at Scale collection — Ludovico Bessi, 2023-03-19 · topic: career*

[](../assets/35bd9fbbd82e7202.jpg)

# Table of contents

  1. **Introduction.**

  2. **The spectrum of roles.**

  3. **Roles overlap depending on organization's maturity and scope.**

  4. **Closing thoughts.**

# Introduction

Today's article will be more on the lighter side.

[](../assets/64f6ffde351ceba4.gif)Fig 1: The reader excited to save some mental energy on a Sunday evening.

I will discuss the different archetypes of Machine learning roles in industry and how they overlap depending on an organization's maturity and scope.

The first part of the article should be more interesting for students / graduates to understand which kind of roles and organization is better suited for their interests.

The second part of the article should be more interesting for leaders in the Machine learning space that want to understand how to grow a team effectively.

❗

Caveat

I have narrowed my focus on the most common roles: Software engineer, Machine learning engineer, Applied scientist / Research engineer, Data scientist.

There are many other roles that I have not covered, such as: Analytics engineer, Data analyst, Business Analyst, Data engineer and Research scientist.

I did not cover them because:

  * They somehow fit on the spectrum in between the roles I have picked.

  * Every company has a different definition for every role, especially for the most uncommon.

Let's get started!

* * *

# The spectrum of roles.

On the right side: data scientists find patter in data and create model MVPs.

In the middle: machine learning engineers and applied scientists.

The middle roles are quite fluid and depend heavily on the team you are on.

Sometimes, you will be experimenting with a new model architecture. Other times, you will deploy the model to production and optimize infrastructure latency.

Where you fall on the spectrum depends mainly on your strengths and organization needs.

Personally, I really enjoy the "Machine learning engineer" archetype. Close enough to software engineering that I need to care (and learn) about classical problems in distributed systems, but I still get leeway to play around new modelling techniques if needed. Pretty sweet deal!

Still, a role is not set in stone. Depending on the organization, you might be required to wear multiple hats. I argue that's a good outcome, as you understand first hand the pain points of the system and get a more holistic view of the platform.

* * *

# Roles overlap depending on **organization's maturity and scope.**

In this section, I try to answer these two questions:

> You decided to go for a certain role, however after joining you realize you are doing something different for more than 50% of your time. Could you have realized it before joining?

> You hired for a given skill set, however the organization matured and the person needs to do something much different. Could you have predicted it?

The mismatch happens because a team's focus and maturity changes over time.

As a candidate, you should gather enough information to understand the overall trajectory of the team you will be joining. (Not easy!)

As a leader, you should predict in advance where the team is going and match a skill set needed now but still needed in 6 months. (Still not easy, but I argue easier than the previous case)

I have taken inspiration from [1] to show how the overlap between roles in a Machine learning organization changes depending on the maturity of the product and the focus of the team.

If you are the candidate, then you can ask probing questions to understand how the team operates.

If you are a leader, you know where the team is going and predict with higher confidence the skill set you need.

I am going to focus on these different combinations:

  1. Low maturity product, batch predictions.

  2. Low maturity product, online predictions.

  3. High maturity product, batch predictions.

  4. High maturity product, online predictions.

  5. Horizontal Machine Learning team.

❗Caveat

I am considering only two dimensions, which is rather superficial.

It should be a good starting point though!

### Low maturity product, batch predictions

You don't need an Applied scientist yet, as you are probably starting out with some off-the-shelf model / baseline.

There is some overlap between SWE, MLE and DS: every role should be able to operate the platform and create a new simple/model rule to be executed offline.

### Low maturity product, online predictions

You don't need an Applied scientist yet, as you are probably starting out with some off-the-shelf model / baseline.

Usually, an online platform requires more careful engineering considerations. As such, there is no overlap between SWE and DS.

### High maturity product, batch predictions

The team has been running for some time and the focus is on batch predictions.

### High maturity product, online predictions

The team has been running for some time and the focus is on online predictions.

This case is a little different. A machine learning team is tasked to help different product teams design and launch ML solutions. As such, I have also added the PM (Product manager) figure to empathize the need of talking to the clients.

The data scientist sits between the engineer team and the clients and translate the business need as defined by the PM for the engineering team.

# **Closing thoughts**

I hope this article shed some lights on the different hats one can wear in a machine learning organization and how responsibilities might change depending on the focus and maturity of the team.

Clearly, these are just my opinions: let me know if you have a different view. :)

* * *

# References

  1. Data Scientist X Machine learning engineer roles: How are they different? How are they alike?
