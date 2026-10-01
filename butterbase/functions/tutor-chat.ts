// RecSysTutor live-chat backend — production build.
// Butterbase serverless function (Deno runtime).
//
// Pipeline:  browser → [CORS + rate limit]
//            → retrieval (pgvector similarity over rt_chunks, lexical fallback)
//            → generation (Kimi via Moonshot, OpenAI-compatible) → grounded answer
//
// Retrieval runs as SQL inside this function through ctx.db, so it needs no external
// service: the course chunks live in the app's own rt_chunks table with 1536-dim
// gemini-embedding-2 vectors and an HNSW cosine index.
//
// Triggers:  POST /tutor-chat   (public chat)      GET /tutor-chat (health)

const VERSION = "1.3.0";
const EMBED_MODEL = "gemini-embedding-2";
const EMBED_DIMS = 1536;
const TOP_K = 6;
const MIN_SIM = 0.45;          // below this, a hit is noise rather than a source

const ALLOWED_ORIGINS = [
  "https://olivistart.com",
  "https://www.olivistart.com",
  "https://recsytutor.github.io",
];
const RATE_LIMIT_PER_WINDOW = 30;   // requests per client per window
const RATE_WINDOW_SECONDS = 600;    // 10 minutes
const MAX_MESSAGE_CHARS = 2000;
const MAX_HISTORY = 8;

// Course module headings, as shown in the course page (the slugs flatten them).
const MODULE_TITLE: Record<string, string> = {"M0":"Orientation","M1":"The funnel and its foundations","M10":"Embedding infrastructure","M11":"Reading library","M2":"Candidate generation / retrieval","M3":"Ranking & feature interaction","M4":"Sequential & generative recommenders","M5":"Multi-task learning","M6":"Case study: Twitter\u2019s recommender","M7":"Practical toolkit & capstone","M8":"Paper atlas: the Ads & RecSys collection","M9":"Study with an AI tutor"};

