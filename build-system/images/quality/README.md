# Build a pinned quality image

The quality container has no network, model socket, host Git metadata, or credentials. Docker logging is disabled. Tests read a fresh copy of the reviewed commit, not the implementation worktree. Dependency installation is a separate, operator-reviewed image build. The supplied Dockerfile uses a Node 22 or newer base and installs the exact npm lockfile with lifecycle scripts disabled.

1. Copy this directory to a new image build directory outside agent-writable paths.
2. Copy only the reviewed project's `package.json` and `package-lock.json` into that directory. Never copy `.npmrc`, credentials, or the whole checkout. Review registry destinations and dependency sources in both files first.
3. Choose an approved Node base by digest. Supply that exact reference to `NODE_IMAGE`; there is no default image or floating fallback.
4. Build with an explicit argv equivalent to the following command, after checking its paths and digest:

```text
docker build --pull=false --build-arg NODE_IMAGE=node:22-bookworm-slim@sha256:<APPROVED_BASE_DIGEST> --tag oxagen-quality-reviewed /absolute/reviewed-quality-image
```

This build uses the operator's approved network to fetch the reviewed dependencies. It is not agent execution. No build secrets or host credential files are mounted. Native modules or required install scripts need a separately reviewed Dockerfile and build step. Private dependencies need an explicit credential-safe image build process; this sample does not silently forward registry credentials.

Publish through the customer's approved registry if necessary, inspect the resulting repository digest, and set `local.quality.image` to `repository@sha256:<RESULT_DIGEST>`. Preload that exact image on the Docker host before running. The runtime profile does not pull an image or install packages from a network. Rebuild and repin after the lockfile or required toolchain changes.

Use `workspaceMode: "scratch-copy"` for a check that needs dependencies or writes build output. Copy the prebuilt dependencies using a preparation argv in the same disposable container:

```json
{
  "id": "unit",
  "command": "/usr/local/bin/node",
  "args": ["--test", "test/unit.test.mjs"],
  "timeoutSeconds": 300,
  "workspaceMode": "scratch-copy",
  "prepare": [
    {
      "command": "/bin/cp",
      "args": ["-R", "/opt/dependencies/node_modules", "/workspace/node_modules"]
    }
  ]
}
```

The complete list is configured by batch ID in `local.quality.commandsByBatch`. Each product batch must name actual checks. There is no pass-through default. Arguments are literal: shell operators, environment substitution, and filename globs are not expanded. The image includes `/opt/oxagen/quality-launcher.mjs`; it starts preparation and test commands with argv, stops after the first failed step, and reports their actual exits. It never sends test output to the controller. The outer Docker executor enforces the total deadline and removes the whole container and its child processes.

The committed source is mounted read-only at `/source`. `/workspace` is either that read-only source or a separate disposable writable copy. Use the controller's non-root UID and GID. The supplied local runner profile does not support a root controller, rootless Docker, or remapped user namespaces. `local.quality.dockerHost` names a local Unix socket and defaults to `unix:///var/run/docker.sock`; saved Docker contexts and remote daemons do not select the destination. The source clone excludes untracked files and Git metadata. Submodules are rejected until their exact content is explicitly supported; missing dependencies, unsupported source layouts, absent images, and failed checks block the quality gate.

Interrupted quality operations retain their scratch data until reconciliation confirms that every deterministic operation container is absent. A known failed test or confirmed stopped executor returns a zero-cost failure with no outside effect. Unconfirmed cleanup stays blocked; a timeout alone does not prove the test tree stopped.
