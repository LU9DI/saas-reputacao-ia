FROM python:3.11-slim AS python-builder

FROM n8nio/n8n:2.33.4
USER root
COPY --from=python-builder /usr/local/bin/python* /usr/local/bin/
COPY --from=python-builder /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=python-builder /usr/local/include/python3.11 /usr/local/include/python3.11
COPY n8n-workflow.json /home/node/n8n-workflow.json
COPY start-n8n.sh /home/node/start-n8n.sh
RUN chmod +x /home/node/start-n8n.sh && chown node:node /home/node/n8n-workflow.json /home/node/start-n8n.sh
USER node
ENTRYPOINT ["/home/node/start-n8n.sh"]