// Where each indexed source can actually be read. Generated from the corpus so a
// citation is always openable:
//   course modules mN-...   -> index.html#mN   (the lesson inside the course page)
//   library posts  mls-...  -> ml-at-scale/posts/<date>-<slug>.md  (renders with images)
// The KB copies under deeptutor/content/ are not used: their ../assets/ refs do not
// resolve, so those pages would render with broken images.
const CITE_URL: Record<string, string> = {"00-overview":"index.html","m0-orientation":"index.html#m0","m1-the-funnel-and-its-foundations":"index.html#m1","m10-embedding-infrastructure":"index.html#m10","m11-ml-at-scale-reading-library":"index.html#m11","m2-candidate-generation-retrieval":"index.html#m2","m3-ranking-feature-interaction":"index.html#m3","m4-sequential-generative-recommenders":"index.html#m4","m5-multi-task-learning":"index.html#m5","m6-case-study-twitter-s-recommender":"index.html#m6","m7-practical-toolkit-capstone":"index.html#m7","m8-paper-atlas-the-ads-recsys-collection":"index.html#m8","m9-study-with-an-ai-tutor-deeptutor":"index.html#m9","mls-0001-hello-world":"ml-at-scale/posts/2023-01-01-hello-world.md","mls-0002-how-tiktok-recommendation-algorithm-scales-to-billion":"ml-at-scale/posts/2023-01-08-how-tiktok-recommendation-algorithm-scales-to-billion.md","mls-0003-ml-tech-debt":"ml-at-scale/posts/2023-01-15-ml-tech-debt.md","mls-0004-wait-time-yelp":"ml-at-scale/posts/2023-01-22-wait-time-yelp.md","mls-0005-uber-continuous-deployment":"ml-at-scale/posts/2023-01-29-uber-continuous-deployment.md","mls-0006-linkedin-explainable-models":"ml-at-scale/posts/2023-02-05-linkedin-explainable-models.md","mls-0007-doordash-monitoring":"ml-at-scale/posts/2023-02-12-doordash-monitoring.md","mls-0008-meta-ai-platform":"ml-at-scale/posts/2023-02-19-meta-ai-platform.md","mls-0009-reddit-ml-deployment-serving":"ml-at-scale/posts/2023-02-26-reddit-ml-deployment-serving.md","mls-0010-booking-ml-models":"ml-at-scale/posts/2023-03-05-booking-ml-models.md","mls-0011-pinterest-harmful-content-ml":"ml-at-scale/posts/2023-03-12-pinterest-harmful-content-ml.md","mls-0012-machine-learning-archetypes":"ml-at-scale/posts/2023-03-19-machine-learning-archetypes.md","mls-0013-netflix-media-understanding":"ml-at-scale/posts/2023-03-26-netflix-media-understanding.md","mls-0014-explainability-ml-models":"ml-at-scale/posts/2023-04-02-explainability-ml-models.md","mls-0015-linkedin-online-features-store":"ml-at-scale/posts/2023-04-09-linkedin-online-features-store.md","mls-0016-adversarial-examples":"ml-at-scale/posts/2023-04-16-adversarial-examples.md","mls-0017-uber-optimal-feature-discovery":"ml-at-scale/posts/2023-04-23-uber-optimal-feature-discovery.md","mls-0018-machine-learning-on-device-models":"ml-at-scale/posts/2023-04-30-machine-learning-on-device-models.md","mls-0019-machine-learning-batch-serving":"ml-at-scale/posts/2023-05-07-machine-learning-batch-serving.md","mls-0020-online-feature-stores":"ml-at-scale/posts/2023-05-14-online-feature-stores.md","mls-0021-machine-learning-online-serving":"ml-at-scale/posts/2023-05-21-machine-learning-online-serving.md","mls-0022-machine-learning-distributed-training":"ml-at-scale/posts/2023-05-28-machine-learning-distributed-training.md","mls-0023-compressing-large-language-models":"ml-at-scale/posts/2023-06-04-compressing-large-language-models.md","mls-0024-pruning-llm-sparsegpt":"ml-at-scale/posts/2023-06-11-pruning-llm-sparsegpt.md","mls-0025-distributed-machine-learning":"ml-at-scale/posts/2023-06-18-distributed-machine-learning.md","mls-0026-decentralised-compute-machine-learning-1":"ml-at-scale/posts/2023-06-25-decentralised-compute-machine-learning-1.md","mls-0027-decentralised-compute-machine-learning-2":"ml-at-scale/posts/2023-07-02-decentralised-compute-machine-learning-2.md","mls-0028-evaluating-ranking-models":"ml-at-scale/posts/2023-07-09-evaluating-ranking-models.md","mls-0029-computer-vision":"ml-at-scale/posts/2023-07-16-computer-vision.md","mls-0030-31-pruning-vs-quantizatin-final-showdown":"ml-at-scale/posts/2023-07-23-31-pruning-vs-quantizatin-final-showdown.md","mls-0031-mixture-experts-ai":"ml-at-scale/posts/2023-07-30-mixture-experts-ai.md","mls-0032-low-rank-approximation-llm":"ml-at-scale/posts/2023-08-06-low-rank-approximation-llm.md","mls-0033-data-science-projects-fail-why":"ml-at-scale/posts/2023-08-13-data-science-projects-fail-why.md","mls-0034-optimizer-large-language-models":"ml-at-scale/posts/2023-08-20-optimizer-large-language-models.md","mls-0035-machine-unlearning-challenges-solutions":"ml-at-scale/posts/2023-08-27-machine-unlearning-challenges-solutions.md","mls-0036-transformers-as-support-vector-machines":"ml-at-scale/posts/2023-09-03-transformers-as-support-vector-machines.md","mls-0037-changes-ahead-for-machine-learning":"ml-at-scale/posts/2023-09-17-changes-ahead-for-machine-learning.md","mls-0038-machine-un-learning":"ml-at-scale/posts/2024-05-19-machine-un-learning.md","mls-0039-training-safety-first-llm-models":"ml-at-scale/posts/2024-05-26-training-safety-first-llm-models.md","mls-0040-40-interpretable-features-from-claude":"ml-at-scale/posts/2024-06-02-40-interpretable-features-from-claude.md","mls-0041-39-automatically-detecting-under":"ml-at-scale/posts/2024-06-09-39-automatically-detecting-under.md","mls-0042-semi-supervised-learning":"ml-at-scale/posts/2024-06-16-semi-supervised-learning.md","mls-0043-active-learning":"ml-at-scale/posts/2024-06-23-active-learning.md","mls-0044-pick-your-own-embedding-dimension":"ml-at-scale/posts/2024-06-30-pick-your-own-embedding-dimension.md","mls-0045-44-testing-machine-learning":"ml-at-scale/posts/2024-07-07-44-testing-machine-learning.md","mls-0046-compound-ai-systems":"ml-at-scale/posts/2024-07-14-compound-ai-systems.md","mls-0047-federated-learning":"ml-at-scale/posts/2024-07-21-federated-learning.md","mls-0048-special-edition-scaling-your-impact":"ml-at-scale/posts/2024-07-26-special-edition-scaling-your-impact.md","mls-0049-feature-stores-in-an-embedding-world":"ml-at-scale/posts/2024-07-28-feature-stores-in-an-embedding-world.md","mls-0050-48-high-quality-pre-training-data":"ml-at-scale/posts/2024-08-04-48-high-quality-pre-training-data.md","mls-0051-49-autoregressive-text-to-image-vs":"ml-at-scale/posts/2024-08-11-49-autoregressive-text-to-image-vs.md","mls-0052-are-you-gpu-poor-in-context-learning":"ml-at-scale/posts/2024-08-18-are-you-gpu-poor-in-context-learning.md","mls-0053-51-short-circuiting-llms-to-construct":"ml-at-scale/posts/2024-08-25-51-short-circuiting-llms-to-construct.md","mls-0054-52-q-improving-multi-step-reasoning":"ml-at-scale/posts/2024-09-01-52-q-improving-multi-step-reasoning.md","mls-0055-53-detecting-hallucinations-in-large":"ml-at-scale/posts/2024-09-08-53-detecting-hallucinations-in-large.md","mls-0056-54-openai-o1-model-a-machine-learning":"ml-at-scale/posts/2024-09-15-54-openai-o1-model-a-machine-learning.md","mls-0057-54-artificial-intelligence-math-olympiad":"ml-at-scale/posts/2024-09-22-54-artificial-intelligence-math-olympiad.md","mls-0058-56-transfusion-predict-the-next-token":"ml-at-scale/posts/2024-09-29-56-transfusion-predict-the-next-token.md","mls-0059-57-what-happened-to-bert":"ml-at-scale/posts/2024-10-06-57-what-happened-to-bert.md","mls-0060-58-my-personal-blueprint-to-get-up":"ml-at-scale/posts/2024-10-13-58-my-personal-blueprint-to-get-up.md","mls-0061-59-llm-as-a-judge-use-cases-and-evaluations":"ml-at-scale/posts/2024-10-20-59-llm-as-a-judge-use-cases-and-evaluations.md","mls-0062-60-how-linkedin-built-its-genai-platform":"ml-at-scale/posts/2024-10-27-60-how-linkedin-built-its-genai-platform.md","mls-0063-61-how-shortwave-designed-the-world":"ml-at-scale/posts/2024-11-03-61-how-shortwave-designed-the-world.md","mls-0064-62-7-absolute-truths-you-believe":"ml-at-scale/posts/2024-11-10-62-7-absolute-truths-you-believe.md","mls-0065-63-how-multimodal-llms-mllm-work":"ml-at-scale/posts/2024-11-17-63-how-multimodal-llms-mllm-work.md","mls-0066-64-challenges-and-solutions-of-long":"ml-at-scale/posts/2024-11-24-64-challenges-and-solutions-of-long.md","mls-0067-65-finetuning-llms-to-make-them-good":"ml-at-scale/posts/2024-12-01-65-finetuning-llms-to-make-them-good.md","mls-0068-67-improving-rag-components":"ml-at-scale/posts/2024-12-15-67-improving-rag-components.md","mls-0069-68-colbert-and-colpali-late-interaction":"ml-at-scale/posts/2024-12-22-68-colbert-and-colpali-late-interaction.md","mls-0070-69-closing-the-year-off-stream-of":"ml-at-scale/posts/2024-12-29-69-closing-the-year-off-stream-of.md","mls-0071-mlebackendfrontend-vs-productinfra":"ml-at-scale/posts/2025-01-05-mlebackendfrontend-vs-productinfra.md","mls-0072-modern-bert":"ml-at-scale/posts/2025-01-12-modern-bert.md","mls-0073-boosted-trees-not-sota-anymore-for":"ml-at-scale/posts/2025-01-19-boosted-trees-not-sota-anymore-for.md","mls-0074-are-we-really-running-out-of-data":"ml-at-scale/posts/2025-01-26-are-we-really-running-out-of-data.md","mls-0075-deepseek-v3-model":"ml-at-scale/posts/2025-02-02-deepseek-v3-model.md","mls-0076-deep-dive-into-scaling-test-time":"ml-at-scale/posts/2025-02-09-deep-dive-into-scaling-test-time.md","mls-0077-distilling-sota-embedding-models":"ml-at-scale/posts/2025-02-16-distilling-sota-embedding-models.md","mls-0078-hymba-a-hybrid-head-architecture":"ml-at-scale/posts/2025-02-23-hymba-a-hybrid-head-architecture.md","mls-0079-visual-autoregressive-next-scale":"ml-at-scale/posts/2025-03-02-visual-autoregressive-next-scale.md","mls-0080-dense-retrieval-contextual-embeddings":"ml-at-scale/posts/2025-03-09-dense-retrieval-contextual-embeddings.md","mls-0081-deep-dive-into-memory-for-llms-architectures":"ml-at-scale/posts/2025-03-16-deep-dive-into-memory-for-llms-architectures.md","mls-0082-streamingllm-unlock-infinite-context":"ml-at-scale/posts/2025-03-23-streamingllm-unlock-infinite-context.md","mls-0083-beyond-rag-search-r1-teaches-llms":"ml-at-scale/posts/2025-03-30-beyond-rag-search-r1-teaches-llms.md","mls-0084-llm-serving-1-continuous-batching":"ml-at-scale/posts/2025-04-06-llm-serving-1-continuous-batching.md","mls-0085-llm-serving-2-paged-attention":"ml-at-scale/posts/2025-04-13-llm-serving-2-paged-attention.md","mls-0086-llm-serving-3-speculative-decoding":"ml-at-scale/posts/2025-04-20-llm-serving-3-speculative-decoding.md","mls-0087-llm-serving-4-disaggregated-serving":"ml-at-scale/posts/2025-04-27-llm-serving-4-disaggregated-serving.md","mls-0088-llm-serving-bonus-takeaways-from":"ml-at-scale/posts/2025-05-04-llm-serving-bonus-takeaways-from.md","mls-0089-beyond-basic-rag-towards-agentic":"ml-at-scale/posts/2025-05-11-beyond-basic-rag-towards-agentic.md","mls-0090-kv-runahead-scalable-causal-llm-inference":"ml-at-scale/posts/2025-05-18-kv-runahead-scalable-causal-llm-inference.md","mls-0091-ai-site-reliability-engineer":"ml-at-scale/posts/2025-05-25-ai-site-reliability-engineer.md","mls-0092-text-to-sql-just-got-a-lot-better":"ml-at-scale/posts/2025-06-01-text-to-sql-just-got-a-lot-better.md","mls-0093-openpipe-rl-for-multi-turn-agents":"ml-at-scale/posts/2025-06-08-openpipe-rl-for-multi-turn-agents.md","mls-0094-tackling-the-llm-cold-start-problem":"ml-at-scale/posts/2025-06-15-tackling-the-llm-cold-start-problem.md","mls-0095-how-block-diffusion-bridges-ar-and":"ml-at-scale/posts/2025-06-22-how-block-diffusion-bridges-ar-and.md","mls-0096-stateful-agents-with-lettaai":"ml-at-scale/posts/2025-06-29-stateful-agents-with-lettaai.md","mls-0097-can-vision-language-models-complete":"ml-at-scale/posts/2025-07-06-can-vision-language-models-complete.md","mls-0098-memagent-reshaping-long-context-llm":"ml-at-scale/posts/2025-07-13-memagent-reshaping-long-context-llm.md","mls-0099-100-times-machine-learning-at-scale":"ml-at-scale/posts/2025-07-20-100-times-machine-learning-at-scale.md","mls-0100-doing-rl-without-the-costly-training":"ml-at-scale/posts/2025-07-27-doing-rl-without-the-costly-training.md","mls-0101-recsys-part-1-intro-and-common-blind":"ml-at-scale/posts/2025-08-03-recsys-part-1-intro-and-common-blind.md","mls-0102-recsys-part-2-two-tower-models-in":"ml-at-scale/posts/2025-08-10-recsys-part-2-two-tower-models-in.md","mls-0103-recsys-part-3-longer-scaling-up-long":"ml-at-scale/posts/2025-08-17-recsys-part-3-longer-scaling-up-long.md","mls-0104-recsys-part-4-real-time-bandits-at":"ml-at-scale/posts/2025-08-24-recsys-part-4-real-time-bandits-at.md","mls-0105-recsys-grand-final":"ml-at-scale/posts/2025-08-31-recsys-grand-final.md","mls-0106-zml-inference-stack-across-different":"ml-at-scale/posts/2025-09-07-zml-inference-stack-across-different.md","mls-0107-amazonqac-large-scale-query-autocomplete":"ml-at-scale/posts/2025-09-14-amazonqac-large-scale-query-autocomplete.md","mls-0108-more-than-just-a-few-tokens-deep":"ml-at-scale/posts/2025-09-21-more-than-just-a-few-tokens-deep.md","mls-0109-seed-diffusion-a-large-scale-diffusion":"ml-at-scale/posts/2025-09-28-seed-diffusion-a-large-scale-diffusion.md","mls-0110-intentrec-predict-user-intent-with":"ml-at-scale/posts/2025-10-05-intentrec-predict-user-intent-with.md","mls-0111-learning-facts-at-scale-with-active":"ml-at-scale/posts/2025-10-12-learning-facts-at-scale-with-active.md","mls-0112-agent-learning-from-human-feedback":"ml-at-scale/posts/2025-10-19-agent-learning-from-human-feedback.md","mls-0113-spiking-brain-inspired-lms":"ml-at-scale/posts/2025-10-26-spiking-brain-inspired-lms.md","mls-0114-r4ec-teaching-your-recommender-llms":"ml-at-scale/posts/2025-11-02-r4ec-teaching-your-recommender-llms.md","mls-0115-exploring-scaling-laws-of-ctr-model":"ml-at-scale/posts/2025-11-09-exploring-scaling-laws-of-ctr-model.md","mls-0116-beyond-immediate-click-engagement":"ml-at-scale/posts/2025-11-16-beyond-immediate-click-engagement.md","mls-0117-direct-profit-estimation-using-uplift":"ml-at-scale/posts/2025-11-23-direct-profit-estimation-using-uplift.md","mls-0118-month-of-recsys-2025-closing-notes":"ml-at-scale/posts/2025-11-30-month-of-recsys-2025-closing-notes.md","mls-0119-industry-case-study-vllm-linkedin":"ml-at-scale/posts/2025-12-07-industry-case-study-vllm-linkedin.md","mls-0120-dont-abolish-tokenizersunderstand":"ml-at-scale/posts/2025-12-14-dont-abolish-tokenizersunderstand.md","mls-0121-system-design-deep-dive-achieving":"ml-at-scale/posts/2025-12-21-system-design-deep-dive-achieving.md","mls-0122-mlscale-2025-was-the-biggest-year":"ml-at-scale/posts/2025-12-28-mlscale-2025-was-the-biggest-year.md","mls-0123-olmo-3-the-most-open-llm-yet":"ml-at-scale/posts/2026-01-11-olmo-3-the-most-open-llm-yet.md","mls-0124-the-rl-training-recipe-when-post":"ml-at-scale/posts/2026-01-18-the-rl-training-recipe-when-post.md","mls-0125-the-unreasonable-effectiveness-of":"ml-at-scale/posts/2026-01-25-the-unreasonable-effectiveness-of.md","mls-0126-agent-context-engineering":"ml-at-scale/posts/2026-02-01-agent-context-engineering.md","mls-0127-titans-googles-new-architecture-that":"ml-at-scale/posts/2026-02-08-titans-googles-new-architecture-that.md","mls-0128-nested-learning-why-stacking-layers":"ml-at-scale/posts/2026-02-15-nested-learning-why-stacking-layers.md","mls-0129-from-sysexit0-to-sabotage-how-reward":"ml-at-scale/posts/2026-02-22-from-sysexit0-to-sabotage-how-reward.md","mls-0130-sequential-attention-bridging-greedy":"ml-at-scale/posts/2026-03-01-sequential-attention-bridging-greedy.md","mls-0131-engineering-airbnbs-embedding-based":"ml-at-scale/posts/2026-03-08-engineering-airbnbs-embedding-based.md","mls-0132-the-industrialization-of-algorithm":"ml-at-scale/posts/2026-03-15-the-industrialization-of-algorithm.md","mls-0133-vectoscale-is-paying-237kmonth-to":"ml-at-scale/posts/2026-03-21-vectoscale-is-paying-237kmonth-to.md","mls-0134-evolutionary-code-optimization-how":"ml-at-scale/posts/2026-03-22-evolutionary-code-optimization-how.md","mls-0135-800ms-latency-spikes-from-a-45k-redis":"ml-at-scale/posts/2026-03-28-800ms-latency-spikes-from-a-45k-redis.md","mls-0136-the-modern-llm-optimization-stack":"ml-at-scale/posts/2026-03-29-the-modern-llm-optimization-stack.md","mls-0137-mlscale-is-leveling-up-and-your-window":"ml-at-scale/posts/2026-04-01-mlscale-is-leveling-up-and-your-window.md","mls-0138-deep-neural-networks-for-youtube":"ml-at-scale/posts/2026-04-05-deep-neural-networks-for-youtube.md","mls-0139-pruning-llms-for-retrieval-why-attention":"ml-at-scale/posts/2026-04-12-pruning-llms-for-retrieval-why-attention.md","mls-0140-the-cheat-code-for-mles-in-2026":"ml-at-scale/posts/2026-04-18-the-cheat-code-for-mles-in-2026.md","mls-0141-linkedins-mixlm-10x-faster-llm-ranking":"ml-at-scale/posts/2026-04-19-linkedins-mixlm-10x-faster-llm-ranking.md","mls-0142-production-ml-a-reality-check-on":"ml-at-scale/posts/2026-04-22-production-ml-a-reality-check-on.md","mls-0143-linkedin-semantic-job-search":"ml-at-scale/posts/2026-04-26-linkedin-semantic-job-search.md","mls-0144-an-essay-on-zurich":"ml-at-scale/posts/2026-04-28-an-essay-on-zurich.md","mls-0145-unpacking-linkedins-move-to-semantic":"ml-at-scale/posts/2026-05-03-unpacking-linkedins-move-to-semantic.md","mls-0146-alibabas-est-decoupling-compute-from":"ml-at-scale/posts/2026-05-10-alibabas-est-decoupling-compute-from.md","mls-0147-a-blueprint-for-scaling-recommender":"ml-at-scale/posts/2026-05-17-a-blueprint-for-scaling-recommender.md","mls-0148-embedding-features-in-weights-to":"ml-at-scale/posts/2026-05-24-embedding-features-in-weights-to.md","mls-0149-bytedances-tokenmixer-large-scaling":"ml-at-scale/posts/2026-05-31-bytedances-tokenmixer-large-scaling.md","mls-0150-mlscale-11-100-billion-rows-three":"ml-at-scale/posts/2026-06-07-mlscale-11-100-billion-rows-three.md","mls-0151-linkedin-architecture-for-production":"ml-at-scale/posts/2026-06-14-linkedin-architecture-for-production.md","mls-0152-analysis-of-splare-sparse-autoencoders":"ml-at-scale/posts/2026-06-21-analysis-of-splare-sparse-autoencoders.md","mls-0153-kunlun-breakdown-unlocking-predictable":"ml-at-scale/posts/2026-06-28-kunlun-breakdown-unlocking-predictable.md","mls-0154-mlscale-11-judit-ml-engineer-at-a":"ml-at-scale/posts/2026-07-05-mlscale-11-judit-ml-engineer-at-a.md","mls-0155-your-rl-training-loop-is-a-distributed":"ml-at-scale/posts/2026-07-12-your-rl-training-loop-is-a-distributed.md","mls-0156-cursor-composer-2-report-deep-dive":"ml-at-scale/posts/2026-07-19-cursor-composer-2-report-deep-dive.md","mls-0157-your-rag-stack-has-about-a-year-left":"ml-at-scale/posts/2026-07-26-your-rag-stack-has-about-a-year-left.md","mls-0158-mlscale-11-one-deleted-model-with":"ml-at-scale/posts/2026-08-02-mlscale-11-one-deleted-model-with.md","mls-0159-from-two-tower-model-to-generative":"ml-at-scale/posts/2026-08-09-from-two-tower-model-to-generative.md","mls-0160-mlscale-11-every-training-label-was":"ml-at-scale/posts/2026-09-06-mlscale-11-every-training-label-was.md","mls-0161-six-posts-a-week-next-to-a-full-time":"ml-at-scale/posts/2026-09-13-six-posts-a-week-next-to-a-full-time.md","mls-0162-whats-your-value-as-an-mle-in-2026":"ml-at-scale/posts/2026-09-20-whats-your-value-as-an-mle-in-2026.md","mls-0163-i-stopped-building-my-promo-case":"ml-at-scale/posts/2026-09-23-i-stopped-building-my-promo-case.md","mls-0164-on-ai-psychosis":"ml-at-scale/posts/2026-09-27-on-ai-psychosis.md","mls-0165-66-postmortem-why-are-they-important":"ml-at-scale/posts/2024-12-08-66-postmortem-why-are-they-important.md","mls-0166-bonus-sneak-peek-into-next-big-projects":"ml-at-scale/posts/2025-08-13-bonus-sneak-peek-into-next-big-projects.md","mls-0167-bonus-premium-sub-community":"ml-at-scale/posts/2025-08-16-bonus-premium-sub-community.md","mls-0168-bonus-pinterest-recommendation-systems":"ml-at-scale/posts/2025-08-27-bonus-pinterest-recommendation-systems.md","mls-0169-bonus-the-most-overloaded-role-machine":"ml-at-scale/posts/2025-09-10-bonus-the-most-overloaded-role-machine.md","mls-0170-research-project-through-mats":"ml-at-scale/posts/2025-09-24-research-project-through-mats.md","mls-0171-deep-dive-into-claude-code-post-mortem":"ml-at-scale/posts/2025-10-15-deep-dive-into-claude-code-post-mortem.md","mls-0172-beyond-rlhf-with-rubrics-as-rewards":"ml-at-scale/posts/2025-10-22-beyond-rlhf-with-rubrics-as-rewards.md","mls-0173-foundation-model-for-in-context-learning":"ml-at-scale/posts/2025-11-12-foundation-model-for-in-context-learning.md","mls-0174-towards-large-scale-generative-ranking":"ml-at-scale/posts/2025-11-26-towards-large-scale-generative-ranking.md","mls-0175-from-ppo-to-grape-a-technical-review":"ml-at-scale/posts/2025-12-10-from-ppo-to-grape-a-technical-review.md","mls-0176-reinforcement-learning-with-rubric":"ml-at-scale/posts/2025-12-17-reinforcement-learning-with-rubric.md","mls-0177-adding-a-monthly-deep-dive-to-your":"ml-at-scale/posts/2026-01-06-adding-a-monthly-deep-dive-to-your.md","mls-0178-2026-is-the-year-of-agency-but-not":"ml-at-scale/posts/2026-01-14-2026-is-the-year-of-agency-but-not.md","mls-0179-dear-paid-sub-a-gift-for-you":"ml-at-scale/posts/2026-01-18-dear-paid-sub-a-gift-for-you.md","mls-0180-xai-recommendation-system-deep-dive":"ml-at-scale/posts/2026-01-23-xai-recommendation-system-deep-dive.md","mls-0181-what-would-i-do-if-i-wanted-to-get":"ml-at-scale/posts/2026-01-28-what-would-i-do-if-i-wanted-to-get.md","mls-0182-on-changing-orgs-in-big-tech-your":"ml-at-scale/posts/2026-02-04-on-changing-orgs-in-big-tech-your.md","mls-0183-how-to-break-into-mlsys-through-open":"ml-at-scale/posts/2026-02-18-how-to-break-into-mlsys-through-open.md","mls-0184-a-real-day-in-the-life-of-a-ml-engineer":"ml-at-scale/posts/2026-03-02-a-real-day-in-the-life-of-a-ml-engineer.md","mls-0185-mle-vs-swe-vs-research-scientist":"ml-at-scale/posts/2026-03-03-mle-vs-swe-vs-research-scientist.md","mls-0186-continual-learning-via-sparse-memory":"ml-at-scale/posts/2026-03-04-continual-learning-via-sparse-memory.md","mls-0187-behind-the-ml-engineer-title-how":"ml-at-scale/posts/2026-03-04-behind-the-ml-engineer-title-how.md","mls-0188-behind-the-ml-engineer-title-building":"ml-at-scale/posts/2026-03-05-behind-the-ml-engineer-title-building.md","mls-0189-behind-the-ml-engineer-title-part":"ml-at-scale/posts/2026-03-06-behind-the-ml-engineer-title-part.md","mls-0190-metas-gem-bringing-llm-scale-architectures":"ml-at-scale/posts/2026-03-18-metas-gem-bringing-llm-scale-architectures.md","mls-0191-im-gunning-for-l5-at-google-heres":"ml-at-scale/posts/2026-03-25-im-gunning-for-l5-at-google-heres.md","mls-0192-the-mle-job-is-changing-faster-than":"ml-at-scale/posts/2026-03-26-the-mle-job-is-changing-faster-than.md","mls-0193-how-to-make-your-work-visible-to":"ml-at-scale/posts/2026-03-27-how-to-make-your-work-visible-to.md","mls-0194-my-take-on-negotiating-offers":"ml-at-scale/posts/2026-04-01-my-take-on-negotiating-offers.md","mls-0195-the-5800-faiss-index-that-was-stale":"ml-at-scale/posts/2026-04-04-the-5800-faiss-index-that-was-stale.md","mls-0196-the-zurich-feed-edition-1":"ml-at-scale/posts/2026-04-08-the-zurich-feed-edition-1.md","mls-0197-a-27kmonth-ranking-system-that-silently":"ml-at-scale/posts/2026-04-11-a-27kmonth-ranking-system-that-silently.md","mls-0198-220k-lost-to-a-fraud-model-that-passed":"ml-at-scale/posts/2026-04-18-220k-lost-to-a-fraud-model-that-passed.md","mls-0199-inside-mlscale-1":"ml-at-scale/posts/2026-04-24-inside-mlscale-1.md","mls-0200-the-22k-neural-search-pipeline-that":"ml-at-scale/posts/2026-04-25-the-22k-neural-search-pipeline-that.md","mls-0201-anthropic-shipped-three-regressions":"ml-at-scale/posts/2026-04-27-anthropic-shipped-three-regressions.md","mls-0202-the-zurich-feed-edition-2":"ml-at-scale/posts/2026-04-29-the-zurich-feed-edition-2.md","mls-0203-a-11m-generative-recommender-that":"ml-at-scale/posts/2026-05-02-a-11m-generative-recommender-that.md","mls-0204-generative-recsys-wont-save-you-what":"ml-at-scale/posts/2026-05-06-generative-recsys-wont-save-you-what.md","mls-0205-42m-lost-because-of-a-48-hour-labeling":"ml-at-scale/posts/2026-05-09-42m-lost-because-of-a-48-hour-labeling.md","mls-0206-the-zurich-feed-edition-3":"ml-at-scale/posts/2026-05-13-the-zurich-feed-edition-3.md","mls-0207-12m-dollars-lost-to-an-auc-metric":"ml-at-scale/posts/2026-05-16-12m-dollars-lost-to-an-auc-metric.md","mls-0208-xai-recommendation-system-deep-dive-202":"ml-at-scale/posts/2026-05-17-xai-recommendation-system-deep-dive-202.md","mls-0209-the-barbell-market-for-ml-engineers":"ml-at-scale/posts/2026-05-20-the-barbell-market-for-ml-engineers.md","mls-0210-a-044-recall-collapse-that-looked":"ml-at-scale/posts/2026-05-23-a-044-recall-collapse-that-looked.md","mls-0211-inside-mlscale-2":"ml-at-scale/posts/2026-05-25-inside-mlscale-2.md","mls-0212-why-your-130k-ml-pipeline-is-starving":"ml-at-scale/posts/2026-05-30-why-your-130k-ml-pipeline-is-starving.md","mls-0213-the-zurich-feed-edition-4":"ml-at-scale/posts/2026-06-03-the-zurich-feed-edition-4.md","mls-0214-that-780k-gpu-bill-for-a-model-that":"ml-at-scale/posts/2026-06-06-that-780k-gpu-bill-for-a-model-that.md","mls-0215-how-to-pick-the-right-ml-team":"ml-at-scale/posts/2026-06-10-how-to-pick-the-right-ml-team.md","mls-0216-the-240k-monthly-bert-bill-for-classifying":"ml-at-scale/posts/2026-06-13-the-240k-monthly-bert-bill-for-classifying.md","mls-0217-the-zurich-feed-edition-5":"ml-at-scale/posts/2026-06-17-the-zurich-feed-edition-5.md","mls-0218-12-sequential-redis-gets-that-added":"ml-at-scale/posts/2026-06-20-12-sequential-redis-gets-that-added.md","mls-0219-youre-wasting-your-first-90-days":"ml-at-scale/posts/2026-06-24-youre-wasting-your-first-90-days.md","mls-0220-inside-mlscale-3":"ml-at-scale/posts/2026-06-25-inside-mlscale-3.md","mls-0221-the-32400-search-model-that-silently":"ml-at-scale/posts/2026-06-27-the-32400-search-model-that-silently.md","mls-0222-when-your-scope-gets-carved-out-dont":"ml-at-scale/posts/2026-07-01-when-your-scope-gets-carved-out-dont.md","mls-0223-the-14k-monthly-discovery-engine":"ml-at-scale/posts/2026-07-04-the-14k-monthly-discovery-engine.md","mls-0224-the-zurich-feed-edition-6":"ml-at-scale/posts/2026-07-08-the-zurich-feed-edition-6.md","mls-0225-11-percent-ndcg-gains-that-were-actually":"ml-at-scale/posts/2026-07-11-11-percent-ndcg-gains-that-were-actually.md","mls-0226-i-run-15-experiments-at-a-time-heres":"ml-at-scale/posts/2026-07-15-i-run-15-experiments-at-a-time-heres.md","mls-0227-the-150ms-redis-tail-latency-that":"ml-at-scale/posts/2026-07-18-the-150ms-redis-tail-latency-that.md","mls-0228-the-zurich-feed-edition-7":"ml-at-scale/posts/2026-07-22-the-zurich-feed-edition-7.md","mls-0229-the-195k-monthly-ranker-that-only":"ml-at-scale/posts/2026-07-25-the-195k-monthly-ranker-that-only.md","mls-0230-inside-mlscale-4":"ml-at-scale/posts/2026-07-26-inside-mlscale-4.md","mls-0231-the-bet-im-making-for-the-next-18":"ml-at-scale/posts/2026-07-29-the-bet-im-making-for-the-next-18.md","mls-0232-the-zurich-feed-edition-8":"ml-at-scale/posts/2026-08-05-the-zurich-feed-edition-8.md","mls-0233-i-left-ml-for-impact-its-the-worst":"ml-at-scale/posts/2026-08-12-i-left-ml-for-impact-its-the-worst.md","mls-0234-from-two-tower-model-to-generative-750":"ml-at-scale/posts/2026-08-16-from-two-tower-model-to-generative-750.md","mls-0235-the-zurich-feed-edition-9":"ml-at-scale/posts/2026-08-19-the-zurich-feed-edition-9.md","mls-0236-from-two-tower-model-to-generative-52a":"ml-at-scale/posts/2026-08-23-from-two-tower-model-to-generative-52a.md","mls-0237-inside-mlscale-5":"ml-at-scale/posts/2026-08-25-inside-mlscale-5.md","mls-0238-new-to-a-team-stop-trying-to-earn":"ml-at-scale/posts/2026-08-26-new-to-a-team-stop-trying-to-earn.md","mls-0239-generative-recsys-in-2026-the-papers":"ml-at-scale/posts/2026-08-30-generative-recsys-in-2026-the-papers.md","mls-0240-code-reviews-in-the-agentic-ai-age":"ml-at-scale/posts/2026-09-02-code-reviews-in-the-agentic-ai-age.md","mls-0241-how-to-manufacture-senior-scope-evidence":"ml-at-scale/posts/2026-09-09-how-to-manufacture-senior-scope-evidence.md","mls-0242-the-zurich-feed-edition-10":"ml-at-scale/posts/2026-09-16-the-zurich-feed-edition-10.md","mls-0243-inside-mlscale-6":"ml-at-scale/posts/2026-09-26-inside-mlscale-6.md","mls-0244-the-zurich-feed-edition-11":"ml-at-scale/posts/2026-09-30-the-zurich-feed-edition-11.md","papers-atlas":"index.html#m8"};

