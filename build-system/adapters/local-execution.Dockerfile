# Build on the qualified Linux host, then configure the resulting immutable digest.
# Supply a reviewed Node22+ Debian image as registry/name@sha256:... .
ARG NODE_IMAGE
FROM ${NODE_IMAGE}
ARG CODEX_VERSION=0.155.1
ARG CLAUDE_VERSION=2.1.278
USER root
RUN apt-get update && apt-get install -y --no-install-recommends git coreutils ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && npm install --global "@openai/codex@${CODEX_VERSION}" "@anthropic-ai/claude-code@${CLAUDE_VERSION}" \
 && npm cache clean --force \
 && test -x /usr/bin/timeout && test -x /usr/local/bin/node \
 && codex --version && claude --version
# No credentials, user configuration, Docker socket, or workspace is copied here.
# Runtime assigns a non-root UID/GID; /home/agent is a fresh private tmpfs.
WORKDIR /workspace
