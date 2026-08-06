SceneCraft

AI-Powered Interactive Story Analysis Platform

Turn Any Story Into an Explorable Workspace — Not Just a Summary

Document Type

Project Concept & Technical Blueprint

Version

v1.0 — August 2026

Target Audience

Portfolio Reviewers, Recruiters & Collaborators

Status

Concept / Pre-Development



TABLE OF CONTENTS

1.

The Problem — Why Story Analysis Tools Fall Short

3

2.

Project Rationale & Portfolio Value

3

3.

What is SceneCraft?

4

4.

How SceneCraft Works — The Big Picture

4

5.

Module 1: Scene Breakdown

6

6.

Module 2: Character Profiles

6

7.

Module 3: Relationship Graph

7

8.

Module 4: Story Timeline

8

9.

Module 5: Dialogue Summaries

8

10.

Module 6: Mood & Emotion Analysis

9

11.

Module 7: Story Arc Visualization

9

12.

Module 8: Continuity Checker

10

13.

Module 9: Semantic Search

10

14.

System Architecture

12

15.

Database Schema

14

16.

Frontend Experience & UI Flow

20

17.

Technology Stack

20

18.

Implementation Roadmap

22

19.

Why This Project Stands Out

22



1. The Problem — Why Story Analysis Tools Fall Short

Writers, screenwriters, readers, and content teams who work closely with long-form stories currently rely on a single-prompt chatbot, or worse, their own memory and notes, to make sense of complex narratives. This produces flat, disposable text that has to be regenerated every time a new question comes up.

1.1 The Real Pain Points

Pain Point

What This Means for the User

Flat text summaries

A single wall of text loses character nuance and can't be revisited or filtered later.

No visual structure

Readers and writers must re-read the entire story to locate a specific detail or moment.

No relationship mapping

Complex casts become hard to track — who knows whom, and how that changes over the story.

No timeline view

Non-linear or multi-POV stories become confusing without a chronological view of events.

No continuity checking

Writers miss contradictions — eye colour changes, timeline clashes, forgotten subplots.

Single-prompt AI tools

One shot answers are shallow; there is no structured data to filter, search, or build on.

No searchable memory

Users can't ask "when did X happen" or "what did character Y say about Z" without re-reading.



Key Insight

Writers and story editors report spending hours manually building character sheets, timelines, and continuity notes — structured work that a multi-stage AI pipeline can generate automatically, in minutes, and keep interactive.

2. Project Rationale & Portfolio Value

SceneCraft is designed as a portfolio-defining project — one that demonstrates full-stack systems thinking rather than a single AI API call wrapped in a chat window.

Opportunity

Detail

Growth in AI reading/writing tools

Rising demand for AI-assisted writing, editing, and story analysis tools among indie authors, screenwriters, and students.

Existing tools are narrow

Most tools either summarize OR generate character sheets — none combine both into one connected, explorable system.

Underserved audience

Fiction writers, screenwriters, book clubs, students, editors, and story consultants currently improvise with spreadsheets and sticky notes.

Portfolio differentiation

Most AI portfolio projects are single-prompt wrappers; SceneCraft showcases multi-stage pipelines, background jobs, and real-time UX.

Recruiter appeal

Combines AI orchestration, distributed job processing, complex data modeling, and interactive visualization — a rare, hireable combination.

3. What is SceneCraft?

SceneCraft is an AI-powered platform that turns an uploaded story — a novel chapter, screenplay, or short story in PDF, DOCX, or TXT format — into a structured, interactive workspace. Instead of a single generated summary, the system runs the story through multiple specialized AI analysis stages and stores the output as structured, queryable data that powers an immersive, notebook-inspired interface.

3.1 Core Principles

Principle

What It Means

Structured, Not Just Text

Every insight is stored as structured data (scenes, characters, events) — not a disposable paragraph.

Multi-Stage Analysis