// Real post titles, so a citation reads like the article rather than its slug.
const CITE_TITLE: Record<string, string> = {"100-times-machine-learning-at-scale":"100 times Machine learning at scale in your i\u2026","11-percent-ndcg-gains-that-were-actually":"11 Percent NDCG Gains That Were Actually Just\u2026","12-sequential-redis-gets-that-added":"$800K Lost Because a Model Thought the City W\u2026","12m-dollars-lost-to-an-auc-metric":"12M Dollars Lost to an AUC Metric That Ignore\u2026","2026-is-the-year-of-agency-but-not":"2026 Is the Year of Agency, but Not the One Y\u2026","220k-lost-to-a-fraud-model-that-passed":"$220K Lost to a Fraud Model That Passed a 0.8\u2026","31-pruning-vs-quantizatin-final-showdown":"Pruning vs Quantization. Final showdown!","39-automatically-detecting-under":"40. Automatically detecting Under-trained Tok\u2026","40-interpretable-features-from-claude":"39. Interpretable Features from Claude 3 Sonn\u2026","42m-lost-because-of-a-48-hour-labeling":"0.08% False Positive Rate That Masked a $4.2M\u2026","44-testing-machine-learning":"44. Testing Machine Learning","48-high-quality-pre-training-data":"48. High quality pre-training data: FineWeb \ud83c\udf77","49-autoregressive-text-to-image-vs":"49. Autoregressive text-to-image vs Diffusion\u2026","51-short-circuiting-llms-to-construct":"51. Short-circuiting LLMs to construct highly\u2026","52-q-improving-multi-step-reasoning":"52. Q*: Improving Multi-step reasoning with d\u2026","53-detecting-hallucinations-in-large":"53. Detecting hallucinations in large languag\u2026","54-artificial-intelligence-math-olympiad":"55. Artificial Intelligence Math Olympiad: De\u2026","54-openai-o1-model-a-machine-learning":"54. OpenAI o1 model: perspective from a ML sy\u2026","56-transfusion-predict-the-next-token":"56. Transfusion: Predict the Next Token and D\u2026","57-what-happened-to-bert":"57. What happened to BERT?","58-my-personal-blueprint-to-get-up":"58. My personal blueprint to get up and runni\u2026","59-llm-as-a-judge-use-cases-and-evaluations":"59. LLM as a judge: use cases and evaluations","60-how-linkedin-built-its-genai-platform":"60. How LinkedIn built its GenAI platform","61-how-shortwave-designed-the-world":"61. How shortwave designed the world smartest\u2026","62-7-absolute-truths-you-believe":"62. 7 Hard-Earned Lessons About Software Engi\u2026","63-how-multimodal-llms-mllm-work":"63. How multimodal LLMs (MLLM) work under the\u2026","64-challenges-and-solutions-of-long":"64. Breaking the Attention Barrier: A Deep Di\u2026","65-finetuning-llms-to-make-them-good":"65. Finetuning LLMs to make them good at RAG:\u2026","66-postmortem-why-are-they-important":"66. I am no longer postmortem free","67-improving-rag-components":"67. Improving RAG components","68-colbert-and-colpali-late-interaction":"68. ColBERT and ColPALI: late interaction ret\u2026","69-closing-the-year-off-stream-of":"69. Closing the year off: stream-of-conscious\u2026","800ms-latency-spikes-from-a-45k-redis":"800ms Latency Spikes From A $45K Redis Cluste\u2026","a-044-recall-collapse-that-looked":"A 0.44 Recall Collapse That Looked Like 0.81\u2026","a-11m-generative-recommender-that":"A $1.1M Generative Recommender That Collapsed\u2026","a-27kmonth-ranking-system-that-silently":"A $27K/Month Ranking System That Silently Bur\u2026","a-blueprint-for-scaling-recommender":"A Blueprint for Scaling Recommender Systems","a-real-day-in-the-life-of-a-ml-engineer":"A real day in the life of a ML engineer","active-learning":"42. Active learning","adding-a-monthly-deep-dive-to-your":"Adding a monthly deep dive to your subscripti\u2026","adversarial-examples":"Robust machine learning models in an adversar\u2026","agent-context-engineering":"Agent Context Engineering","agent-learning-from-human-feedback":"Agent Learning from Human Feedback (ALHF)","ai-site-reliability-engineer":"AI Site reliability engineer?","alibabas-est-decoupling-compute-from":"Alibaba\u2019s EST: Decoupling Compute from Sequen\u2026","amazonqac-large-scale-query-autocomplete":"AmazonQAC: Large scale query autocomplete dat\u2026","an-essay-on-zurich":"An essay on Z\u00fcrich","analysis-of-splare-sparse-autoencoders":"Analysis of SPLARE: Sparse Autoencoders for L\u2026","anthropic-shipped-three-regressions":"Anthropic shipped three regressions in a mont\u2026","are-we-really-running-out-of-data":"Are we really running out of data for LLMs?","are-you-gpu-poor-in-context-learning":"50. The Evolution of In-Context Learning: Imp\u2026","behind-the-ml-engineer-title-building":"Behind the ML Engineer work: Building an Audi\u2026","behind-the-ml-engineer-title-how":"How You Actually Grow as an MLE","behind-the-ml-engineer-title-part":"ML engineer - The Bigger Picture - My life in\u2026","beyond-basic-rag-towards-agentic":"Beyond Basic RAG towards Agentic RAG","beyond-immediate-click-engagement":"Beyond Immediate Click: Engagement-Aware and\u2026","beyond-rag-search-r1-teaches-llms":"Beyond RAG: Search-R1 Teaches LLMs to Learn H\u2026","beyond-rlhf-with-rubrics-as-rewards":"Beyond RLHF with Rubrics as Rewards","bonus-pinterest-recommendation-systems":"[Bonus] Pinterest Recommendation Systems evol\u2026","bonus-premium-sub-community":"[Bonus] Premium sub community","bonus-sneak-peek-into-next-big-projects":"[Bonus] Sneak peek into next big projects at\u2026","bonus-the-most-overloaded-role-machine":"[Bonus] The most overloaded role: 'Machine le\u2026","booking-ml-models":"150 Successful Machine Learning Models: Lesso\u2026","boosted-trees-not-sota-anymore-for":"XGBoost not SOTA anymore for tabular data?","bytedances-tokenmixer-large-scaling":"ByteDance\u2019s TokenMixer-Large: Scaling Ranking\u2026","can-vision-language-models-complete":"Can Vision-Language Models complete popular v\u2026","changes-ahead-for-machine-learning":"Changes ahead for Machine Learning at scale!","code-reviews-in-the-agentic-ai-age":"Code reviews in the Agentic AI age","compound-ai-systems":"45. Compound AI systems","compressing-large-language-models":"Compressing LLMs using novel quantization tec\u2026","computer-vision":"Object detection: one stage vs two stage netw\u2026","continual-learning-via-sparse-memory":"Continual Learning via Sparse Memory Finetuni\u2026","cursor-composer-2-report-deep-dive":"Cursor Composer 2 report deep dive","data-science-projects-fail-why":"Why Data Science projects fail?","dear-paid-sub-a-gift-for-you":"Dear paid sub, a gift for you!","decentralised-compute-machine-learning-1":"Gensyn: Decentralised Compute for Machine Lea\u2026","decentralised-compute-machine-learning-2":"Gensyn: Decentralised Compute for Machine Lea\u2026","deep-dive-into-claude-code-post-mortem":"Deep Dive into Claude Code post mortem","deep-dive-into-memory-for-llms-architectures":"Deep dive into 'Memory for LLMs' architectures","deep-dive-into-scaling-test-time":"Deep dive into scaling test time compute","deep-neural-networks-for-youtube":"Deep Neural Networks for YouTube Recommendati\u2026","deepseek-v3-model":"Deepseek v3 model: feat of engineering above\u2026","dense-retrieval-contextual-embeddings":"Dense Retrieval: Contextual Embeddings for Su\u2026","direct-profit-estimation-using-uplift":"Direct Profit Estimation Using Uplift Modelin\u2026","distilling-sota-embedding-models":"Distilling SOTA embedding models","distributed-machine-learning":"Genuinely Distributed Byzantine Machine Learn\u2026","doing-rl-without-the-costly-training":"Doing RL without the costly training data!","dont-abolish-tokenizersunderstand":"Don't Abolish Tokenizers\u2014Understand Them","doordash-monitoring":"How DoorDash maintains models accuracy throug\u2026","embedding-features-in-weights-to":"Embedding Features in Weights to Kill Retriev\u2026","engineering-airbnbs-embedding-based":"Engineering Airbnb\u2019s Embedding-Based Retrieva\u2026","evaluating-ranking-models":"Evaluating Machine Learning ranking models of\u2026","evolutionary-code-optimization-how":"Evolutionary Code Optimization: How Datadog A\u2026","explainability-ml-models":"Machine learning models: explainability and i\u2026","exploring-scaling-laws-of-ctr-model":"Exploring Scaling Laws of CTR Model for Onlin\u2026","feature-stores-in-an-embedding-world":"47. Feature stores in an embedding world","federated-learning":"46. Federated learning","foundation-model-for-in-context-learning":"Foundation Model for In-Context Learning on R\u2026","from-ppo-to-grape-a-technical-review":"From PPO to GRAPE: A Technical Review of the\u2026","from-sysexit0-to-sabotage-how-reward":"From sys.exit(0) to Sabotage: How Reward Hack\u2026","from-two-tower-model-to-generative":"From two tower model to Generative retrieval\u2026","from-two-tower-model-to-generative-52a":"From two tower model to Generative retrieval\u2026","from-two-tower-model-to-generative-750":"From two tower model to Generative retrieval\u2026","generative-recsys-in-2026-the-papers":"Generative RecSys in 2026 - the papers","generative-recsys-wont-save-you-what":"Generative RecSys Won\u2019t Save You: What Actual\u2026","hello-world":"What is my plan with Machine learning at scal\u2026","how-block-diffusion-bridges-ar-and":"How Block Diffusion Bridges AR and Diffusion\u2026","how-tiktok-recommendation-algorithm-scales-to-billion":"How TikTok Real Time Recommendation algorithm\u2026","how-to-break-into-mlsys-through-open":"Cheat code for MLEs to stand out in 2026","how-to-make-your-work-visible-to":"How to make your work visible to leadership?\u2026","how-to-manufacture-senior-scope-evidence":"How to manufacture senior-scope evidence befo\u2026","how-to-pick-the-right-ml-team":"How to pick the right ML team","hymba-a-hybrid-head-architecture":"Hymba: A Hybrid-head Architecture for Small L\u2026","i-left-ml-for-impact-its-the-worst":"I Left ML for 'Impact.' It's the Worst Trade\u2026","i-run-15-experiments-at-a-time-heres":"How I run 15 experiments at a time","i-stopped-building-my-promo-case":"I stopped building my promo case","im-gunning-for-l5-at-google-heres":"I\u2019m Gunning for L5 at Google. Here\u2019s What I\u2019v\u2026","industry-case-study-vllm-linkedin":"Industry case study: vLLM @ LinkedIn","inside-mlscale-1":"Inside ML@Scale #1","inside-mlscale-2":"Inside ML@Scale #2","inside-mlscale-3":"Inside ML@Scale #3","inside-mlscale-4":"Inside ML@Scale #4","inside-mlscale-5":"Inside ML@Scale #5","inside-mlscale-6":"Inside ML@Scale #6","intentrec-predict-user-intent-with":"IntentRec: Predict user intent with multi tas\u2026","kunlun-breakdown-unlocking-predictable":"Kunlun Breakdown: Unlocking Predictable Scali\u2026","kv-runahead-scalable-causal-llm-inference":"KV-Runahead: Scalable causal LLM inference wi\u2026","learning-facts-at-scale-with-active":"Learning Facts At Scale With Active Reading","linkedin-architecture-for-production":"LinkedIn Architecture for Production-Scale LL\u2026","linkedin-explainable-models":"How LinkedIn built a Machine Learning system\u2026","linkedin-online-features-store":"Near real-time personalization at LinkedIn","linkedin-semantic-job-search":"LinkedIn Semantic job search","linkedins-mixlm-10x-faster-llm-ranking":"LinkedIn\u2019s MixLM: 10x Faster LLM Ranking via\u2026","llm-serving-1-continuous-batching":"LLM serving (1): Continuous batching","llm-serving-2-paged-attention":"LLM Serving (2): Paged attention","llm-serving-3-speculative-decoding":"LLM serving (3): Speculative decoding","llm-serving-4-disaggregated-serving":"LLM Serving (4): Disaggregated serving","llm-serving-bonus-takeaways-from":"LLM Serving (Bonus!): takeaways from industry","low-rank-approximation-llm":"LoRA: Low rank adaptation. Finetuning LLM fas\u2026","machine-learning-archetypes":"The sprectrum of Machine Learning roles in in\u2026","machine-learning-batch-serving":"Batch predictions","machine-learning-distributed-training":"Machine Learning Distributed Training","machine-learning-on-device-models":"Machine Learning At Scale: Challenges and Sol\u2026","machine-learning-online-serving":"Online serving","machine-un-learning":"37. Machine UN-Learning (!!)","machine-unlearning-challenges-solutions":"Machine UN-learning","memagent-reshaping-long-context-llm":"MemAgent: Reshaping Long-context LLM with RL-\u2026","meta-ai-platform":"Meta's AI platform for engineers across the c\u2026","metas-gem-bringing-llm-scale-architectures":"Meta's GEM: Bringing LLM-Scale Architectures\u2026","mixture-experts-ai":"Mixture of Experts for inference speed-ups of\u2026","ml-tech-debt":"Technical debt in Machine learning systems ha\u2026","mle-vs-swe-vs-research-scientist":"MLE vs SWE vs Research Scientist","mlebackendfrontend-vs-productinfra":"MLE/Backend/Frontend vs Product/Infra","mlscale-11-100-billion-rows-three":"ML@SCALE - 1:1 - 100 billion rows, three mist\u2026","mlscale-11-every-training-label-was":"ML@SCALE \u00b7 1:1 \u00b7 Every training label was lyi\u2026","mlscale-11-judit-ml-engineer-at-a":"ML@Scale 1:1 \u2014 Judit, ML Engineer at a Danish\u2026","mlscale-11-one-deleted-model-with":"ML@SCALE \u00b7 1:1 \u00b7 One deleted model with one o\u2026","mlscale-2025-was-the-biggest-year":"ML@Scale 2025 was the biggest year (yet)","mlscale-is-leveling-up-and-your-window":"ML@Scale is leveling up (and your window to l\u2026","modern-bert":"Modern BERT","month-of-recsys-2025-closing-notes":"Month of RecSys 2025 - closing notes","more-than-just-a-few-tokens-deep":"More Than Just a Few Tokens Deep","my-take-on-negotiating-offers":"My take on negotiating offers","nested-learning-why-stacking-layers":"Nested Learning: Why Stacking Layers is an Il\u2026","netflix-media-understanding":"How Netflix built a media understanding platf\u2026","new-to-a-team-stop-trying-to-earn":"New to a Team? Stop Trying to Earn the Good S\u2026","olmo-3-the-most-open-llm-yet":"OLMo 3: The Most Open LLM Yet","on-ai-psychosis":"On AI Psychosis","on-changing-orgs-in-big-tech-your":"On changing orgs in big tech: your lever for\u2026","online-feature-stores":"Machine Learning Features store challenges fr\u2026","openpipe-rl-for-multi-turn-agents":"OpenPipe: RL for multi turn agents","optimizer-large-language-models":"Scalable Second-order Optimizer for Language\u2026","pick-your-own-embedding-dimension":"43. Pick your own embedding dimension: Matryo\u2026","pinterest-harmful-content-ml":"How Pinterest fights harmful content with Mac\u2026","production-ml-a-reality-check-on":"Production ML: A Reality Check on MLOps","pruning-llm-sparsegpt":"Pruning LLMs in OneShot with SparseGPT","pruning-llms-for-retrieval-why-attention":"Pruning LLMs for Retrieval: Why Attention Mat\u2026","r4ec-teaching-your-recommender-llms":"R4ec: Teaching Your Recommender LLMs to Think\u2026","recsys-grand-final":"[RecSys] Grand final!","recsys-part-1-intro-and-common-blind":"[RecSys] Part 1: Intro and common blind spots","recsys-part-2-two-tower-models-in":"[RecSys] Part 2: Two tower models in industry","recsys-part-3-longer-scaling-up-long":"[RecSys] Part 3: LONGER, scaling up long sequ\u2026","recsys-part-4-real-time-bandits-at":"[RecSys] Part 4: Real time bandits at YouTube","reddit-ml-deployment-serving":"Reddit's ML Model Deployment and Serving Arch\u2026","reinforcement-learning-with-rubric":"Reinforcement Learning with Rubric Anchors: A\u2026","research-project-through-mats":"Become a Research Scientist for a day?","seed-diffusion-a-large-scale-diffusion":"Seed Diffusion: A Large-Scale Diffusion Langu\u2026","semi-supervised-learning":"41. Semi-supervised learning","sequential-attention-bridging-greedy":"Sequential Attention: Bridging Greedy Selecti\u2026","six-posts-a-week-next-to-a-full-time":"Six Posts a Week next to a Full-Time Job","special-edition-scaling-your-impact":"[Special edition] Scaling Your Impact: Lesson\u2026","spiking-brain-inspired-lms":"Spiking Brain-Inspired LMs","stateful-agents-with-lettaai":"Stateful agents with Letta.ai","streamingllm-unlock-infinite-context":"StreamingLLM: Unlock Infinite Context for You\u2026","system-design-deep-dive-achieving":"System Design Deep Dive: Achieving Frontier L\u2026","tackling-the-llm-cold-start-problem":"Tackling the LLM Cold Start Problem with Smar\u2026","text-to-sql-just-got-a-lot-better":"Text-to-SQL just got a lot better with RL","that-780k-gpu-bill-for-a-model-that":"Why a 1.2 Percent CTR Model Triggered a 42 Pe\u2026","the-14k-monthly-discovery-engine":"The $14K Monthly Discovery Engine That Silent\u2026","the-150ms-redis-tail-latency-that":"The 150ms Redis Tail Latency That Only Hit Hi\u2026","the-195k-monthly-ranker-that-only":"The $195K Monthly Ranker That Only Learns to\u2026","the-22k-neural-search-pipeline-that":"The $22K Neural Search Pipeline That Was Sile\u2026","the-240k-monthly-bert-bill-for-classifying":"Why a 0.92 F1 Score Hid a 31 Percent Violatio\u2026","the-32400-search-model-that-silently":"The $32,400 Search Model That Silently Priori\u2026","the-5800-faiss-index-that-was-stale":"The $5800 FAISS Index That Was Stale for 168\u2026","the-barbell-market-for-ml-engineers":"The Barbell Market for ML Engineers","the-bet-im-making-for-the-next-18":"The bet I'm making for the next 18 months as\u2026","the-cheat-code-for-mles-in-2026":"How xAI's recommendation system actually works","the-industrialization-of-algorithm":"The Industrialization of Algorithm Design: AI\u2026","the-mle-job-is-changing-faster-than":"What Nobody Tells You About Being an MLE in 2\u2026","the-modern-llm-optimization-stack":"The Modern LLM Optimization Stack: A Field Gu\u2026","the-rl-training-recipe-when-post":"The RL Training Recipe: When Post-Training Ac\u2026","the-unreasonable-effectiveness-of":"The Unreasonable Effectiveness of Normalizati\u2026","the-zurich-feed-edition-1":"THE Z\u00dcRICH FEED [Edition #1]","the-zurich-feed-edition-10":"THE Z\u00dcRICH FEED [Edition #10]","the-zurich-feed-edition-11":"THE Z\u00dcRICH FEED [Edition #11]","the-zurich-feed-edition-2":"THE Z\u00dcRICH FEED [Edition #2]","the-zurich-feed-edition-3":"THE Z\u00dcRICH FEED [Edition #3]","the-zurich-feed-edition-4":"THE Z\u00dcRICH FEED [Edition #4]","the-zurich-feed-edition-5":"THE Z\u00dcRICH FEED [Edition #5]","the-zurich-feed-edition-6":"THE Z\u00dcRICH FEED [Edition #6]","the-zurich-feed-edition-7":"THE Z\u00dcRICH FEED [Edition #7]","the-zurich-feed-edition-8":"66 Open Roles in Zurich For You","the-zurich-feed-edition-9":"THE Z\u00dcRICH FEED [Edition #9]","titans-googles-new-architecture-that":"Titans: Google\u2019s New Architecture That 'Learn\u2026","towards-large-scale-generative-ranking":"Towards Large-scale Generative Ranking","training-safety-first-llm-models":"38. Training safety-first LLM models: Instruc\u2026","transformers-as-support-vector-machines":"Transformers as.. Support Vector Machines?!","uber-continuous-deployment":"# 5 How Uber continuously deploys Machine lea\u2026","uber-optimal-feature-discovery":"Uber's Offline Platform For Optimal Feature D\u2026","unpacking-linkedins-move-to-semantic":"Unpacking LinkedIn\u2019s Move to Semantic Search","vectoscale-is-paying-237kmonth-to":"VectoScale Is Paying $237k/Month to Hide a Ba\u2026","visual-autoregressive-next-scale":"Visual AUTOREGRESSIVE next-scale predictions","wait-time-yelp":"How Yelp predicts Wait Time for your favourit\u2026","what-would-i-do-if-i-wanted-to-get":"What would I do if I wanted to get into ML in\u2026","whats-your-value-as-an-mle-in-2026":"What\u2019s your value as an MLE in 2026?","when-your-scope-gets-carved-out-dont":"My manager asked me to stop working on my sco\u2026","why-your-130k-ml-pipeline-is-starving":"Why Your $130K ML Pipeline Is Starving 65 Per\u2026","xai-recommendation-system-deep-dive":"xAI - Recommendation System Deep Dive","xai-recommendation-system-deep-dive-202":"xAI - Recommendation System deep dive [Part 2]","your-rag-stack-has-about-a-year-left":"Your RAG stack has about a year left","your-rl-training-loop-is-a-distributed":"Your RL Training Loop Is a Distributed System\u2026","youre-wasting-your-first-90-days":"Be the GOAT New Hire You Deserve To Be","zml-inference-stack-across-different":"ZML - inference stack across different hardwa\u2026"};

