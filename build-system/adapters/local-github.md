# Protected local GitHub adapter

This adapter performs real `gh api` and `git` operations when the controller calls it. The delivered tests replace those commands with local stubs. No GitHub write was performed to test this package.

It supports repository preflight, publishing an exact reviewed commit to a new named branch, creating or finding its pull request, checking CI, merging with `squash` or `merge`, and checking CI on the actual merged commit. Rebase and merge queues are not supported by this adapter. It does not implement agent isolation, the model gateway, quality checks or deployments.

## Configure once

Run the controller under a protected OS account. Agents must not be able to read its files, processes, environment or credential store. Directory permissions alone do not isolate an agent running as that same account. The host isolation layer must establish that boundary before treating the adapter's configured credential placement as isolation proof.

Create an existing GitHub repository with an initial commit. Set its default branch and classic branch protection. Require branches to be up to date before merging, enforce checks for administrators, disable force pushes and deletion, and keep bypass allowances empty. Use an ordinary user with the standard repository write role, not an owner, administrator, custom role or installation-only app identity, for merge writes. The adapter reads this policy and identity at preflight and immediately before merging; missing or ambiguous evidence blocks the run. Pin at least one required check on PR commits and at least one check on commits pushed to the default branch. Both lists may name the same check. CI must actually run on both commit types; a PR-only workflow will leave the post-merge gate waiting.

As the controller's OS account, create a private credential directory and log in once. For example, after the administrator creates and assigns the protected control directory:

```sh
mkdir -m 700 /srv/oxagen-control/gh
GH_CONFIG_DIR=/srv/oxagen-control/gh /usr/local/bin/gh auth login --hostname github.com --git-protocol https --web
GH_CONFIG_DIR=/srv/oxagen-control/gh /usr/local/bin/gh api repos/OWNER/REPOSITORY --jq '{id,full_name,default_branch}'
```

Use the displayed numeric repository ID in configuration. Select the ordinary merge user described above. It needs content/branch writes and pull-request writes, plus reads for check runs and commit statuses. Reading classic branch protection requires Administration:read permission. If the merge user cannot read that policy, supply a separate protected `policyTokenFile` for a read-only observer with that permission. Do not make the merge user an administrator to solve a read-access problem. Updating workflow files also needs the applicable workflow permission. Grant only the rights required by the selected authentication method and repository. The adapter cannot turn successful login into missing repository permissions.

For noninteractive use, prefer `tokenFile`: have the operator or secret manager write the merge user's token into a regular file inside the control root, owned by the controller OS account with mode 0600. Put only its path in configuration. The file cannot be a symlink. The adapter reads it into `GH_TOKEN` for github.com (or `GH_ENTERPRISE_TOKEN` for an Enterprise Server host) only inside trusted child processes. No keyring session or inherited desktop environment is required. `authConfigDir` must still exist with mode 0700. A normal `gh auth login` without tokenFile depends on the host's credential-store availability and is not guaranteed by the adapter's minimal environment.

The optional `policyTokenFile` follows the same private-file rules. Its credential is used only for GET requests that inspect this repository's branch protection and the writer's repository role. It is never used for Git, PR creation, merge, or other write calls. If neither identity can read the required policy, preflight fails closed.

Do not put a token in an agent prompt, configuration mounted into its workspace, or inherited agent environment. This adapter reads protected `gh` credentials and passes a minimal environment to its own children. Git uses an explicit protected `gh` credential helper; global Git configuration and hooks are disabled.

Place this configuration under `config.local.github` (`config.github` is also accepted):

```json
{
  "repository": "OWNER/REPOSITORY",
  "repositoryId": 123456,
  "hostname": "github.com",
  "defaultBranch": "main",
  "mergeMethod": "squash",
  "ghPath": "/usr/local/bin/gh",
  "gitPath": "/usr/bin/git",
  "authConfigDir": "/srv/oxagen-control/gh",
  "tokenFile": "/srv/oxagen-control/github-writer-token",
  "policyTokenFile": "/srv/oxagen-control/github-policy-reader-token",
  "apiVersion": "2022-11-28",
  "commandTimeoutSeconds": 30,
  "gitTimeoutSeconds": 600,
  "ciWaitSeconds": 1800,
  "requiredChecks": [
    {"kind": "check_run", "name": "test", "appId": 15368}
  ],
  "postMergeRequiredChecks": [
    {"kind": "check_run", "name": "test", "appId": 15368}
  ]
}
```

The check name and producer IDs above are examples, not discovery results. Read real check runs for a known commit and pin their exact names and app IDs. Legacy commit statuses use `{"kind":"status","name":"security","creatorId":123,"appId":456}`. Every pre-merge required check, including a legacy status, must have an exact positive `appId` in GitHub's classic required-check binding. A creator-only or any-app binding is insufficient for live merge in this profile. An empty check list is rejected. A skipped, neutral, missing, queued or failed check does not pass. Every page is fetched. Check runs use the latest attempt from the pinned app; commit statuses use the latest status for the context and verify its creator.