Nine specialized AI passes analyze the story instead of one generic prompt trying to do everything.

Real-Time Feedback

Background jobs stream live progress updates instead of a blank loading spinner.

Immersive by Design

The interface feels like opening a storybook — not like using a conventional AI dashboard.

Explorable Memory

Every analysis result is searchable and cross-referenced, so nothing has to be re-generated to be revisited.

Format-Flexible Input

Accepts PDF, DOCX, and TXT so it fits into a writer's existing workflow.

4. How SceneCraft Works — The Big Picture

A story moves through a connected processing pipeline: it is parsed and chunked, then fanned out to independent and dependent AI analysis stages, and finally persisted as structured records that power every interactive page. Progress is streamed to the client in real time as each stage completes, so the workspace unlocks incrementally rather than all at once.



Figure 1 — Document processing pipeline, from upload to a fully explorable workspace.

4.1 Primary Users

User

What They Do in SceneCraft

Fiction Writers

Upload drafts to check continuity, visualize story arcs, and keep character sheets in sync as they revise.

Screenwriters

Break scripts into scenes, track dialogue tone per character, and validate pacing against the story arc.

Readers / Book Clubs

Explore character relationships and timelines without re-reading, and search for specific moments.

Students & Educators

Use structured breakdowns of assigned texts for study guides, essays, and classroom discussion.

Editors / Story Consultants

Spot continuity issues and pacing problems quickly across long manuscripts.



5. Module 1 — Scene Breakdown

The Scene Breakdown module segments the uploaded story into discrete scenes, giving every other module — timeline, relationships, mood — a consistent unit of analysis to build on.

5.1 How It Works

The parsed document is chunked using structural cues (chapter breaks, scene breaks, dialogue shifts, location/time changes).

An AI pass labels each chunk with a scene title, location, participating characters, and a concise summary.

Scenes are ordered and numbered sequentially, and linked to their source text offsets for reference.

Each scene record becomes the anchor that timeline, mood, dialogue, and continuity analysis attach to.



5.2 Key Capabilities

Capability

Details

Automatic Segmentation

Detects scene boundaries from structural and narrative cues, no manual tagging required.

Scene Summaries

Two to three sentence AI-generated summary per scene, written in plain language.

Location & Cast Tagging

Each scene lists its setting and the characters present.

Source Text Linking

Every scene stores the original text offsets so the reader can jump back to the source.

Word/Length Metrics

Scene length and pacing metrics available for arc and continuity analysis.



Why It Matters

Scene breakdown is the backbone of the whole platform — every visualization (timeline, arc, relationships) is built on top of consistent scene units rather than re-parsing the raw text each time.

6. Module 2 — Character Profiles

The Character Profiles module builds a living character sheet for every named character, tracking traits, roles, and how each character evolves across the story.

6.1 How It Works

Named entities are extracted across all scenes and de-duplicated, merging aliases and nicknames into one character record.

For each character, the AI pass generates a role classification (protagonist, antagonist, supporting), a trait list, and a short description.

The character's scene-by-scene appearances are linked, forming the basis for an arc summary of how they change.

Profiles update automatically as more of the document is processed, rather than requiring a second full pass.



6.2 Key Capabilities

Capability

Details

Automatic Entity Extraction

Detects and de-duplicates character names and aliases across the full document.

Role Classification

Flags protagonists, antagonists, and supporting characters based on narrative prominence.

Trait & Description Generation

Produces a concise personality/trait summary grounded in the source text.

Appearance Timeline

Lists every scene a character appears in, enabling quick cross-referencing.

Arc Summary

Short narrative of how the character changes from first to last appearance.

7. Module 3 — Relationship Graph

The Relationship Graph module maps how characters are connected — allies, rivals, family, romantic interests — and how the sentiment of those connections shifts across the story.

7.1 How It Works

Once character profiles exist, scenes are scanned for co-occurrence and interaction patterns between characters.