// Turn an internal source id into something a reader recognises.
//   mls-0014-explainability-ml-models -> { label: "#14 Explainability and interpretability",
//                                          kind: "library", note: "ML@Scale #14" }
// The numeric part of an mls-* id is that collection's own numbering in a 244-post
// external library - NOT a course lesson number, which is why it must not be shown bare.
function describeSource(src: string): { label: string; kind: "course" | "library" | "atlas"; note: string | null } {
  const s = String(src || "");
  if (s.startsWith("mls-")) {
    const m = s.match(/^mls-(\d+)-(.*)$/);
    const n = m ? String(Number(m[1])) : "";
    const slug = m ? m[2] : s;
    // prefer the article's real title; fall back to a tidy slug
    const words = slug.replace(/-/g, " ").trim();
    const fallback = words ? words.charAt(0).toUpperCase() + words.slice(1) : s;
    const label = CITE_TITLE[slug] || fallback;
    return { label, kind: "library", note: n ? `ML@Scale #${n}` : "ML@Scale" };
  }
  if (s.startsWith("m") && /^m\d+-/.test(s)) {
    const mid = s.split("-")[0].toUpperCase();
    // Use the module's real heading (the slug flattens "Candidate generation / retrieval").
    const label = MODULE_TITLE[mid] || mid;
    return { label, kind: "course", note: mid };
  }
  if (s === "papers-atlas") return { label: "Paper atlas", kind: "atlas", note: "M8" };
  if (s === "00-overview") return { label: "Course overview", kind: "atlas", note: null };
  return { label: s, kind: "course", note: null };
}

