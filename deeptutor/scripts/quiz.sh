#!/usr/bin/env bash
# Generate a quiz on any topic from the course notes.
#   ./scripts/quiz.sh "multi-task learning: MMoE and ESMM" 5
set -euo pipefail
kb="${KB:-recsys-course}"
topic="${1:-candidate generation and ranking}"
n="${2:-5}"
exec deeptutor run deep_question "$topic" --kb "$kb" --config "num_questions=$n" -l en