Each character pair is classified with a relationship type (ally, rival, family, romantic, mentor) and a sentiment score.

The relationship graph is rendered as an interactive node-link diagram using React Flow, with edges weighted by interaction frequency.

Relationship sentiment is tracked per scene, so users can see a connection strengthen or break down over the story.



7.2 Key Capabilities

Capability

Details

Interactive Node Graph

Characters as nodes, relationships as edges, rendered with React Flow for pan/zoom exploration.

Relationship Typing

Classifies each connection: ally, rival, family, romantic, mentor, and more.

Sentiment Over Time

Tracks how a relationship's tone shifts from scene to scene.

Interaction Weighting

Edge thickness reflects how frequently two characters interact.

Scene Drill-Down

Clicking an edge shows the exact scenes that shaped that relationship.

8. Module 4 — Story Timeline

The Story Timeline module reconstructs a chronological view of events — essential for non-linear narratives, flashbacks, and multi-POV stories that jump around in time.

8.1 How It Works

Each scene is analyzed for explicit and implicit time markers (dates, "the next morning", flashback cues).

Scenes are placed on a chronological axis that may differ from their order of appearance in the document.

Both a narrative order (as written) and chronological order (as it happened) are stored and can be toggled in the UI.

Key events are highlighted on the timeline with short labels pulled from the scene summaries.



8.2 Key Capabilities

Capability

Details

Dual Ordering

Toggle between "as written" and "chronological" views of the same events.

Time Marker Detection

Identifies explicit and implicit time references within scene text.

Flashback/Flash-forward Flags

Marks scenes that break linear chronology for easy identification.

Interactive Scrubbing

Horizontal timeline UI lets users scrub through events and jump to a scene.

Event Highlights

Major plot beats are surfaced automatically on the timeline.

9. Module 5 — Dialogue Summaries

The Dialogue Summaries module extracts and condenses spoken exchanges per character and per scene, so users can understand what was said without reading full transcripts.

9.1 How It Works

Dialogue lines are extracted from each scene and attributed to the speaking character.

An AI pass condenses each character's dialogue in a scene into a short summary, preserving tone and intent.

A small set of the most narratively important lines are retained as key quotes for reference.

Dialogue summaries are linked back to scenes and feed into the mood and character-arc analysis.



9.2 Key Capabilities

Capability

Details

Speaker Attribution

Associates each line of dialogue with the correct character.

Per-Scene Condensation

Summarizes what each character said in a scene in one or two sentences.

Key Quote Extraction

Surfaces a small number of the most significant lines per scene.

Tone Tagging

Labels dialogue tone (e.g., defensive, affectionate, sarcastic) to support mood analysis.

10. Module 6 — Mood & Emotion Analysis

The Mood & Emotion module scores the emotional tone of every scene, giving writers and readers a fast, visual read on the story's emotional rhythm.

10.1 How It Works

Each scene's narration and dialogue are analyzed for dominant emotions (joy, tension, grief, fear, and others).

A primary mood label and an intensity score are assigned to the scene.

Mood scores are mapped to a soft colour scale so the whole story's emotional rhythm can be viewed at a glance.

Mood data feeds directly into the Story Arc module to correlate tension with pacing.



10.2 Key Capabilities

Capability

Details

Emotion Scoring

Multi-label emotion scores per scene (joy, tension, grief, fear, and more).

Primary Mood Tag

One dominant mood label assigned per scene for quick scanning.

Color-Coded Visualization

Scenes are shaded on a soft pastel scale reflecting emotional intensity.

Dialogue-Aware Scoring

Incorporates dialogue tone alongside narration for a more accurate read.

11. Module 7 — Story Arc Visualization

The Story Arc module plots narrative tension across the story, helping writers evaluate pacing and identify the climax and resolution.

11.1 How It Works

Tension scores are derived by combining scene mood intensity, conflict indicators, and pacing signals.

