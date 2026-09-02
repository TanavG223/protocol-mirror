---
name: humanizer
description: Use when rewriting or auditing prose that must not read as machine-written (READMEs, product copy, pitches, UX strings, emails, docs); it scores the draft, quotes every AI tell, rewrites it, checks every fact against the source, and returns the rewrite plus a change log.
---

# Humanizer

Invoke with: `use .agent/skills/humanizer/SKILL.md on this text`. Run every numbered step in Workflow, in order. Step 6 is not optional.

## Stance

Text sounds human when it is specific, committed, and written for one reader with one question. It names the thing instead of the category. It commits instead of insuring itself against every objection. Its sentences differ in length because thoughts are not the same size. It stops early. Text does not sound human because you added slang, typos, contractions, or a chatty opening. Those are costumes on the same mannequin. Under them sits the same even, agreeable, unfalsifiable paragraph that would fit any product in its category. Rewrite for substance first and voice second. Test every sentence you keep: if it survives having the nouns swapped for a competitor's, it is filler.

## Pattern catalog

### Vocabulary tells

| Pattern | Tell | Fix |
|---|---|---|
| Stock verb cluster | delve, leverage, foster, harness, elevate, unlock, navigate | Use the plain verb. |
| Importance adjectives | crucial, vital, key, pivotal, robust, seamless | Delete, or put a measurement there. |
| Metaphor noun, no referent | tapestry, landscape, testament, journey | Name the actual thing. |
| Dead-air opener | "in today's fast-paced world", "at the end of the day" | Cut it. Start at the subject. |
| Hype compound | game-changer, best-in-class, cutting-edge | Substitute a checkable number. |
| Copula avoidance | serves as, stands as, boasts, features | Write is, has, does. |

### Structural tells

| Pattern | Tell | Fix |
|---|---|---|
| Rule-of-three padding | Three items, the third a synonym | Keep the real ones. Two is normal. |
| "Not X but Y" flip | "not a task manager but a system of record" | Pick the true half. |
| "It's not just X, it's Y" | The flip, escalated | Delete the sentence. |
| Colon-reveal sentence | Setup, colon, dramatic noun phrase | Rewrite as one declarative clause. |
| Sentence-initial connector | Additionally, Moreover, Furthermore | Delete it. Merge upward. |
| Restating closing sentence | Last sentence repeats the paragraph | Delete. End on the last new fact. |
| "In conclusion" tag | Any wrap-up marker | Delete. |
| Question-then-answer opener | "What makes this different? Three things." | Open with the answer. |
| Parallel triad in one sentence | Three clauses of matched length | Break the symmetry. |
| Quotable one-line closer | An aphorism ending a section | Give the next concrete step. |
| Uniform paragraph blocks | Every paragraph three or four sentences | Let one be a single sentence. |
| Symmetrical two-part sentence | Balanced halves joined by "while" | Split into two unequal sentences. |
| Uniform sentence length | Every sentence 15 to 22 words | Rewrite to the counts under Rhythm. |

### Punctuation and format tells

| Pattern | Tell | Fix |
|---|---|---|
| Em dash habit | Any em dash | Use a period or comma. |
| Semicolon chaining | Independent clauses on semicolons | Split into sentences. |
| Exclamation mark | Any, outside quoted dialogue | Delete. |
| Suspense ellipsis | "and then..." | Finish the sentence. |
| Inline bolding | Bolded phrases inside sentences | Bold headings and labels only. |
| Emoji decoration | Emoji on headings or list items | Delete. |
| Title Case heading | "How It Works" | Sentence case. |

### Hedging and inflation

| Pattern | Tell | Fix |
|---|---|---|
| Inflated quantity word | comprehensive, various, numerous, a range of | Give the count, or cut. |
| "ensure" as filler | "ensuring teams stay aligned" | Say what happens, or cut. |
| Role inflation | plays a vital role, serves as the backbone | State the mechanism. |
| Throat-clearing marker | it is worth noting, importantly, notably | Delete. Note it by saying it. |
| Hedge stacking | may, might, could, often on one claim | Keep one, only if the source hedges. |
| Adjective doing a number's job | fast, scalable, significant, dramatically | Put the measurement there. |
| Abstract noun for the thing | productivity, growth, efficiency, insights | Name the object or action. |
| Actor-hiding passive | "the results are preserved" | Name who does it. |
| Generic example | "for example, a large enterprise" | Use the real case, or drop it. |

### Meta-content