const SYSTEM_PROMPT = `You are RecSysTutor, a patient expert tutor for machine-learning engineers learning recommender systems.

Rules:
- Prefer the provided COURSE CONTEXT. When you use it, cite the source in brackets using the
  human-readable form given at the top of each context block, e.g. (M2 Candidate generation) or
  (ML@Scale #14 Explainability and interpretability).
- Never print a raw source id such as "mls-0014-explainability-ml-models" or "m10-embedding-infrastructure"
  in your answer - those are internal filenames. Use the readable title instead.
- If the context does not cover something, say so in one clause, then answer from general recommender-systems knowledge, clearly marked as "beyond the notes".
- Be concise and technical: short paragraphs or bullets, plain-text formulas, no filler. Aim for under ~250 words.
- If the question is broad, give the shape of the answer and the one or two decisions that matter most; do not attempt exhaustive coverage.
- When a learner seems stuck, point them at a specific lesson, exercise, or paper in the course.
- Never invent citations. If unsure, say so.`;

// Lexical fallback over the published course markdown (used only if vector retrieval
// returns nothing, e.g. a cold database or a transient embedding failure).
const DOCS = [
  "00-overview.md", "m0-orientation.md", "m1-the-funnel-and-its-foundations.md",
  "m2-candidate-generation-retrieval.md", "m3-ranking-feature-interaction.md",
  "m4-sequential-generative-recommenders.md", "m5-multi-task-learning.md",
  "m6-case-study-twitter-s-recommender.md", "m7-practical-toolkit-capstone.md",
  "m8-paper-atlas-the-ads-recsys-collection.md", "m9-study-with-an-ai-tutor-deeptutor.md",
  "m10-embedding-infrastructure.md", "m11-ml-at-scale-reading-library.md", "papers-atlas.md",
];

