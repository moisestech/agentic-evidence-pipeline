# Delivery exercise: reviewable evidence assessments

This is a **proposed exercise using synthetic data**, not a completed client engagement. It adds the discovery, acceptance, and handover questions that source code alone cannot answer.

## User and decision

A program manager needs to review whether a partner's supplied evidence supports a published readiness requirement. Today they would open documents, compare them with the rubric, and record a decision. The actual time, error rate, and review burden must be observed before claiming an improvement.

The first prototype assists review. It does not make eligibility decisions, certify compliance, or write to an external system.

## Discovery before implementation

Ask the reviewer to walk through one recent assessment. Establish:

- What decision is theirs, and who can approve the final result?
- Which documents are trusted, current, and permitted for this use?
- Where do they lose time or ask someone else for help?
- What are the costs of an incorrect approval and an unnecessary escalation?
- What output would be useful even if AI quality were imperfect?
- What would make them stop using the tool?

Record observations separately from inferred needs. Get consent before collecting examples; this public repository only includes synthetic/public fixtures.

## Scope and ownership

| Responsibility | Proposed owner |
| --- | --- |
| Business outcome and acceptance | Product/program owner |
| Source access, retention and permitted use | Data owner with security review |
| Implementation and failure handling | Engineer |
| Assessment disposition | Authorized reviewer |
| Runbook and ongoing operation | Named receiving team |

These are roles to confirm in discovery, not named participants in a past engagement.

## Acceptance gates

| Gate | Evidence required |
| --- | --- |
| Evidence references | Invalid IDs and zero-evidence fixtures cannot be approved |
| Human control | Review is explicit; unresolved evidence can be rejected or left pending |
| Decision persistence | A refused decision leaves summary, disposition and review records unchanged |
| Valid path | An eligible assessment can be approved or edited-and-approved |
| Tenant checks | Mismatched tenant mutation is refused; production additionally requires authenticated tenant derivation |
| User value | Observe the same review task with and without the tool; record task completion, time and corrections |
| Semantic quality | Separately label whether cited text supports the claim; valid IDs alone are insufficient |
| Handover | A teammate follows setup and explains an invalid-citation outcome without the author helping |

Acceptance thresholds for user value and live-model quality must be agreed with the owner. The committed fake-provider report cannot establish those thresholds have been met.

## Four proposed milestones

1. **Discovery:** current workflow, baseline, permitted data, riskiest assumption, acceptance owner.
2. **Prototype:** one rubric control, fixture ingestion, retrieval, review policy, observed user task.
3. **Pilot gate:** authenticated access, adversarial tests, semantic eval, cost/latency measurement, recovery drills. No public multi-tenant deployment before this gate.
4. **Handover:** operating guide, known limits, rollback/fallback, owner, independent teach-back.

Estimate each milestone from its deliverables and unknowns. Keep source access and security-review dependencies visible; do not quote a client price from this synthetic exercise.

## Failure walkthrough

1. Submit the fabricated-citation fixture.
2. Inspect the `insufficient_evidence` assessment and `needs_review` run.
3. Explain why approve and edit-and-approve are unavailable.
4. Attempt ordinary approval through the API and confirm refusal.
5. Reject the assessment and inspect the recorded rejection.
6. Explain that `finalized` records a completed disposition, which may be rejection.

Use only a local test database. Routes are not authenticated. A real recording should show the tested code, not a reconstructed interface or an older storyboard.

## Handover checklist

- [ ] Receiving engineer can install and run the documented checks.
- [ ] Test report distinguishes unit tests from DB integration and live-model evaluations.
- [ ] Reviewer can explain the difference between a citation ID check and supported meaning.
- [ ] Data owner and access policy are confirmed before adding private documents.
- [ ] Operator knows the manual review fallback and unresolved production limits.
- [ ] No cost, quality, adoption, or time-saving claim is published without measured evidence.
