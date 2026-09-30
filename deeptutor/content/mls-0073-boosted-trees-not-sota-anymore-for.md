# XGBoost not SOTA anymore for tabular data?

*Machine Learning at Scale collection — Ludovico Bessi, 2025-01-19 · topic: ml-theory*

[](../assets/be345cd5534d3f3e.png)From [1]

# Introduction

TabPFN (Tabular Prior-data Fitted Network) is a supervised learning model for small and medium-sized tabular data.

It has been trained on millions of synthetic datasets to learn how to solve prediction problems through in-context learning (ICL), the same mechanism of large language models.

I am personally really excited about such research directions. It’s time for new SOTA models that are not “fit XGBoost on this dataset”.

Let’s dive into it!

# Understanding the model

  * **In-context learning (ICL):** Unlike traditional methods, which train a model on each dataset, TabPFN is trained on millions of synthetic datasets and applied to real datasets in a single step. This allows it to generalize better and learn more efficiently.

  * **Architecture:** TabPFN uses a transformer architecture (shocked pikachu face) specifically adapted for tabular data, with a bidirectional attention mechanism that processes rows and columns independently of their order.

**How does it work?**

  1. **Data Generation:** TabPFN is pre-trained on millions of synthetic tabular datasets generated using structural causal models.

  2. **Pre-training:** A transformer model is trained to predict masked values in these synthetic datasets.

  3. **Real-world Prediction:** The trained model can be applied to real datasets, using the training samples as context for predictions, using in-context learning.

**Strengths:**

  * **Accuracy:** TabPFN is not only faster but also more accurate, achieving better results in terms of ROC AUC and RMSE compared to the baselines. Furthermore, it can model complex distributions of target values.

  * **Robustness:** TabPFN is robust to missing values, outliers, and uninformative features. It achieves similar performance to CatBoost even with half the training data.

  * **Foundation Model Capabilities:** TabPFN can be used for data generation, density estimation, learning reusable embeddings, and fine-tuning. It can also be interpreted using SHAP, providing explanations on the contribution of each feature to the predictions.

**Comparison with other methods**

  * **Gradient-Boosted Decision Trees (CatBoost, XGBoost):** While these models have been the top performers for tabular data for many years, TabPFN surpasses them in accuracy, especially when dealing with complex and non-linear functions.

  * **Deep Neural Networks:** Traditional deep learning models struggle with tabular data due to its heterogeneity. TabPFN, leveraging ICL and a specific architecture, overcomes these difficulties.

  * **AutoML (AutoGluon):** TabPFN, in its basic version, outperforms AutoGluon in terms of accuracy and speed. An ensembling approach (TabPFN PHE) leads to even better performance.

**Limitations and future developments:**

  * **Inference:** Inference with TabPFN can be slow, but optimizations are underway to address this issue.

  * **Dataset Size:** TabPFN is currently designed for datasets up to 10,000 samples and 500 features. Work is underway to scale the model to larger datasets.

  * **Specialized Priors:** Future developments may include specialized priors for time series and multimodal data.

# Conclusions

TabPFN represents a major shift in machine learning for tabular data, offering a faster, more accurate, and robust approach. 

This model promises to simplify and speed up the work of machine learning engineers and to open up new possibilities in various scientific domains.

I am especially excited in understanding how they can start scaling the model to bigger datasets.

# References 

  1. Accurate predictions on small data with a tabular foundation model

  2. LinkedIn post from the authors