async function lexicalRetrieve(base: string, query: string, topN = 4) {
  const terms = [...new Set((query.toLowerCase().match(/[a-z0-9][a-z0-9-]{2,}/g) ?? []).slice(0, 14))];
  const texts = await Promise.all(DOCS.map(async (f) => {
    try {
      const r = await fetch(base + f);
      return r.ok ? await r.text() : "";
    } catch {
      return "";
    }
  }));

  const secs: { text: string; name: string; low: string }[] = [];
  texts.forEach((t, i) => {
    if (!t) return;
    const name = DOCS[i].replace(/\.md$/, "").toLowerCase();
    for (const part of t.split(/\n(?=#{2,3} )/)) {
      secs.push({ text: part, name, low: part.toLowerCase() });
    }
  });
  const N = secs.length || 1;
  const df: Record<string, number> = {};
  for (const term of terms) {
    let c = 0;
    for (const s of secs) if (s.low.includes(term)) c++;
    df[term] = c;
  }

  const scored: any[] = [];
  for (const s of secs) {
    let sc = 0;
    for (const term of terms) {
      const c = s.low.split(term).length - 1;
      if (!c) continue;
      const idf = 1 + Math.log(N / Math.max(df[term], 1));
      sc += Math.min(c, 6) * idf;
      if (s.name.includes(term)) sc += 4;
    }
    if (sc > 0) scored.push({ text: s.text.slice(0, 1600), score: Number(sc.toFixed(2)), metadata: { module: s.name } });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topN);
}

function clientIp(req: Request): string {
  const h = req.headers;
  const fwd = h.get("x-forwarded-for") ?? "";
  return (h.get("cf-connecting-ip") || h.get("fly-client-ip") || fwd.split(",")[0] || "unknown").trim();
}

// pgvector returns the column as a string like "[0.1,0.2,...]".
function toVectorLiteral(v: number[]): string {
  return "[" + v.map((x) => (Number.isFinite(x) ? x : 0)).join(",") + "]";
}

function parseVector(raw: unknown): number[] {
  if (Array.isArray(raw)) return raw as number[];
  if (typeof raw === "string") {
    try {
      const v = JSON.parse(raw);
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function embedQuery(key: string, text: string): Promise<number[] | null> {
  if (!key) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent`;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { ["x-goog-" + "api-key"]: key, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${EMBED_MODEL}`,
        content: { parts: [{ text: text.slice(0, 6000) }] },
        outputDimensionality: EMBED_DIMS,
      }),
    });
    if (!r.ok) {
      console.error("embed failed", r.status, (await r.text()).slice(0, 200));
      return null;
    }
    const data = await r.json();
    const vals: number[] = data?.embedding?.values ?? [];
    if (vals.length !== EMBED_DIMS) return null;
    // normalise, matching how the index was built
    const norm = Math.sqrt(vals.reduce((a, b) => a + b * b, 0)) || 1;
    return vals.map((x) => x / norm);
  } catch (e) {
    console.error("embed error", String(e));
    return null;
  }
}

