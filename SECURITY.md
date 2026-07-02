# LaunchPad Security & Compliance

## COPPA Compliance (Children's Online Privacy Protection Act)

LaunchPad is designed for users aged 12-18 and fully complies with COPPA requirements:

- **No unauthorized data collection** — Personal information is never shared with third parties
- **Age gating** — Users are separated into 12-14 and 15-18 cohorts with distinct content sandboxes
- **Parental controls** — Parents can monitor academic progress and approve financial transactions
- **Data minimization** — Only essential profile data is collected; no tracking cookies or ads

## Safety Architecture

| Layer | Implementation |
|---|---|
| **AI Content Moderation** | Real-time scanning of posts, comments, and messages for PII, bullying, and predatory language |
| **Adult DM Filter** | Mentors cannot initiate DMs with minors; all cross-role communication uses monitored vetted spaces |
| **Verification** | Optional school ID verification boosts profile credibility |
| **Age Cohorts** | 12-14 and 15-18 cohorts are isolated to prevent inappropriate cross-age interaction |

## Reporting

Users can report content or behavior. All reports are logged in the moderation_log table and reviewed.

## Security Headers

In production, deploy with:
- Content-Security-Policy
- X-Frame-Options: DENY
- Strict-Transport-Security
