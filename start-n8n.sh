#!/bin/sh
set -eu

echo "[n8n-bootstrap] starting n8n"

# Keep the Render free service focused on the n8n server itself. Running the
# n8n CLI against the same PostgreSQL database from inside the startup process
# caused connection timeouts and container restarts. Workflow import/publish
# must not block the HTTP server startup.
exec n8n start