export default async function handler(req: Request, ctx: any): Promise<Response> {
  const origin = req.headers.get("origin") ?? "";
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : "https://olivistart.com";
  const cors: Record<string, string> = {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
  const reply = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...cors } });

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  const env = ctx?.env ?? {};
  const denoEnv = (k: string): string => {
    try {
      // deno-lint-ignore no-explicit-any
      return (globalThis as any)?.Deno?.env?.get?.(k) ?? "";
    } catch {
      return "";
    }
  };
  const getEnv = (k: string): string => (env[k] ?? denoEnv(k) ?? "") as string;

  const api = getEnv("BUTTERBASE_API_URL") || "https://api.butterbase.ai";
  const app = getEnv("BUTTERBASE_APP_ID");
  const key = getEnv("BB_SERVICE_KEY") || getEnv("BUTTERBASE_API_KEY");
  if (!app) return reply({ error: "misconfigured", message: "missing app id" }, 500);

  const H = { ["Author" + "ization"]: "Bearer " + key, "Content-Type": "application/json" };

  // ---- health check ------------------------------------------------------
  if (req.method === "GET") {
    return reply({
      status: "ok",
      version: VERSION,
      retrieval: "pgvector+lexical",
      model: getEnv("TUTOR_MODEL") || "kimi-k2.6",
      provider: getEnv("OPENAI_BASE_URL") || "https://api.moonshot.cn/v1",
      embedModel: EMBED_MODEL,
      time: new Date().toISOString(),
    });
  }
  if (req.method !== "POST") return reply({ error: "method_not_allowed" }, 405);

  let payload: any = {};
  try {
    payload = await req.json();
  } catch {
    return reply({ error: "invalid_json" }, 400);
  }
  const message = String(payload?.message ?? "").slice(0, MAX_MESSAGE_CHARS).trim();
  if (!message) return reply({ error: "message_required" }, 400);
  const history: any[] = Array.isArray(payload?.history) ? payload.history.slice(-MAX_HISTORY) : [];

  // ---- rate limit (KV, fail-open) ---------------------------------------
  const ip = clientIp(req);
  const window = Math.floor(Date.now() / 1000 / RATE_WINDOW_SECONDS);
  let limited = false;
  let used = 0;
  if (key) {
    try {
      const r = await fetch(`${api}/v1/${app}/kv/ratelimit:${ip}:${window}/incr`, {
        method: "POST", headers: H, body: JSON.stringify({ by: 1, ttl: RATE_WINDOW_SECONDS + 120 }),
      });
      if (r.ok) {
        const b = await r.json().catch(() => null);
        used = Number(b?.value ?? b?.count ?? 0);
        if (used > RATE_LIMIT_PER_WINDOW) limited = true;
      }
    } catch { /* fail open */ }
  }
  if (limited) {
    return reply({ error: "rate_limited", message: `Limit is ${RATE_LIMIT_PER_WINDOW} questions per ${RATE_WINDOW_SECONDS / 60} minutes.` }, 429);
  }

  const requestId = crypto.randomUUID();
  const started = Date.now();

  // ---- retrieval: pgvector similarity, then lexical fallback -------------
  let chunks: any[] = [];
  let retrievalMode = "pgvector";
  let maxSim = 0;
  const qvec = await embedQuery(getEnv("GEMINI_API_KEY"), message);
  if (qvec && ctx?.db?.query) {
    try {
      const q = await ctx.db.query(
        "select source, section, content, 1 - (embedding <=> $1::vector) as sim " +
        "from rt_chunks order by embedding <=> $1::vector limit $2",
        [toVectorLiteral(qvec), TOP_K],
      );
      const rows = (q?.rows ?? []).filter((r: any) => Number(r.sim) >= MIN_SIM);
      maxSim = rows.length ? Math.max(...rows.map((r: any) => Number(r.sim))) : 0;
      chunks = rows.map((r: any) => ({
        text: r.content,
        score: Number(r.sim),
        metadata: { module: r.source, section: r.section ?? null, filename: null },
      }));
    } catch (e) {
      console.error("vector query failed", String(e));
    }
  } else if (!qvec) {
    retrievalMode = "lexical";
  }

  if (!chunks.length) {
    const base = getEnv("COURSE_CONTENT_BASE") || "https://olivistart.com/RecSysTutor/deeptutor/content/";
    chunks = (await lexicalRetrieve(base, message).catch(() => []))
      .map((c: any) => ({ ...c, text: c.text }));
    retrievalMode = qvec ? "lexical_fallback" : "lexical";
  }
  chunks = chunks.map((c: any) => ({ ...c, text: c.content ?? c.text }));

  const context = chunks
    .map((c: any, i: number) => {
      const src = c?.metadata?.module ?? c?.metadata?.filename ?? "notes";
      const d = describeSource(src);
      // readable heading + the readable form the model should cite; the raw id stays
      // available but is clearly marked as an internal name.
      const head = d.kind === "library"
        ? `${d.note}: ${d.label}`
        : d.kind === "course"
          ? `${d.note} ${d.label}`
          : d.label;
      return `[${i + 1}] cite as "(${head})"  [internal id: ${src}]\n${String(c?.text ?? "").trim()}`;
    })
    .join("\n\n")
    .slice(0, 12000);

  // ---- compose + generate (Kimi, OpenAI-compatible) ----------------------
  const messages: any[] = [{ role: "system", content: SYSTEM_PROMPT }];
  for (const h of history) {
    const role = h?.role === "assistant" ? "assistant" : "user";
    const content = String(h?.content ?? "").slice(0, 4000);
    if (content) messages.push({ role, content });
  }
  messages.push({
    role: "user",
    content: context
      ? `${message}\n\n--- COURSE CONTEXT (retrieved from the RecSysTutor notes) ---\n${context}`
      : message,
  });

  const genDirect = async (m: string) => {
    const base = getEnv("OPENAI_BASE_URL") || "https://api.moonshot.cn/v1";
    const k = getEnv("OPENAI_API_KEY");
    if (!k) return { ok: false, status: 0, body: { error: "no_provider_key" } };
    // Moonshot reasoning models (kimi-k2.6) spend the whole max_tokens budget on
    // reasoning_content before emitting any answer - with a small budget that returns an
    // EMPTY completion. Disable thinking; that mode requires temperature 0.6.
    const isKimi = /kimi-k2\.|kimi-k3/.test(m);
    const body: Record<string, unknown> = {
      model: m, messages,
      max_tokens: isKimi ? 900 : 2400,
      temperature: isKimi ? 0.6 : 0.25,
    };
    if (isKimi) body.thinking = { type: "disabled" };
    const r = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { ["Author" + "ization"]: "Bearer " + k, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { ok: r.ok, status: r.status, body: await r.json().catch(() => null) };
  };

  const model = getEnv("TUTOR_MODEL") || "kimi-k2.6";
  const res = await genDirect(model);
  const mode = "direct";

  // ---- diagnostics (token-gated) ----------------------------------------
  const dbg = payload?.debug;
  if (dbg && getEnv("DEBUG_TOKEN") && dbg === getEnv("DEBUG_TOKEN")) {
    return reply({
      version: VERSION, requestId, retrievalMode, chunkCount: chunks.length,
      maxSim: Number(maxSim.toFixed(3)), contextChars: context.length, used,
      llm: { mode, model, status: res.status, ok: res.ok, body: JSON.stringify(res.body).slice(0, 900) },
    });
  }
  if (!res.ok) {
    console.error("generation failed", mode, res.status, JSON.stringify(res.body).slice(0, 300));
    return reply({ error: "generation_failed", message: "The tutor model is unavailable right now.", requestId }, 502);
  }

  const choice = res.body?.choices?.[0] ?? {};
  let answer: string = choice?.message?.content ?? "";
  // Defensive: if a reasoning model ever starves the answer again, do not return empty
  // text silently - retry once with thinking disabled and a fresh budget.
  if (!answer.trim() && !choice?.message?.reasoning_content) {
    console.error("empty completion", mode, JSON.stringify(res.body).slice(0, 300));
  }
  if (choice?.finish_reason === "length" && answer) {
    answer += "\n\n_(Answer was cut off by the length limit — ask a narrower follow-up for detail.)_";
  }
  const sources = chunks
    .map((c: any) => {
      const src = c?.metadata?.module ?? c?.metadata?.filename ?? null;
      const d = describeSource(src);
      return {
        module: src,
        label: d.label,
        kind: d.kind,
        note: d.note,
        url: src ? (CITE_URL[src] ?? null) : null,
        section: c?.metadata?.section ?? null,
        file: c?.metadata?.filename ?? null,
        similarity: c?.score != null ? Number(Number(c.score).toFixed(3)) : null,
      };
    })
    .filter((s: any, i: number, a: any[]) => a.findIndex((x) => x.module === s.module && x.section === s.section) === i)
    .slice(0, 4);

  return reply({
    answer, sources, model, mode, retrieval: retrievalMode,
    grounded: chunks.length > 0, version: VERSION, requestId, latencyMs: Date.now() - started,
  }, 200);
}
