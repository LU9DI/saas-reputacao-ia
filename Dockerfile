FROM python:3.11-slim AS python-builder

FROM n8nio/n8n:2.33.4
USER root
COPY --from=python-builder /usr/local/bin/python* /usr/local/bin/
COPY --from=python-builder /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=python-builder /usr/local/include/python3.11 /usr/local/include/python3.11
USER node
