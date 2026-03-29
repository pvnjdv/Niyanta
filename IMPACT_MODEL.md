# Niyanta AI Impact Model

This document gives a back-of-envelope estimate of business impact for Niyanta AI. The goal is not forecast precision; the goal is defensible logic that shows how time saved, cost reduced, and revenue recovered can be estimated from actual operational volumes.

## Executive Summary

For a mid-sized company using Niyanta for invoice processing, document intake, procurement approvals, onboarding/access workflows, and incident triage, a reasonable base-case estimate is:

- Time saved: about 308 hours per month
- Labor savings: about ₹1,49,76,900 per year
- Cost reduced: about ₹64,80,000 per year
- Revenue recovered: about ₹57,60,000 per year
- Total modeled annual impact: about ₹2,72,16,900 per year

## Scope of the Model

This model assumes Niyanta is used for:

- Finance document and invoice processing
- Procurement approval routing and policy checks
- HR and IT onboarding/access workflows
- Document classification and extraction
- Incident triage, SLA awareness, and workflow monitoring

It does not attempt to count every possible upside. It excludes secondary benefits such as better employee experience, faster audit preparation, improved policy consistency, and the option value of reusable workflow templates.

## Core Assumptions

### Company profile

- 300 to 800 employees
- Centralized finance, HR, IT, and operations teams
- Mixed human-in-the-loop and autonomous workflow execution
- Local deployment with SQLite and local storage, plus Groq-backed reasoning

### Volume assumptions

| Workflow area | Assumed monthly volume |
| --- | ---: |
| Invoices processed | 1,500 |
| Procurement requests | 250 |
| Documents classified/extracted | 500 |
| Onboarding and access cases | 30 |
| Operational/security incidents | 80 |

### Economic assumptions

| Assumption | Value |
| --- | ---: |
| Blended loaded labor rate | ₹4,050/hour |
| Revenue-facing hires per year | 12 |
| Productive days recovered per revenue-facing hire | 5 days |
| Realized revenue per recovered productive day | ₹54,000/day |
| At-risk renewals affected by faster incident response | 4 per year |
| Average renewal value | ₹18,00,000 ARR |
| Probability of saving each at-risk renewal | 35% |

## Impact Formulas

### 1. Time saved

Annual labor savings are estimated with:

`annual labor savings = monthly volume × minutes saved per item ÷ 60 × loaded labor rate × 12`

### 2. Cost reduced

Cost reduction is estimated from avoidable leakage and preventable service costs:

- payment leakage avoided
- off-contract or policy-violating spend reduced
- SLA credits or operational penalties avoided

### 3. Revenue recovered

Revenue recovery is estimated from:

- faster onboarding of revenue-producing employees
- fewer customer-impacting failures that put renewals at risk

## Base-Case Time Saved Model

| Workflow area | Manual time | With Niyanta | Minutes saved | Monthly hours saved | Annual labor value |
| --- | ---: | ---: | ---: | ---: | ---: |
| Invoice processing | 12 min | 4 min | 8 min | 200.0 | ₹97,20,000 |
| Procurement approvals | 18 min | 8 min | 10 min | 41.7 | ₹20,25,000 |
| Document intake/classification | 6 min | 2 min | 4 min | 33.3 | ₹16,20,000 |
| HR/IT onboarding and access | 60 min | 15 min | 45 min | 22.5 | ₹10,93,500 |
| Incident triage and monitoring | 15 min | 7 min | 8 min | 10.7 | ₹5,18,400 |
| **Total** |  |  |  | **308.2** | **₹1,49,76,900** |

Rounded summary:

- Monthly time saved: about 308 hours
- Annual time saved: about 3,698 hours
- Annual labor savings: about ₹1,49,77,000

## Base-Case Cost Reduction Model

| Cost bucket | Assumption | Annual impact |
| --- | --- | ---: |
| Duplicate or incorrect invoice handling avoided | ₹162,00,00,000 annual AP spend × 0.10% avoidable leakage prevented | ₹16,20,000 |
| Procurement policy leakage reduced | ₹54,00,00,000 in-scope spend × 0.60% off-contract leakage avoided | ₹32,40,000 |
| SLA credits or service penalties avoided | 6 incidents per year × ₹2,70,000 avoided cost each | ₹16,20,000 |
| **Total cost reduced** |  | **₹64,80,000** |

## Base-Case Revenue Recovered Model

| Revenue bucket | Assumption | Annual impact |
| --- | --- | ---: |
| Faster onboarding of revenue-facing hires | 12 hires × 5 recovered days × ₹54,000/day | ₹32,40,000 |
| Reduced churn/service risk from faster incident response | 4 at-risk renewals × ₹18,00,000 ARR × 35% save probability | ₹25,20,000 |
| **Total revenue recovered** |  | **₹57,60,000** |

## Total Base-Case Impact

| Impact type | Annual value |
| --- | ---: |
| Labor savings from time saved | ₹1,49,76,900 |
| Cost reduced | ₹64,80,000 |
| Revenue recovered | ₹57,60,000 |
| **Total modeled annual impact** | **₹2,72,16,900** |

Rounded executive number: about **₹2.72 Cr per year**.

## Scenario View

| Scenario | Hours saved per month | Labor savings per year | Cost reduced per year | Revenue recovered per year | Total annual impact |
| --- | ---: | ---: | ---: | ---: | ---: |
| Conservative | 220 | ₹1,06,92,000 | ₹36,00,000 | ₹27,00,000 | ₹1,69,92,000 |
| Base case | 308 | ₹1,49,76,900 | ₹64,80,000 | ₹57,60,000 | ₹2,72,16,900 |
| Aggressive | 430 | ₹2,08,98,000 | ₹99,00,000 | ₹94,50,000 | ₹4,02,48,000 |

## Why These Assumptions Are Reasonable

- The workflow engine already supports approval gating, retries, state persistence, and node-level logging, so the platform is designed to reduce repeated manual coordination work.
- The agent layer covers finance, procurement, HR, IT, compliance, security, document processing, and workflow optimization, which maps directly to the operational areas used in the model.
- The health, audit, and monitoring surfaces make it reasonable to count avoided service penalties and faster incident handling as measurable outcomes.
- The browser/server storage split allows lightweight demos and local installs without changing the business logic, which lowers adoption friction.

## How To Customize This Model

Replace the base assumptions with your actual numbers:

1. Replace monthly volumes with your own invoice, request, onboarding, and incident counts.
2. Replace manual and automated handling times with time-study data from your teams.
3. Replace the ₹4,050/hour labor rate with your fully loaded internal rate.
4. Replace renewal and productivity assumptions with your actual ARR, quota, or service-credit numbers.
5. Recompute the same formulas to get a company-specific estimate.

## What This Model Still Leaves Out

These estimates are intentionally conservative because they do not count:

- reduced audit preparation time
- reduced rework from cleaner data capture
- faster workflow creation from reusable templates
- better policy consistency across departments
- avoided delays caused by missing approvals or unclear routing
- management reporting value from unified metrics and audit logs

That means the modeled value should be treated as a floor, not a ceiling.