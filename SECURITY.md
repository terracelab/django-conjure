# Security Policy

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report vulnerabilities privately to **security@terracelab.dev**, or via GitHub's
[private vulnerability reporting](https://github.com/terracelab/django-conjure/security/advisories/new).

Include, where possible:

- affected package(s) and version(s) (`django-conjure` and/or `@terracelab/conjure-web`)
- a description and impact assessment
- reproduction steps or a proof of concept

## What to expect

| Stage | Target |
|---|---|
| Acknowledgement | within 3 business days |
| Initial assessment | within 7 business days |
| Fix / disclosure plan | coordinated with you before public disclosure |

We credit reporters in the release notes unless you ask us not to.

## Supported versions

Conjure follows SemVer. Security fixes land on the **latest minor** release; older minors
receive fixes only at maintainers' discretion.

| Version | Supported |
|---|---|
| latest `0.x` minor | ✅ |
| older `0.x` | ⚠️ best effort |

## Scope notes

- The REST surface (`/conjure/*` + the schema JSON) is the public contract. All write endpoints
  enforce `is_staff` plus Django model/action permissions **server-side** — frontend visibility
  controls are UX only and never a security boundary.
- PII-sensitive actions (e.g. exports) must be implemented as server endpoints; see the
  [actions & permissions](https://conjure.terracelab.dev/actions-permissions/) docs.