## Controller interface

`initializeRepository(config)` initializes or verifies protected `controlDir/product.git`, fetches the existing default branch, and returns `{repository, repositoryId, defaultBranch, head}`. It preserves an existing local `main` tip so local design commits can remain unpublished. `preflight(config)` returns that object under `repository`, plus configured check lists and placement flags. The full controller must separately prove isolation, budget and data protection.

`execute(request, config)` accepts `pull_request`, `ci`, `merge`, or `post_merge_ci`. Requests include `id`, `batchId`, and `payload` with `head`, `base`, `phase`, a passing review of that head, and the pinned repository under `targets.repository`. Later gates carry `pr`; post-merge CI carries the merge receipt under `previousReceipts.merge`. The base is the exact remote commit against which the candidate was reviewed. Any local-only phase-zero files included in the first PR must be part of that review and the controller's certification checks. Design-phase requests cannot publish.

Successful receipts include both `operationId` and `opId`, zero adapter cost, `head` identifying the reviewed commit, and `base` identifying its reviewed base. This zero cost describes the Git adapter; it does not claim GitHub Actions or hosting are free. Merge receipts also bind `reviewedBase`, `checkedBase`, `mergeStrategy`, `mergedHead`, both trees, the parents and the PR. The merged commit is fetched into the protected repository. Post-merge CI names that actual commit as `checkedHead`, even when a squash changes its commit ID.

## Merge races and recovery

GitHub's merge endpoint can require an exact PR head SHA. It does **not** offer an expected-base compare-and-swap through that parameter. This adapter therefore supports a measured server protection profile: strict up-to-date checks, exact context/app bindings, enforced administrator checks, no force push/delete or bypass allowances, and a proved non-admin standard write identity. That server gate must reject a candidate whose target branch advanced beyond the reviewed base. The adapter reads the gate again immediately before sending and stores its proof before the write.

The receipt still reports `baseCompareAndSwap: false`: the API itself has no expected-base field. Trusted administrators can change GitHub policy; this adapter does not prevent an administrator from changing the rules after they were read. It always proves the resulting commit has the expected parent(s) and exactly the reviewed tree. If an unexpected merge nonetheless occurs, the merge may already have happened; the adapter reports an uncertain effect and blocks continuation. It cannot undo the shared-branch write by failing post-merge CI. Unsupported ruleset-only, custom-role, application-only or merge-queue policies remain blocked until a separate measured profile exists.

Operation files under `github-operations/` bind each ID to the request and pinned Git policy. Write intent is flushed before a remote write. A repeat with a changed request is rejected. A lost reply is reconciled using `execute({kind:"reconcile", operation: originalRequest}, config)`: it reads the existing named PR or proves the actual merge. It never repeats an uncertain create or merge write. If no effect can yet be proved, it stays unknown. A partially published branch may need explicit operator repair; absence in one read is not proof that a prior write cannot still arrive.

Git and gh children inherit the trusted wrapper's process group. The outer controller must terminate and verify the entire wrapper group on normal exit, failure, timeout, or cancellation before adopting results or reconciling a write. The command helper itself can kill its direct child on timeout, but does not claim that all descendant helpers stopped; such failures return an unknown outcome with `allChildrenStopped: false`. No separate detached command group may survive wrapper teardown.

CI polling waits up to `ciWaitSeconds`, capped at the operation deadline the engine passes minus a return margin, and backs off from one second to one minute with jitter between reads. `commandTimeoutSeconds` (at most 120) bounds `gh api` calls; `gitTimeoutSeconds` (at most 3600) bounds fetch and push separately, because a real repository over a slow link exceeds an API-sized timeout. Polling checks the controller's `CANCEL` file between reads. The last 4 KB of a failed command's stderr is kept in a private `github-operations/<id>.stderr.log` (mode 0600) and never enters a receipt. Terminal failed checks return `failed` with proof that this read-only gate caused no external effect; missing or pending checks return `unknown`. A pending gate can be rechecked through read-only reconciliation, including while `CANCEL` remains present. Reconciliation may recover a local stale lock only after proving its recorded same-host PID is dead. A live, reused, foreign-host, incomplete or otherwise ambiguous lock remains blocked. Operator repair of such a lock requires holding the controller lock and proving all prior controller processes have stopped. Never delete operation evidence to turn an uncertain write into a new attempt.

Sources: [GitHub pull request merge API](https://docs.github.com/en/rest/pulls/pulls#merge-a-pull-request), [check-run API](https://docs.github.com/en/rest/checks/runs#list-check-runs-for-a-git-reference), [commit-status API](https://docs.github.com/en/rest/commits/statuses#list-commit-statuses-for-a-reference), [branch protection](https://docs.github.com/en/rest/branches/branch-protection#get-branch-protection), [repository permissions](https://docs.github.com/en/rest/collaborators/collaborators#get-repository-permissions-for-a-user), and [gh api](https://cli.github.com/manual/gh_api).
