ARG NODE_IMAGE
FROM ${NODE_IMAGE}
RUN ["/usr/bin/timeout", "--version"]
WORKDIR /opt/dependencies
COPY package.json package-lock.json ./
RUN ["npm", "ci", "--ignore-scripts", "--no-audit", "--no-fund"]
COPY quality-launcher.mjs /opt/oxagen/quality-launcher.mjs
USER 1000:1000
WORKDIR /workspace