| Pattern | Tell | Fix |
|---|---|---|
| Announcing the next point | "Let's explore", "Here's what you need to know" | Delete it. Make the point. |
| Restating the question | First line paraphrases the prompt | Start with the answer. |
| Fake-candid opener | "Here's the thing", "Honestly", "Let's be real" | Delete the staged pause. |

### UX-copy tells

| Pattern | Tell | Fix |
|---|---|---|
| Button label as sentence | "Click here to get started today" | Verb plus object: "Start trial". |
| Cute error voice | "Oops! Something went wrong." | Name the failure and the next action. |
| "Please note" prefix | A preamble on a system message | Delete the preamble. |

### Empathy and enthusiasm tells

| Pattern | Tell | Fix |
|---|---|---|
| Compliment before answer | "Great question", "You're absolutely right" | Delete. Answer. |
| Sign-off offer | "I hope this helps", "Let me know if" | Delete from published text. |
| Agreement burst | "Absolutely!", "Of course!" | Delete. |
| Corporate pleasantry | feel free to, excited to announce, hope this finds you well | Use the direct request. |

## Scoring rubric

Score each category 1 to 10. The anchors define 3, 6, and 9.

| Category | 3 | 6 | 9 |
|---|---|---|---|
| Specificity | Every claim fits any competitor | A few numbers, mostly abstractions | Names a thing, number, or source |
| Vocabulary | Five or more stock words | One or two stock words | None; plain verbs |
| Rhythm | All sentences 15 to 22 words | Some variation, no short sentence | 4 to 25+ words, one short per paragraph |
| Structure | Triads, flips, summary close | One structural tell survives | Paragraphs end on new facts |
| Punctuation and format | Em dashes, inline bold, title case | One stray dash or exclamation | Clean |
| Commitment | Every claim hedged or unattributed | Some claims stand | One position, hedged only where the source hedges |
| Reader focus | Product is the subject, meta-content present | Ask is buried | Reader is the subject, ask is in line one |

Publish threshold: 56/70 or higher, no category below 7, Specificity at 8 or higher, and a clean facts check. Anything short of that returns to step 4.

## Workflow

1. **Fix the frame.** Get the audience, the purpose, and the one sentence the reader must remember. Ask the user. If nobody can answer, infer all three and put that inference on line one of the change log.
2. **Score the input.** Apply the rubric. Record seven scores and the total.
3. **Name the tells.** Quote each offending phrase verbatim and label it with its catalog name. A paraphrased tell is a tell you did not find.
4. **Rewrite.** Apply the fixes and the rhythm rules. Cut before you substitute, because half the tells are sentences that should not exist. Keep every claim, and keep identifiers, code, and quoted text byte-exact.
5. **Adversarial pass.** Reread as an editor hunting for a reason to reject it. Find five remaining tells. If five do not surface, check every paragraph's first sentence, every section's last sentence, and each adjective. Fix all five.
6. **Facts check. Non-negotiable.** List every number, name, date, quote, claim, and link in the rewrite and point each to where it appears in the input. Delete what you cannot trace. Never invent, never round, never promote "about 40" into "40", never name an unnamed source. This outranks style: an AI-sounding paragraph costs the writer style points, while one invented number costs the reader's trust in every other sentence, and it is the error a reader is likeliest to catch. If the rewrite needs a fact the input lacks, leave `[NEEDS FACT: ...]` in place.
7. **Score again.** Show before and after for all seven categories and the total. Below threshold, return to step 4.
8. **Output.** The rewrite first, no preamble. Then a change log of at most eight lines, each naming the tell, quoting the cut phrase, and giving the replacement. Then the score table.

## Domain notes

**Technical and judge-facing writing.** Keep identifiers, flags, paths, and code exact. Prefer the mechanism over the benefit word: "wraps asyncio task groups" beats "robust concurrency". One idea per sentence. Lead with the fact the reader cannot get elsewhere, usually a number you measured.

**Marketing copy.** Put a specific in the first line, not a promise. The promise comes second, the proof third, named and countable.

**UX copy.** Verbs, not nouns. No exclamation marks. Every message states what happened and what happens next. Match length to the control.

**Emails and messages.** The first line is the ask. Context goes underneath. No pleasantry opener, no "just checking in", no closing offer.

## Rhythm

Vary sentence length on purpose, then verify it. Count words per sentence. If the counts cluster, rewrite the paragraph. A working target for five sentences is 4, 19, 7, 23, 11.

> The parser died Tuesday. It had been reading the vendor feed for eleven months without complaint, and then an unescaped quote stopped it. No one noticed for two more days. By the time finance asked why Thursday's report was empty, the queue held 41,000 unprocessed rows and the retry log had rolled over. We fixed the escaping in an hour and lost the week.

