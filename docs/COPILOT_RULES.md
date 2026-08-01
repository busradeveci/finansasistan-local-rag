# COPILOT_RULES.md

# Foundry Sentinel Development Rules

Version: 1.0

---

# Purpose

This document defines the mandatory development rules for any AI coding assistant working on the Foundry Sentinel project.

Before modifying any code, the assistant must understand the existing architecture and respect the established engineering standards.

The primary objective is consistency, maintainability, and incremental improvement.

The assistant must behave like a senior software engineer joining an existing enterprise project—not like a code generator creating a new application.

---

# Read Before Coding

Before writing any code, always read:

PROJECT_VISION.md

DESIGN_SYSTEM.md

UI_COPY.md

RAG_ARCHITECTURE.md

AI_SECURITY.md

PERFORMANCE_GUIDE.md

This project documentation has higher priority than assumptions.

Never ignore these documents.

---

# General Principles

Understand before changing.

Analyze before generating.

Modify before rewriting.

Improve before replacing.

Always preserve project consistency.

---

# Existing Code Comes First

Never assume the existing implementation is incorrect.

Understand why the current code exists.

Respect the existing architecture.

Only modify what is necessary.

Never rewrite large sections unless explicitly requested.

---

# File Safety

Only modify requested files.

Never rename folders.

Never rename components.

Never move files.

Never reorganize the project structure.

Never create duplicate implementations.

---

# Architecture Rules

Never redesign the application architecture.

Never replace the RAG pipeline.

Never replace Microsoft Foundry Local.

Never replace FastAPI.

Never replace React.

Never replace SQLite.

Never introduce cloud dependencies.

---

# UI Rules

Never redesign the interface.

Never invent new layouts.

Never change colors outside DESIGN_SYSTEM.md.

Never invent typography.

Never change spacing rules.

Never replace icons.

Never introduce trendy design patterns.

Every UI modification must follow DESIGN_SYSTEM.md.

---

# UX Copy Rules

Never invent interface text.

Always use UI_COPY.md.

Never create marketing language.

Never generate AI buzzwords.

Keep all interface wording consistent.

---

# Performance Rules

Performance improvements must follow PERFORMANCE_GUIDE.md.

Never optimize blindly.

Measure before changing.

Avoid unnecessary computations.

Reuse existing resources.

Reduce latency.

Preserve correctness.

---

# Security Rules

Every backend modification must comply with AI_SECURITY.md.

Security takes priority over convenience.

Never bypass validation.

Never expose internal prompts.

Never expose secrets.

Never remove security checks.

---

# RAG Rules

Never bypass retrieval.

Never answer without retrieved context.

Never remove metadata filtering.

Never rebuild embeddings unnecessarily.

Never remove streaming.

Never increase latency without justification.

Always preserve retrieval quality.

---

# Dependency Rules

Avoid adding new packages.

Reuse existing libraries whenever possible.

Before introducing a dependency:

Determine whether it is already available.

Determine whether existing code solves the problem.

Prefer built-in functionality.

---

# Refactoring Rules

Prefer small improvements.

Avoid large rewrites.

Avoid unnecessary abstraction.

Keep components readable.

Reduce complexity where possible.

---

# Error Handling

Do not suppress exceptions.

Provide meaningful error messages.

Log useful information.

Never expose sensitive implementation details.

---

# Documentation Rules

Update documentation when behavior changes.

Maintain consistency between implementation and documentation.

Never leave outdated comments.

---

# Naming Rules

Use descriptive names.

Avoid abbreviations.

Avoid vague identifiers.

Maintain naming consistency.

Do not rename existing public APIs without request.

---

# Coding Style

Prefer readability over cleverness.

Keep functions focused.

Reduce nesting.

Write self-explanatory code.

Avoid duplication.

Favor composition over complexity.

---

# React Rules

Avoid unnecessary re-renders.

Use memoization appropriately.

Keep components small.

Separate UI from business logic.

Lazy load heavy components.

Use stable keys.

---

# Backend Rules

Keep endpoints lightweight.

Prefer asynchronous operations.

Avoid blocking requests.

Validate inputs.

Return consistent response schemas.

Reuse services.

---

# Database Rules

Reuse connections.

Avoid duplicate queries.

Index searchable fields.

Avoid unnecessary writes.

Keep transactions short.

---

# Git Rules

Never remove working functionality.

Never modify unrelated files.

Keep changes focused.

Generate clean and reviewable commits.

---

# Before Writing Code

Always ask internally:

What is the smallest possible change?

Can existing code solve this?

Can I reuse existing components?

Will this affect another feature?

Does this follow project documentation?

---

# Before Finishing

Verify:

The application still builds.

The modified feature works.

No unrelated files changed.

Documentation remains valid.

Performance is preserved.

Security is preserved.

UI consistency is preserved.

---

# Forbidden Actions

Never redesign the application.

Never rewrite the entire page.

Never replace architecture.

Never introduce cloud APIs.

Never expose secrets.

Never invent UI.

Never change colors.

Never rename files.

Never move folders.

Never ignore documentation.

Never modify code outside the requested scope.

---

# Preferred Development Workflow

Analyze

↓

Understand

↓

Plan

↓

Implement

↓

Review

↓

Optimize

↓

Validate

↓

Document

---

# Final Engineering Principle

Every change should make the project slightly better than before.

The best modification is the smallest modification that achieves the requested improvement while preserving consistency, performance, security, and maintainability.