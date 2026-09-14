#!/bin/sh
set -eu

# Keep the Render free service focused on the n8n server itself.
# Database CLI bootstrap/import was causing PostgreSQL connection contention
# and prevented the HTTP service from becoming stable.
exec n8n start
