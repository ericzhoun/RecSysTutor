#!/usr/bin/env bash
# Start an interactive, grounded tutor session over the course.
set -euo pipefail
kb="${KB:-recsys-course}"
exec deeptutor chat --kb "$kb" -t rag -t web_search
