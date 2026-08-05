# Control-plane ingress

Phase 1's third layer — `PLATFORM_ARCHITECTURE.md` § 3, § 5.1, § 10.

The control plane is separated by **four** independent mechanisms. Three are in
the application repositories and are already enforced:

1. reserved namespaces in permission matching (`hasPermission`)
2. `ControlPlaneGuard`, which asserts the boundary structurally and now also
   requires MFA on the session (§ 5.2)
3. a separate frontend deployable, `unierp-console`, on its own origin
4. **this** — restricted ingress and a separate IdP realm

## What this directory is, and is not

These manifests are the declarative form of layer 4. **Committing them does not
make the control plane network-restricted** — they must be applied to a cluster,
and the IdP realm must exist. Until then layers 1–3 carry the boundary, which is
why they were built first and why the guard fails closed.

Recording that plainly matters: a manifest in a repository is easily mistaken
for a control in production, and this document exists so nobody makes that
mistake reading the tree.

## Files

| File                        | Purpose                                                        |
| :-------------------------- | :------------------------------------------------------------- |
| `ingress-allowlist.yaml`    | Traefik middleware — source-IP allowlist on the console origin  |
| `console-ingress.yaml`      | IngressRoute for `admin.unierp.internal`, no public DNS record  |
| `idp-realm-console.json`    | IdP realm requiring MFA, short sessions, no password-only flow  |
