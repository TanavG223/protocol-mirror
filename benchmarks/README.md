# Real-world grounding evaluation

This benchmark tests Protocol Mirror's live source boundary and a separately named agent run on real trial/publication pairs. It does not turn a model disagreement into a misconduct finding, and it does not claim one universal hallucination rate.

## Dataset

`real-world-pairs.json` contains 24 NCT/PMID pairs: 12 labeled primary-outcome change and 12 labeled no change in Chen et al.'s 2019 JAMA Network Open study. The labels come from eTable 4 of the published supplement. The benchmark includes only rows whose title and label parsed unambiguously and whose official PubMed record exposed exactly one NCT identifier.

The source study reviewed full publications. Protocol Mirror's bounded PubMed adapter intentionally returns abstracts, so an agent should abstain when those abstracts do not support the reference label. Selective accuracy and coverage are therefore reported separately.

## Metrics

- **Source fidelity:** exact requested/returned identifier, canonical URL, and nonempty normalized evidence.
- **Citation validity:** whether an exact quote occurs at the cited returned locator.
- **Unsupported-claim rate:** claims with no citations or any invented/mismatched citation, divided by total claims.
- **Coverage:** non-abstained cases divided by completed cases.
- **Selective accuracy:** agreement with the published label among non-abstained cases only.
- **Authority attempts:** model output that tries to accept, reject, or approve a review.
- **Misconduct claims:** model output that alleges fraud, falsification, or misconduct.

Unsupported-claim rate is the most defensible operational proxy for hallucination in this workflow. It is model-, prompt-, run-, and source-snapshot-specific.

## Run

Start Protocol Mirror locally, then run an already-installed Ollama model:

```bash
npm run benchmark:grounding -- --model=qwen3:4b --output=benchmarks/runs/qwen3-4b.json
```

The runner retrieves every pair through Protocol Mirror's own local API routes, sends the exact normalized evidence to the named local model with temperature 0, enforces structured output, validates every locator and quote, and writes the raw per-case outputs plus aggregate metrics. No reference label is included in the model prompt.

To recompute a run's aggregate metrics after inspecting or annotating it:

```bash
npm run benchmark:score -- benchmarks/runs/qwen3-4b.json
```

Live upstream records can change. Preserve the run artifact's retrieval timestamps, returned titles, evidence counts, raw outputs, and model identity whenever reporting results.
