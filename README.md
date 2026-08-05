# unierp-infra

> Part of **[UniERP](https://github.com/kannan19302/UniERP)** — an open-source, self-hostable multi-tenant application platform.
> [Repository map](https://github.com/kannan19302/UniERP#repository-map) · [Architecture](https://github.com/kannan19302/UniERP#how-the-pieces-fit-at-runtime) · [Contributing](https://github.com/kannan19302/UniERP/blob/main/CONTRIBUTING.md) · [Security](https://github.com/kannan19302/UniERP/blob/main/SECURITY.md)

**Layer L7 — Operations** of the [UniERP](https://github.com/kannan19302/unierp-platform) platform.
Depends on: manifests only.

## What this is

Compose stacks, Kubernetes overlays, the control-plane ingress, the package registry, Grafana dashboards, alerts and runbooks.

## The invariant this repository owns

An alert without a runbook fails CI. Environments are overlays, not repositories — splitting infrastructure from infrastructure is how the manifest and the app come to disagree.

## The rule that applies everywhere

A repository may depend only on published artifacts of a **strictly lower
layer** — never sideways within a layer, never upward. A cycle is not
discouraged; it is unrepresentable, because the lower layer's package cannot
name the higher one.

See the [platform overview](https://github.com/kannan19302/unierp-platform) for the full map, and
[`PLATFORM_ARCHITECTURE.md`](https://github.com/kannan19302/unierp-workspace) § 4.2 for
the reasoning.

## Licence

AGPL-3.0.
