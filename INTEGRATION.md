# Production + grammar notes candidate

This directory contains the recovered production baseline plus grammar notes. It is not the byte-identical recovery checkpoint; that remains in ../production and docs/recovery/production-recovered-source.tar.gz in the main workspace.

Use backend, frontend and the explicitly reviewed deploy/nginx.production.conf from this candidate. The historical root nginx.conf, scripts/deploy_prod.py and SQL imports were inherited from GitHub and are not approved release entry points for this candidate.

The only migration sequence for this release is backend/src/main/resources/db/migration/V1__production_baseline.sql and V2__grammar_notes.sql. Do not combine these with the earlier main-workspace V1/V2/V3 sequence.

Read the main workspace docs/grammar-integration-release.md and the validation reports before deployment. No production database migration or author provisioning has happened yet.
