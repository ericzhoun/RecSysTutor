# #29 Object detection: one stage vs two stage networks and evaluation.

*Machine Learning at Scale collection — Ludovico Bessi, 2023-07-16 · topic: ml-theory*

[](../assets/f4e20c35e7a9e203.jpg)

# Table of contents

  1. **Introduction.**

  2. **One stage vs two stage.**

  3. **Evaluating object detection models.**

  4. **Closing thoughts.**

# Introduction

In today's article I am going to discuss computer vision models. Specifically: how to choose between one stage vs two stage object detection models and how to evaluate them.

Let's get started!

* * *

# One stage vs two stage models

The end goal of an object detection model is to predict the location of each object in the image AND predict the class. The first step is a regression problem while the second one is a classification problem.

**One stage network**

Using a single network, bounding boxes and classes are generated simultaneously. Famous one stage network architecture are YOLO and SSD.

**Two stage network**

Two separate models are used:

  * **Regional proposal network (RPN).**

  * **Classifier.**

The RPN scans an image and proposes candidate regions that are likely objects.

The classifier processes each proposed region and classifies it into an object class.

Famous models in this class are: R-CNN, Fast and Faster R-CNN.

**Bonus: Transformer based architecture DETR [1]**

DETR is an End-To-End modelling technique that uses a transformer based architecture to detect objects. It holds a special place in my hearth as I have used it in my Master thesis. This model is quite complicated and would require a stand alone blog post. DETR performed quite well metrics wise, but it hard to parallelize it, was quite heavy and predictions were slow.

The tradeoff for object detection models is made across three different dimensions:

  * Prediction latency

  * Model size

  * Precision

Needless to say, if you want to put an object detection model on a GPU of a car, you probably are not going to use DETR.

* * *

# Evaluating object detection models

The loss of an object detection model is weighted sum between the regression loss and the classification loss.

The regression loss measures how aligned the predicted bounding boxes are with the ground truth. The most common loss used is the L2 loss.

The classification loss is the usual cross-entropy loss.

However, some more thought is needed. When a predicted bounding box is considered correct? Usually an overlap between the ground truth bounding box and the predicted bounding box is calculated. This overlap is the so called intersection over union. (IOU)

With different IOU thresholds, you will have different precision. For this reason, the average precision (AP) is calculated across thresholds.

To summarize the model performance for various classes, the mean average precision (mAP) is calculated as the average of the APs across all classes.

* * *

# Closing thoughts

Choosing the right object detection model is an important step in the modelling process. I hope you learned something useful that you can apply in your day to day job.

* * *

# References

  1. DETR