Scenes are plotted on a tension curve across the length of the story.

The system flags the likely climax (peak tension) and resolution (falling tension after climax).

Writers can compare their arc shape against common narrative structures (three-act, hero's journey) as a reference overlay.



11.2 Key Capabilities

Capability

Details

Tension Curve

Interactive line chart of narrative tension scene by scene.

Climax Detection

Automatically flags the scene with peak tension as the likely climax.

Structure Overlay

Optional reference curves (three-act structure, hero's journey) for comparison.

Scene Drill-Down

Clicking any point on the curve opens the corresponding scene.

12. Module 8 — Continuity Checker

The Continuity Checker cross-references scenes, characters, and the timeline to flag contradictions the writer may have missed.

12.1 How It Works

Character attributes (appearance, age, possessions) are tracked across every scene they appear in.

The system compares mentions across scenes and flags contradictions (e.g., a changed eye colour, an object appearing after it was destroyed).

Timeline data is cross-checked for impossible sequences, such as a character appearing in two places at once.

Each flagged issue is logged with severity, the conflicting scenes, and a plain-language description for the writer to review.



12.2 Key Capabilities

Capability

Details

Attribute Tracking

Monitors character details across scenes to catch inconsistencies.

Timeline Cross-Checks

Flags impossible sequences or unexplained gaps in chronology.

Severity Ranking

Issues are ranked so writers can triage major plot holes first.

Reviewable Log

Every flagged issue can be marked reviewed, dismissed, or resolved.



Why It Matters

Continuity checking is the feature most requested by novelists revising long manuscripts — it turns something normally caught (or missed) by a human editor into an automated, always-on pass.

13. Module 9 — Semantic Search

The Semantic Search module lets users ask natural-language questions about the story and get precise, source-linked answers instead of re-reading the text.

13.1 How It Works

Every scene, dialogue summary, and character profile is embedded into a vector representation during processing.

User queries (e.g., "when does Maya find out the truth") are embedded and matched against stored vectors using similarity search.

Results are ranked and returned with direct links to the originating scene, character, or dialogue record.

Search combines semantic similarity with keyword filters (character, scene, mood) for precise results.



13.2 Key Capabilities

Capability

Details

Natural-Language Queries

Ask questions in plain English instead of using exact keyword matches.

Vector Similarity Search

Embeddings enable finding conceptually related moments, not just exact text matches.

Source-Linked Results

Every result links directly back to its scene, character, or dialogue record.

Combined Filtering

Semantic search can be narrowed by character, scene range, or mood tag.



14. System Architecture

SceneCraft is built as a job-oriented, multi-service system rather than a single request/response app. Uploads are parsed and handed to a background job queue, where independent and dependent AI analysis stages run in parallel where possible, streaming progress to the client via WebSockets as each stage completes.



Figure 2 — High-level system architecture.

14.1 Architecture Layers

Layer

Technology

Responsibility

Client

React, Tailwind CSS, Framer Motion, React Flow

Notebook-style UI, upload flow, interactive pages, relationship graph rendering.

API Gateway

Node.js + Express.js

REST endpoints, authentication (JWT), request validation, rate limiting.

Realtime Layer

Socket.IO

Streams job progress, stage completion, and error events to the client.

Orchestration

Node.js service layer

Creates the job graph per document and tracks pipeline state.

Job Queue

BullMQ (Redis-backed)

Queues and schedules each analysis stage; retries failed jobs.

Workers

Node.js worker processes

Execute parsing, AI analysis calls, graph building, and embedding generation.

AI Providers

Gemini API / OpenAI API

Perform the underlying language understanding for each analysis stage.

Data Store

MongoDB

Persists structured story data — documents, scenes, characters, relationships, etc.

Cache / Queue State

Redis

Backs BullMQ, caches frequent reads, stores session/rate-limit data.

Object Storage

Cloud object storage (e.g., S3-compatible)

Stores original uploaded files (PDF/DOCX/TXT).

14.2 Why a Job Queue Instead of a Single Request

A full story analysis involves nine distinct AI passes, several of which depend on the output of earlier stages (for example, the relationship graph needs character profiles first). Running all of this inside a single HTTP request would time out and provide no visibility into progress. Instead:

The orchestrator creates a job graph per document, with dependent stages queued after their prerequisites complete.

BullMQ (backed by Redis) manages retries, concurrency limits, and per-stage status.

Socket.IO pushes stage-level progress events to the client, so the workspace unlocks incrementally — scenes and characters appear before slower stages like continuity checking finish.

Failed stages can be retried independently without re-running the entire pipeline.



15. Database Schema

SceneCraft uses MongoDB as its primary data store. Story data is naturally nested and variable in shape (a character may have zero or many aliases; a scene may reference any number of characters), which fits MongoDB's document model better than a rigid relational schema. Redis is used only for queue state and caching, not as a system of record.

15.1 users

Registered accounts for writers, editors, and readers using the platform.

Field

Type

Description

_id

ObjectId

Primary key.

name

String

Display name.

email

String

Unique login email.

passwordHash

String

Hashed credential (bcrypt).

plan

String

free | pro | team — feature/usage tier.

createdAt

Date

Account creation timestamp.



15.2 documents

One record per uploaded story, holding metadata and overall processing status.

Field

Type

Description

_id

ObjectId

Primary key.

userId

ObjectId (ref: users)

Owner of the uploaded document.

title

String

Story title, user-editable.

originalFilename

String

Name of the uploaded file.

fileType

String

pdf | docx | txt.

storageUrl

String

Object storage location of the original file.

status

String

uploaded | processing | ready | failed.

wordCount

Number

Total word count of the parsed story.

totalScenes

Number

Count of scenes detected once processing completes.

uploadedAt

Date

Upload timestamp.



15.3 processing_jobs

Tracks each pipeline stage's status for a document, powering the real-time progress UI.

Field

Type

Description

_id

ObjectId

Primary key.

documentId

ObjectId (ref: documents)

Document this job belongs to.

stage

String

parsing | scenes | characters | relationships | timeline | dialogue | mood | arc | continuity | embeddings.

status

String

queued | running | completed | failed.

progress

Number

0–100 completion percentage for this stage.

dependsOn

String[]

Stage names that must complete before this stage can start.

error

String

Error message if the stage failed.

startedAt / completedAt

Date

Stage timing for diagnostics and analytics.



15.4 scenes

The core narrative unit that most other collections reference.

Field

Type

Description

_id

ObjectId

Primary key.

documentId

ObjectId (ref: documents)

Parent document.

sceneNumber

Number

Sequential order as written.

title

String

Short AI-generated scene title.

summary

String

Two to three sentence scene summary.

location

String

Setting of the scene, if identifiable.

characterIds

ObjectId[] (ref: characters)

Characters present in this scene.

textRange

{ start: Number, end: Number }

Offsets into the parsed source text.

wordCount

Number

Length of the scene, used for pacing analysis.



15.5 characters

One record per de-duplicated character, aggregating traits and appearances.

Field

Type

Description

_id

ObjectId

Primary key.

documentId

ObjectId (ref: documents)

Parent document.

name

String

Primary display name.

aliases

String[]

Alternate names/nicknames merged into this record.

role

String

protagonist | antagonist | supporting.

traits

String[]

Short personality/trait tags.

description

String

AI-generated character description.

arcSummary

String

Summary of how the character changes across the story.

sceneIds

ObjectId[] (ref: scenes)

Every scene this character appears in.



15.6 relationships

Pairwise connections between characters, used to render the relationship graph.

Field

Type

Description

_id

ObjectId

Primary key.

documentId

ObjectId (ref: documents)

Parent document.

characterAId / characterBId

ObjectId (ref: characters)

The two characters in this relationship.

type

String

ally | rival | family | romantic | mentor | other.

sentimentScore

Number

-1 to 1, current overall tone of the relationship.

sentimentBySceneId

Map<ObjectId, Number>

Sentiment score tracked per scene, for over-time analysis.

sceneIds

ObjectId[] (ref: scenes)

Scenes where this relationship is evidenced.



15.7 timeline_events

Chronological placement of scenes, separate from their narrative (as-written) order.

Field

Type

Description

_id

ObjectId

Primary key.

documentId

ObjectId (ref: documents)

Parent document.

sceneId

ObjectId (ref: scenes)

Scene this event corresponds to.

chronologicalOrder

Number

Position in the reconstructed chronological sequence.

timeLabel

String

Human-readable time marker (e.g., "Three years earlier").

isFlashback

Boolean

Flags scenes that break linear narrative order.



15.8 dialogue_summaries

Condensed per-character dialogue for each scene.

Field

Type

Description

_id

ObjectId

Primary key.

documentId

ObjectId (ref: documents)

Parent document.

sceneId

ObjectId (ref: scenes)

Scene this summary belongs to.

characterId

ObjectId (ref: characters)

Speaking character.

summaryText

String

One to two sentence condensation of what was said.

keyQuotes

String[]

A small set of the most significant lines.

tone

String

Dominant tone tag for this character's dialogue in the scene.



15.9 mood_analysis

Emotion scoring for each scene.

Field

Type

Description

_id

ObjectId

Primary key.

documentId

ObjectId (ref: documents)

Parent document.

sceneId

ObjectId (ref: scenes)

Scene being scored.

primaryMood

String

Dominant emotion label for the scene.

emotionScores

Map<String, Number>

Scores per emotion category (joy, tension, grief, fear, etc.).

intensity

Number

0–1 overall emotional intensity.



15.10 story_arcs

Tension scoring across the story, used for the arc visualization.

Field

Type

Description

_id

ObjectId

Primary key.

documentId

ObjectId (ref: documents)

Parent document.

arcPoints

Array<{ sceneId, tensionScore, label }>

Ordered tension values across the story.

climaxSceneId

ObjectId (ref: scenes)

Scene identified as the peak-tension climax.



15.11 continuity_issues

Flagged inconsistencies surfaced by the continuity checker.

Field

Type

Description

_id

ObjectId

Primary key.

documentId

ObjectId (ref: documents)

Parent document.

type

String

attribute-conflict | timeline-conflict | unexplained-gap.

description

String

Plain-language explanation of the flagged issue.

sceneIds

ObjectId[] (ref: scenes)

Scenes involved in the conflict.

severity

String

low | medium | high.

status

String

open | reviewed | dismissed | resolved.



15.12 embeddings

Vector representations powering semantic search, stored alongside a reference to their source record.

Field

Type

Description

_id

ObjectId

Primary key.

documentId

ObjectId (ref: documents)

Parent document.

sourceType

String

scene | character | dialogue_summary.

sourceId

ObjectId

Reference to the originating record.

vector

Number[]

Embedding vector generated by the AI provider.

model

String

Embedding model/version used, for future re-indexing.



15.13 Indexing Strategy

Compound index on { documentId, sceneNumber } in scenes for fast ordered retrieval.

Index on { documentId, status } in processing_jobs to power the live progress UI.

Text index on characters.name and characters.aliases for quick lookup during entity resolution.

Vector index (Atlas Vector Search or equivalent) on embeddings.vector for semantic search.

Index on { userId } in documents to list a user's library efficiently.



16. Frontend Experience & UI Flow

The interface is designed to feel like opening a storybook rather than using a conventional AI dashboard: a clean white background, black typography, soft pastel accents, generous whitespace, and subtle paper-inspired visuals throughout.

Page

Experience

Notebook Cover (Upload)

The upload area is styled as a closed notebook cover; dropping a file feels like placing a manuscript on a desk.

Loading Sequence

An animated sequence of books stacking communicates progress while background jobs run.

Page-Flip Transition

A page-flipping animation (Framer Motion) carries the user from upload into the analysis workspace.

Overview Page

Story-level summary: total scenes, characters, mood snapshot, and pipeline completion status.

Characters Page

Card-based character profiles with traits, role, arc summary, and appearance timeline.

Relationship Graph Page

Interactive React Flow node-link diagram with filters by relationship type and sentiment.

Timeline Page

Horizontal scrubbable timeline with a toggle between narrative order and chronological order.

Scenes Explorer

Scene-by-scene browsing with summaries, mood colour tags, and dialogue highlights.

Story Arc Page

Tension curve chart with climax detection and optional structure overlays.

Search

A single search bar for natural-language, source-linked semantic search across the whole story.

17. Technology Stack

Layer

Technology

Why

Frontend

React

Component-driven UI well suited to many interactive, data-heavy pages.

Styling

Tailwind CSS

Rapid, consistent implementation of the minimal notebook-inspired design system.

Animation

Framer Motion

Smooth page-flip transitions and the book-stacking loading sequence.

Graph Visualization

React Flow

Purpose-built for interactive node-link diagrams like the relationship graph.

Backend Runtime

Node.js

Shared JavaScript across frontend/backend and a strong async ecosystem for I/O-heavy workloads.

API Framework

Express.js

Lightweight, well-understood REST framework for the API gateway.

Database

MongoDB

Flexible document model fits the nested, variable-shape structure of story data.

Cache / Queue Backing

Redis

In-memory store backing BullMQ and caching frequent reads.

Job Queue

BullMQ

Reliable background job processing with retries, concurrency control, and dependency handling.

Realtime Updates

Socket.IO

Bi-directional events to stream pipeline progress to the client.

AI Analysis

Gemini API / OpenAI API

Powers the nine analysis stages — scene, character, mood, and more.



18. Implementation Roadmap

A phased build lets each layer of the system be demoed independently — useful both for maintaining momentum and for showing incremental progress in a portfolio.

Phase

Focus

Key Deliverables

Phase 1

Foundations

File upload, parsing (PDF/DOCX/TXT), MongoDB schema, basic auth.

Phase 2

Core AI Pipeline

Scene breakdown, character profiles, BullMQ job orchestration, Socket.IO progress events.

Phase 3

Deeper Analysis

Relationship graph, timeline, dialogue summaries, mood & emotion scoring.

Phase 4

Visualization & UX

Notebook-inspired frontend, page-flip transitions, React Flow relationship graph, story arc chart.

Phase 5

Advanced Features

Continuity checker, embeddings, and semantic search.

Phase 6

Polish & Deploy

Performance tuning, error handling, responsive design, deployment, and portfolio write-up.

19. Why This Project Stands Out

19.1 Comparison

Comparison

Typical AI Portfolio Project

SceneCraft

AI Usage

One prompt, one response.

Nine coordinated analysis stages with dependencies.

Data Model

Often stateless or minimally stored.

Rich, cross-referenced schema across twelve collections.

Processing

Synchronous request/response.

Background job queue with real-time progress streaming.

UX

Generic chat or dashboard layout.

Custom notebook-inspired, animated interface.

Depth

Summarizes text.

Builds an explorable, searchable structured workspace.



19.2 Skills Demonstrated

Multi-stage AI orchestration with dependency-aware background jobs (BullMQ).

Real-time systems design using Socket.IO for live progress updates.

Thoughtful NoSQL data modeling for nested, variable-shape narrative data.

Interactive data visualization — node-link graphs, timelines, and tension curves.

Semantic search using vector embeddings and similarity retrieval.

Polished, distinctive frontend design and motion work, not a generic template.



Every Story Deserves More Than a Summary.