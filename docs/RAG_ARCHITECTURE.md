# RAG_ARCHITECTURE.md

# Foundry Sentinel Architecture Guide

Version: 1.0

---

# Purpose

This document defines the official Retrieval-Augmented Generation (RAG) architecture of Foundry Sentinel.

All backend implementations must follow this architecture.

The objective is to build a secure, fast, fully offline enterprise knowledge platform capable of operating inside isolated environments.

The architecture prioritizes:

• Performance

• Security

• Reliability

• Scalability

• Maintainability

• Predictable response times

---

# Core Principles

The system is not an AI chatbot.

It is an enterprise knowledge retrieval platform.

The language model is only one component of the system.

Knowledge retrieval always takes priority over language generation.

Every response must originate from indexed organizational knowledge whenever possible.

---

# Architecture Overview

User

↓

Authentication

↓

Workspace Session

↓

Input Validation

↓

Prompt Security

↓

Query Optimization

↓

Embedding

↓

Vector Retrieval

↓

Metadata Filtering

↓

Hybrid Ranking

↓

Context Assembly

↓

Prompt Construction

↓

Microsoft Foundry Local

↓

Streaming Response

↓

Audit Logging

↓

UI Rendering

---

# Enterprise Principles

The platform must remain:

Offline

Air-gapped

Self-contained

No external API calls

No cloud dependency

No telemetry sent externally

No user data leaves the environment.

---

# Supported Document Types

PDF

DOCX

XLSX

CSV

TXT

Markdown

Future support:

PowerPoint

HTML

JSON

XML

---

# Document Processing Pipeline

Every uploaded document passes through the following stages.

Upload

↓

Virus Scan (optional)

↓

File Validation

↓

Metadata Extraction

↓

Content Extraction

↓

Chunking

↓

Embedding Generation

↓

SQLite Storage

↓

Vector Index

↓

Retrieval Ready

No document should bypass the indexing pipeline.

---

# Chunking Strategy

Preferred chunk size

600–900 tokens

Overlap

120–180 tokens

Chunk boundaries should follow semantic meaning.

Never split paragraphs randomly.

Prefer:

Headings

Lists

Tables

Sections

---

# Metadata Model

Every chunk should contain:

Document ID

Document Name

Source

Section

Title

Page Number

Language

File Type

Created Date

Modified Date

Collection

Department

Classification

Tags

Chunk ID

Embedding Version

This metadata enables enterprise filtering.

---

# Embedding Layer

Embeddings should be generated once.

Reuse embeddings whenever possible.

Avoid duplicate embedding generation.

Embedding cache is mandatory.

---

# Vector Store

SQLite

Local only

Persistent

Optimized indexes

Fast lookup

Future compatibility with:

PostgreSQL + pgvector

Azure SQL Edge

FAISS

---

# Retrieval Pipeline

Query

↓

Query Normalization

↓

Embedding

↓

Vector Search

↓

Metadata Filter

↓

Hybrid Ranking

↓

MMR

↓

Top-K Selection

↓

Context Compression

↓

Prompt Assembly

↓

Inference

---

# Retrieval Strategy

Default Top-K

6

Maximum

10

Avoid excessive context.

More context does not equal better responses.

Prioritize relevance.

---

# Ranking Strategy

Vector Similarity

+

Metadata Score

+

Semantic Relevance

+

MMR Diversity

The objective is reducing duplicate chunks.

---

# Context Window

Only include information relevant to the user request.

Avoid injecting unrelated documents.

Context should remain compact.

Remove duplicate information.

---

# Prompt Construction

Every prompt should contain:

System Prompt

Security Rules

Retrieved Context

Conversation Memory

User Request

Nothing else.

Never expose internal prompts.

---

# Conversation Memory

Conversation history should remain lightweight.

Do not resend the entire conversation.

Compress older context.

Summarize previous interactions.

Limit memory growth.

---

# Streaming

Streaming is mandatory.

Never wait for complete generation.

The first token should appear as quickly as possible.

The UI should remain responsive throughout generation.

---

# Performance Targets

First Token

< 700 ms

Average Response

2–4 seconds

Retrieval

< 200 ms

Embedding

Cached whenever possible

Index Search

< 100 ms

UI Refresh

< 16 ms

---

# Performance Optimizations

Mandatory optimizations:

Embedding Cache

Retrieval Cache

Chunk Cache

Metadata Cache

Prompt Cache

SQLite Indexes

Connection Pooling

Lazy Loading

Virtual Scrolling

Streaming

Background Workers

Batch Processing

Incremental Indexing

Parallel Retrieval

Async API Endpoints

Memoization

Debouncing

---

# Multi-Stage Retrieval

Stage 1

Fast Vector Search

↓

Stage 2

Metadata Filtering

↓

Stage 3

Semantic Ranking

↓

Stage 4

MMR Optimization

↓

Stage 5

Context Compression

↓

Stage 6

Prompt Assembly

---

# AI Security Pipeline

Every request must pass through:

Input Validation

↓

Prompt Injection Detection

↓

Jailbreak Detection

↓

Sensitive Data Protection

↓

Retrieval

↓

Output Validation

↓

Response Streaming

↓

Audit Logging

Security must execute before inference.

---

# Knowledge Isolation

Collections remain isolated.

Departmental knowledge must never leak between collections.

Permissions apply before retrieval.

Not after retrieval.

---

# Indexing Strategy

Index only modified files.

Avoid rebuilding the entire vector store.

Support incremental indexing.

Track embedding versions.

---

# File Monitoring

Watch for:

New Files

Modified Files

Deleted Files

Only affected files should be reprocessed.

---

# Background Tasks

Embedding generation

Index optimization

Cleanup

Cache refresh

Database maintenance

Telemetry aggregation

These operations should never block the UI.

---

# Logging

Every operation should be logged.

Examples:

Authentication

Indexing

Retrieval

Inference

Errors

Warnings

Security Events

Performance Metrics

Logs remain local.

---

# Observability

Monitor:

Latency

Retrieval Time

Inference Time

Streaming Duration

CPU

GPU

Memory

Storage

Index Size

Embedding Queue

Cache Hit Ratio

---

# Fault Tolerance

The system should degrade gracefully.

If retrieval fails:

Notify the user.

Keep the application operational.

Never crash the interface.

---

# Scalability

Architecture should support:

100K+

Documents

Millions of chunks

Multiple collections

Multiple embedding models

Future model routing

---

# Future Roadmap

Hybrid Search

Reranking Models

Citation Generation

Document Versioning

Knowledge Graph

Cross Collection Search

Agent Workflows

Scheduled Indexing

Enterprise Connectors

Offline OCR

Offline Speech-to-Text

Offline Translation

---

# Microsoft Foundry Local Integration

The inference layer is powered by Microsoft Foundry Local.

The application should fully leverage:

Streaming generation

Local inference

Model routing

Offline execution

Hardware acceleration

Future Microsoft model updates

The platform architecture must remain compatible with future Microsoft AI platform capabilities without requiring major redesign.

---

# Architectural Rules

Never call external LLM APIs.

Never send prompts outside the local environment.

Never duplicate embeddings.

Never rebuild the vector index unnecessarily.

Never block the UI while inference is running.

Never retrieve unnecessary documents.

Never expose internal prompts.

Always stream responses.

Always optimize for predictable latency.

Always prioritize retrieval quality over model creativity.

Performance and security are equally important.

Every architectural decision should support long-term enterprise maintainability.