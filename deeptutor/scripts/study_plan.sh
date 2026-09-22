#!/usr/bin/env bash
# Generate a personalised mastery path across the course.
#   ./scripts/study_plan.sh "recommender systems, beginner to generative recommenders"
set -euo pipefail
kb="${KB:-recsys-course}"
goal="${1:-recommender systems, from candidate generation to generative recommenders}"
exec deeptutor run mastery_path "$goal" --kb "$kb" -l en
