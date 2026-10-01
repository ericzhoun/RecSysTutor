# 66. I am no longer postmortem free.

*Machine Learning at Scale collection — Ludovico Bessi, 2024-12-08 · topic: ml-theory*

[](../assets/620ae9455b78f014.webp)

Google’s servers when I push code to prod.

# Introduction

Another meta article about a software engineer career. Today, I will give a perspective on postmortems.

I admit, my guilty pleasure when I do some small error at work is opening the internal postmortem page (called OMG, lol) to check some ongoing postmortems and make myself feel better :D.

Even better, I now can just look **at my personal postmortem**.

Yeah.. you read that right! After almost 3 years, I am no longer post mortem free!

Let’s see how to structure a good postmortem (but hoping that you never have to write one!).

> "Let’s plan for a future where we’re all as stupid as we are today."
>
> – Dan Milstein

# Blameless postmortem culture leads to less outages (AND more risk taking!)

Blameless postmortems are all about creating a culture where we focus on _what_ happened rather than _who_ did it.

The idea is simple: if engineers aren’t afraid of being blamed for outages, they are more likely to take risks, innovate, and flag problems early, ultimately leading to fewer outages in the long run.

This openness encourages honest conversations, ensuring that everyone has the opportunity to learn from mistakes.

When you remove fear from the equation, you increase transparency and a willingness to take necessary risks.

**This culture is alive and strong at Google and I LOVE IT!**

# WHAT DID I DO?

I know you only care about this, so here we are. It’s actually pretty boring lol.

I misconfigured a configuration file and submitted it.

The configuration file is immediately pushed to prod, working as intended.

The change affected prod, we see spike in error and we immediately roll back.

The end! :D

We detected immediately something was wrong and we reacted immediately, but…

In the ads world, every minute costs . So had to write a postmortem on it!!

Let’s see how to craft the perfect postmortem, so you can shine even in a bad time!

# How to craft a perfect postmortem

Here’s a solid framework to follow, from [1]:

#### Executive Summary

Provide a concise overview of the incident—what happened and what the outcome was. Include the time, date, and brief description of the issue.

#### Impact

Assess the damage in clear, quantifiable terms:

  * **Number of impacted users** : Did the incident affect a subset or all users?

  * **Lost revenue** : Was there a financial impact? Estimate the monetary loss.

  * **Duration** : How long did the issue persist before resolution?

  * **Team impact** : Did this issue require urgent interventions, overtime, or emergency meetings? How did it affect the team's workflow?

#### Timeline

Provide a detailed, chronological breakdown of events:

  1. **Detection** : How was the issue first noticed? Was it flagged by automated systems or reported by users?

  2. **Resolution** : Outline the steps taken to mitigate the issue and how long it took.

#### Root Cause Analysis

Go beyond surface-level explanations and dig into the underlying factors:

  * What technical flaw triggered the issue?

  * Were there any pre-existing vulnerabilities?

  * Were human or process errors involved?

#### Lessons Learned

This is one of the most critical sections, as it helps you and the team grow from the experience:

  * **Things that went well** : What strategies or tools worked during the resolution? Did anything prevent the problem from escalating further?

  * **Things that went poorly** : Were there delays in detection or communication breakdowns? Highlight the areas that need improvement.

#### Action Items

End with concrete, actionable steps to prevent future occurrences:

  1. **Tasks to improve prevention** : Are there process changes or additional training required?

  2. **Tasks to improve detection** : Should you update monitoring tools or establish new alerting thresholds?

  3. **Tasks to improve mitigation** : Do emergency response plans need updating? Do engineers need faster access to resources or decision-makers?

# What can you get out of a good postmortem?

Conducting a thorough and well-structured postmortem offers significant benefits!

1\. **Personal Growth and Skill Development:**
By diving into the details of a postmortem, you learn to dissect complex issues, identify root causes, and understand the broader impact of incidents. This deepens your technical expertise and sharpens your ability to address and prevent future problems.

2\. **Increased Credibility and Respect:**
Executing a postmortem well demonstrates your commitment to transparency and continuous improvement. Colleagues and leaders will see you as a proactive problem-solver who is dedicated to learning from mistakes rather than avoiding responsibility. This builds your reputation as a competent and reliable engineer.

3\. **Enhanced Problem-Solving Abilities:**
By identifying and addressing system weaknesses, you develop an eye for potential issues and solutions. This experience improves your problem-solving abilities, making you better equipped to handle future challenges with confidence and efficiency.

4\. **Stronger Collaborative Skills:**
Postmortems often involve working closely with cross-functional teams. Successfully navigating these discussions and integrating diverse perspectives can improve your communication and teamwork skills. This collaborative experience fosters better relationships and teamwork across your organization.

5\. **A Clear Path for Career Advancement:**
Consistently applying the lessons learned from postmortems can lead to measurable improvements in system performance and reliability. This track record of success is often recognized in performance reviews and can contribute to career advancement and professional recognition.

7\. **Greater Confidence in Handling Incidents:**
Experience with postmortems builds confidence in your ability to manage and mitigate incidents effectively. You become adept at navigating complex situations, communicating clearly under pressure, and implementing solutions that prevent recurrence.

# [Bonus points] My personal mistakes that *almost* made me write a postmortem in the past. (yeah, it was bound to happen sooner or later…)

In no particular order:

  * Forgot a flag in an experiment, which lead to less ads being shown on the home page of youtube for a small percentage of users. (Got pinged by on-call and fixed very fast!)

  * DB migration led to a spike of +300% of QPS (for the biggest QPS system at google…). We almost did not even notice, thanks Google infra!

  * Polluted training data with predicted labels of the model, leading to 100% precision offline :D, too good to be true!

  * Messed up an integration where I added a boolean to some proto message. The whole message was empty, except for the boolean. Not very useful by itself!

  * While optimizing CPU consumption with some “look I am so smart” C++, I shooted myself in the foot (a classic) and deleted 1/3 of ML features from the training data. Whops!

# Closing thoughts

A postmortem isn't about pointing fingers; it's about learning and making sure the same mistake doesn’t happen twice.

The more we embrace blameless postmortems, the more we encourage open discussion and prevent recurrence!

Hope you enjoyed this and share some of your personal fuck-ups too! :)

Ludo

# References

  1. Blameless postmortems

  2. Chapter 10 - Postmortem Culture: Learning from Failure