Allow one fragment per three paragraphs, never two in a row. Prefer periods to semicolons and em dashes. Give each paragraph one sentence under eight words, placed where the reader needs to breathe rather than at the end, where it reads as a generated closer.

## Examples

### 1. Product description

Facts on hand: Fernpost reads from Substack, Beehiiv, and ConvertKit; setup takes one API key; the dashboard covers 24 months of opens, clicks, unsubscribes, and revenue per send.

**Before (22/70)**

> Fernpost is a comprehensive `[inflated quantity word]` newsletter analytics platform that empowers `[stock verb]` creators to unlock `[stock verb]` the full potential of their audience data. Our robust `[importance adjective]`, seamlessly `[importance adjective]` integrated dashboard delivers actionable insights, deeper engagement, and sustainable growth `[rule-of-three padding]`. It's not just an analytics tool, it's a growth partner `[it's-not-just flip]`. In today's crowded inbox landscape `[dead-air opener, metaphor noun]`, knowing your readers has never been more crucial `[importance adjective]`. Let's explore what sets us apart `[announcing the next point]`. Various `[inflated quantity word]` integrations are supported, and setup is a breeze.

**After (61/70)**

> Fernpost shows you which links your subscribers clicked, and which of them unsubscribed within an hour of the send. It reads from Substack, Beehiiv, and ConvertKit. Setup is one API key. The dashboard covers the last 24 months of opens, clicks, unsubscribes, and revenue per send.

### 2. Technical README paragraph

Facts on hand: Larkspur wraps asyncio task groups; one call cancels a whole fan-out; it installs with pip; the public API is four functions.

**Before (26/70)**

> Getting started with Larkspur is a breeze! `[exclamation mark]` Larkspur is a powerful, robust `[importance adjectives]` library that leverages `[stock verb]` modern async primitives to deliver a seamless `[importance adjective]` developer experience. Simply install the package, configure your client, and start building `[rule-of-three padding]`. It is worth noting `[throat-clearing marker]` that Larkspur plays a vital role `[role inflation]` in reducing boilerplate. Additionally `[sentence-initial connector]`, comprehensive `[inflated quantity word]` documentation is available to help you navigate `[stock verb]` the API. We hope this helps you get up and running quickly! `[sign-off offer]`

**After (60/70)**

> Larkspur wraps asyncio task groups so that one call cancels an entire fan-out. Install it with `pip install larkspur`. The public API is four functions. If you have ever hand-written a `TaskGroup` block and then had to unwind it on the first failure, this replaces that block.

### 3. Hackathon pitch

Dataset: NYC Taxi and Limousine Commission yellow taxi trip records. Facts on hand: the team parsed every yellow taxi file from 2019 through 2023; 3.4% of rows carry a dropoff timestamp earlier than the pickup; the checker runs in 90 seconds on a laptop and prints trip IDs.

**Before (31/70)**

> Our project harnesses `[stock verb]` the power of open transportation data to revolutionize `[hype compound]` urban mobility analysis. By leveraging `[stock verb]` the NYC taxi dataset, we deliver a comprehensive `[inflated quantity word]` platform that surfaces actionable insights for planners, researchers, and city officials `[rule-of-three padding]`. Data quality plays a crucial role `[role inflation, importance adjective]` here. What makes our approach different? `[question-then-answer opener]` It is worth noting `[throat-clearing marker]` that various `[inflated quantity word]` stakeholders could potentially benefit `[hedge stacking]` from cleaner records. We believe clean data is the foundation of better cities `[quotable one-line closer]`.

**After (63/70)**

> We parsed every NYC yellow taxi trip file from 2019 through 2023 and found that 3.4% of rows report a dropoff earlier than the pickup. Most published analyses of this data never drop those rows. Our checker finds them in 90 seconds on a laptop and prints the trip IDs, so you decide what to do with them.

## Do not

1. Do not invent a fact to make a sentence land.
2. Do not round or upgrade a number from the input.
3. Do not use an em dash.
4. Do not fake a voice with slang or typos.
5. Do not open with a question you then answer.
6. Do not end a section with an aphorism.
7. Do not bold a phrase inside a sentence.
8. Do not swap one stock word for another.
9. Do not touch quoted material, code, identifiers, or data values.
10. Do not report an uncomputed score or an ungranted facts-check pass.

## When not to use this skill

Leave legal and regulatory text alone: terms, licenses, consent language. Leave quotations exactly as quoted, tells included. Leave code, configuration, and log output untouched, and data tables and captions as they are. Return the input unchanged and say in one line why.
