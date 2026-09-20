# Build and publish exact release images

`local-artifacts.mjs` builds the API, gateway and worker images from the actual merged commit in the protected Git repository. CI must have passed on that commit. It makes a fresh source copy, removes Git metadata, and rejects symlinks and submodules in this narrow profile. It never uses the agent's mutable worktree.

The builder exports OCI archives. Skopeo reads each archive's image digest and checks the source label and Linux/amd64 platform. It copies those exact image bytes to both accounts with `--preserve-digests`. ECR must use immutable tags. The adapter then checks the digest recorded by ECR. The release bundle binds the source commit, tree, image digests, target URIs, settings and local archive hashes.

## One-time setup

Use a dedicated Linux build host or VM with Docker Engine, Buildx, Skopeo, Git and AWS CLI v2. The existing agent sandbox remains a separate profile. This build host runs reviewed Dockerfiles after certification. It has not been qualified on macOS or Docker Desktop.

Set `local.artifacts` in the protected controller configuration:

- `dockerCommand`, `skopeoCommand`: absolute installed command paths.
- `dockerHost`: the explicit local Unix Docker socket.
- `builderName` and `builderContainer`: one Docker-container Buildx builder and its exact `buildx_buildkit_NAME0` container.
- `buildxConfigDir`: private Buildx metadata under the controller root.
- `builderImageId`: the exact installed BuildKit image ID.
- `builderMemoryBytes`, `builderCpuQuota`, `builderCpuPeriod`: finite limits, checked against the actual container before work.
- `timeoutSeconds`: at most 14,400 seconds per artifact operation.
- `maxImageBytes`: at most 4 GiB per OCI archive. The host also needs a disk quota; this size check happens after export.
- `baseImages`: reviewed public dependency images, each pinned by digest.
- `dockerfiles`: exact source paths for `api`, `gateway`, and `worker`.
- `targets.staging` and `targets.production`: separate account IDs, regions, ECR-only push profiles, exact role ARNs and a repository name for each image.

The reviewed product must supply real Dockerfiles. No placeholder application is built. Prepare public dependency images in a separately reviewed step. The Dockerfiles use those pinned images, since build commands have no network. Remote `ADD`, external `COPY --from`, custom frontends, mount directives and network overrides are rejected. The BuildKit daemon may fetch the approved public base images; that is separate from the build command's network setting.

Create the single-node builder explicitly during host setup. Use `BUILDX_CONFIG` pointing at `buildxConfigDir`, the configured local Docker socket, the `docker-container` driver, a digest-pinned BuildKit image and the configured memory, CPU quota and CPU period driver options. Inspect it and record its installed image ID. The adapter checks the builder endpoint and actual container. It refuses host-folder mounts and credential environment variables in that container. Use host-level disk and process limits as well. Do not share this builder with untrusted jobs.

The build receives no AWS profile, provider key, registry login or host secret mount. AWS credentials are used only by host-side AWS CLI calls. Registry tokens are stored in private, temporary auth files used by Skopeo, then removed. An abrupt host kill can leave one of these files under the protected operation directory; remove it during reviewed recovery. Avoid shell tracing and raw command-output logging on the host.

The artifact publisher role can push only to the three configured repositories. It cannot deploy services, read database secrets or authorize production. Deployment uses a separate role. The two target accounts must differ.

## Crash handling

Every build or push records intent before starting. Completed bundles can be returned again without rebuilding. A lost reply does not count as a failed upload. The saved intent includes the expected image digest, archive hash, target and immutable tag. Recovery makes read-only identity and image lookups. If all saved images are already present at their exact digests, it can save and return the completed bundle. Missing or mismatched images keep the run blocked. It never rebuilds or repushes automatically.

A killed Docker client does not prove that its BuildKit job stopped. Confirm the dedicated builder is idle or stop and recreate it before a reviewed new attempt. Retain exact archives and hashes. Read the target digest to decide whether an upload finished. Do not delete the uncertain operation to make the runner retry. Cloud release recovery follows the separate [ECS adapter rules](local-release.md).

## Validation limits and references

Tests use real local Git snapshots with simulated Docker, Skopeo and AWS replies. They do not prove live container builds, registry uploads, disk quotas or cloud IAM behavior. Those need an approved staging qualification after design certification.

The commands follow the primary [Docker OCI exporter reference](https://docs.docker.com/build/exporters/oci-docker/), [Docker-container driver limits](https://docs.docker.com/build/builders/drivers/docker-container/), [Buildx inspect output](https://docs.docker.com/reference/cli/docker/buildx/inspect/), [Skopeo copy reference](https://github.com/containers/skopeo/blob/main/docs/skopeo-copy.1.md), [Skopeo inspect reference](https://github.com/containers/skopeo/blob/main/docs/skopeo-inspect.1.md), and [ECR image lookup](https://docs.aws.amazon.com/cli/latest/reference/ecr/describe-images.html).
