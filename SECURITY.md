# Security

## Reporting a vulnerability

Please do not post credentials, private library content, or exploitable vulnerability details in a public issue. If GitHub’s **Security → Report a vulnerability** option is available for this repository, use it to send a private report. If it is unavailable, open an issue asking the maintainer for a private reporting channel without disclosing the vulnerability itself.

Include the affected version/commit, deployment method, impact, and minimal reproduction steps. Redact secrets and personal data. No response-time commitment or supported-version matrix is currently defined.

## Deployment boundaries

Open Prompt Gallery is a single-admin application, without multi-user isolation or password recovery. Complete first-run setup on a trusted network before exposing a new instance, use HTTPS and a reverse proxy for public access, and keep database credentials and backups private.

The database contains the password hash and session-signing secret. Protect it along with the uploaded images. See the [deployment guide](deploy/README.md) for account behavior, proxy settings, persistent storage, and paired backups.
