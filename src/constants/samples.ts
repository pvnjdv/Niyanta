import { AgentId } from '../types';

export const SAMPLES: Record<AgentId, string> = {
  meeting: `MEETING TRANSCRIPT — Q4 Budget and Headcount Planning
Date: November 12, 2024 | Duration: 47 minutes | Location: Board Room B + Zoom
Attendees: Sarah Chen (CFO), Mark Thompson (VP Engineering), Lisa Rodriguez (HR Director),
           Dev Patel (VP Product), James Wu (Legal Counsel), Anna Kim (Finance Manager)

Sarah: Let us get through this efficiently. Three agenda items: Q4 headcount,
       infrastructure budget, and the DataCorp contract. Mark, start us off.
Mark: Engineering is at critical capacity. The payments module launch is blocked.
      We need 3 senior engineers by December 1st or we push the launch to Q2.
Sarah: Understood. Lisa, can we open those requisitions today?
Lisa: JDs are drafted. Posted on LinkedIn and Greenhouse by Thursday.
      But Mark, these are senior roles — 6 to 8 weeks minimum to hire. We may need contractors.
Mark: Agreed. Two contract engineers immediately as a bridge. Max $180 per hour.
Sarah: Approved up to $200 per hour given urgency. Anna, budget code ENG-TEMP-2024.
       James, can we use the standard MSA for contractors?
James: Yes. Countersigned copies ready within 24 hours.
Dev: We also need a senior data scientist for the recommendation engine.
     Q1 critical — the personalization feature is on the board roadmap.
Sarah: That is a $340k fully-loaded package at L6. Needs board sign-off.
       Dev, business case document by November 20th board call.
Dev: I will have it to you by November 18th.
Mark: Infrastructure — we need AWS capacity expansion. Currently at 87% utilization.
      Payments launch will spike us over 100% on day one.
Anna: What is the ask, Mark?
Mark: $52,000 additional for the year. 10 reserved r6i.4xlarge instances, S3 and CloudFront.
Sarah: I can approve $45,000 without board sign-off. Anything above needs justification.
       Mark, can you optimize to fit $45k?
Mark: I will work with AWS. Savings plans instead of reserved. PO by next Tuesday.
Sarah: Good. DataCorp — James, where are we?
James: Contract expires December 31st. They proposed a 23% price increase.
       $180k annually up from $146k. Two alternatives: Palantir and Snowflake, both cheaper
       but require 6-week migration.
Dev: I need DataCorp for at least Q1. Migration during payments launch is impossible.
Sarah: Then we negotiate. James, counter at 8% maximum — $157,680.
       If they will not move, sign a 6-month bridge while Dev evaluates alternatives.
       Decision needed by December 1st.
James: I will reach out to their account team today.
Sarah: Anna, send minutes within the hour. Same time next week if needed. Thank you everyone.`,

  invoice: `INVOICE
Vendor:     CloudTech Solutions Ltd., 1400 Tech Boulevard, Suite 900, San Francisco CA 94105
            EIN: 82-4471823
Bill To:    Acme Corporation, Accounts Payable, 500 Corporate Drive, New York NY 10001

Invoice Number:    INV-2024-CT-0892
Invoice Date:      November 12, 2024
Due Date:          December 12, 2024
Purchase Order:    PO-ACME-2024-441
Contract Ref:      MSA-CT-ACME-2022-001
Payment Terms:     Net 30

LINE ITEMS:
1. Enterprise Platform License Annual Subscription
   500 users, Period January 1 2025 to December 31 2025
   $96.00 per user per year = $48,000.00

2. Professional Services Platform Implementation
   Senior Engineer 24 hours at $275/hr = $6,600.00
   Project Manager 16 hours at $215/hr = $3,440.00
   Subtotal: $10,040.00

3. Data Migration and ETL Pipeline Setup
   Fixed price per SOW-2024-08-15 = $5,500.00

4. Training and Enablement
   3 Group Training Sessions up to 25 attendees each = $3,000.00
   Custom training materials development = $1,200.00
   Subtotal: $4,200.00

5. Priority Support Package 12 months
   24/7 SLA with 4-hour response time = $6,000.00

SUBTOTAL: $73,740.00
DISCOUNT: Volume 500+ seats 5%: -$2,400.00
NET SUBTOTAL: $71,340.00
TAX CA Sales Tax 8.5%: $4,080.00
TOTAL DUE: $75,420.00

Payment: Wire transfer preferred, ACH accepted
Bank: First National Bank of California
Account: CloudTech Solutions Ltd., Account 4521-887-2234, Routing 121000248
Late payment: 1.5% per month after due date`,

  hr: `NEW HIRE ONBOARDING REQUEST
Submitted by: Lisa Rodriguez, HR Director
Date: November 12, 2024

Full Name: Alexandra Chen (prefers Alex)
Personal Email: alex.chen.personal@gmail.com
Role: Senior Software Engineer II (L5)
Team: Payments Platform
Department: Engineering
Manager: Mark Thompson (VP Engineering)
Direct Manager: Priya Singh (Engineering Manager, Payments)
Start Date: December 2, 2024 (Monday)
Employment: Full-time, Hybrid 3 days in office
Location: San Francisco HQ
Salary: $195,000 base
Equity: 0.08% 4-year vest 1-year cliff
Signing Bonus: $25,000 on Day 1

Previous Employer: Google LLC, Payments Infrastructure Team
Last Day at Google: November 29, 2024
Visa Status: US Citizen

IMPORTANT FLAGS:
1. RELOCATION: Alex relocating from New York City.
   Approved relocation package up to $15,000.
   Need: apartment search support, moving company, temporary housing.

2. LEGAL: Alex has pre-existing NDA with Google.
   James Wu must review for IP conflicts before Day 1.
   NDA expires May 15, 2025.
   Restriction: Cannot work on Google-competing features until May 2025.
   Action: Priya to adjust initial sprint assignments.

3. EQUIPMENT: Medical accommodation for prior RSI injury.
   Required: MacBook Pro 16 inch M3 Max (not M3 Pro — medical requirement),
   Kinesis Advantage360 ergonomic keyboard, Logitech MX Vertical mouse,
   32 inch 4K VESA-mount monitor, electric standing desk.

4. BUDDY: Mark suggests Jamie Torres (Senior Engineer Payments) as buddy.
   Jamie has been at company 3 years, knows payments codebase.

Technical Skills: Go expert, Python expert, Java proficient, Rust learning
Domain: Payment processing, PCI-DSS compliance, distributed systems

SYSTEMS ACCESS NEEDED DAY 1:
GitHub Enterprise Payments org (read-only initially),
AWS Console payments-prod read payments-staging full,
GCP acme-payments-dev, Slack, Jira, Confluence, 1Password,
Zoom Pro, Google Workspace corporate email alex.chen@acme.com

NOT YET: Production database access, payment processor API keys (PCI training required first)`,

  procurement: `PURCHASE REQUEST
Request ID: PR-2024-ENG-441
Submitted by: Mark Thompson, VP Engineering
Department: Engineering
Date: November 12, 2024
Urgency: CRITICAL

Item: AWS Cloud Infrastructure Expansion
Category: Cloud Infrastructure IaaS
Vendor: Amazon Web Services (existing account 123456789012)

SPECIFICATION:
Component 1 — EC2 Compute
  Instance type: r6i.4xlarge (128GB RAM, 16 vCPU)
  Quantity: 10 instances, 1-year reserved partial upfront
  Region: us-west-2 primary, us-east-1 failover
  Cost: $28,400/year

Component 2 — S3 Storage
  Additional capacity: 50TB intelligent tiering
  Cost: $4,800/year

Component 3 — CloudFront CDN
  Traffic upgrade: 200TB/month data transfer
  Cost: $6,200/year

Component 4 — Data Transfer and Misc
  Cross-region replication, NAT gateway upgrades
  Cost: $3,600/year

TOTAL ANNUAL COST: $43,000/year
CFO verbally approved up to $45,000 in today's budget meeting.

JUSTIFICATION:
Current production infrastructure at 87% average utilization (peak 94%).
Payments module launch scheduled Q1 2025 will drive 3.2x traffic spike.
Marketing projects 500,000 users in first 72 hours.
Without expansion: 100% certainty of service degradation on launch day.
Revenue impact if degraded: $2.1M in lost transactions first weekend.
SLA breach penalties for existing enterprise customers: up to $400k.
AWS Partnership Agreement in place with committed spend.
Engineering team expertise 100% AWS — no retraining cost.
AWS account manager offered 12% additional discount on new reserved instances.`,

  security: `SECURITY ALERT — AUTOMATED DETECTION
Alert ID: SEC-2024-11-12-0847
Timestamp: 2024-11-12 14:32:07 UTC
Status: ACTIVE — ongoing as of alert generation

Affected Account: james.wu@acme.com (James Wu, Legal Counsel)

AUTHENTICATION:
Password: SUCCESS
MFA: BYPASSED using recovery code RC-7291-XXXX
Note: Recovery codes generated 847 days ago and never previously used

Source IP: 185.220.101.45
IP Classification: MALICIOUS — confirmed Tor exit node (AbuseIPDB, Shodan verified)
IP Location: Amsterdam Netherlands
ISP: Frantech Solutions (known bulletproof hosting provider)
Normal IP: 12.34.56.78 (Comcast San Francisco CA)
Device: UNKNOWN — no device fingerprint match in Okta registry
User-Agent: Mozilla/5.0 Windows NT 10.0 (James exclusively uses MacOS)
Session Duration: Active for 4 minutes 22 seconds as of alert

RESOURCES ACCESSED:
14:27:45 — Okta SSO Login SUCCESS
14:27:52 — Google Workspace email and contacts ACCESS GRANTED
14:28:13 — Notion company wiki ACCESS GRANTED
14:28:34 — SharePoint /Legal/Contracts/Active ACCESS GRANTED
           3 files downloaded: DataCorp_MSA_2022.pdf, Contractor_Agreements_Template.docx, NDA_Google_AlexChen.pdf
14:29:01 — SharePoint /Finance/Payroll/2024 BLOCKED insufficient permissions
14:29:15 — AWS Console BLOCKED no AWS access for this user
14:29:33 — SharePoint /Finance/BankAccounts BLOCKED
14:29:48 — SharePoint /Finance/WireTransfers BLOCKED 4 rapid attempts
14:30:12 — Greenhouse HR recruiting system ACCESS GRANTED candidate data viewed
14:31:05 — SharePoint /Legal/M&A/Confidential BLOCKED
14:32:07 — ALERT TRIGGERED behavioral threshold exceeded

BEHAVIORAL ANALYSIS:
Normal pattern: 9:00-9:30 AM PST weekdays from SF office or home
Typical access: Email, Slack, Notion, Legal SharePoint folders
Never accesses: Finance folders, AWS, HR systems, M&A documents
Anomaly Score: 97 out of 100 (threshold: 80)

Data confirmed exfiltrated:
1. DataCorp MSA — commercial terms pricing currently in active negotiation
2. Contractor Agreements Template — standard template
3. Alex Chen NDA with Google — sensitive, currently under legal review`,
};
