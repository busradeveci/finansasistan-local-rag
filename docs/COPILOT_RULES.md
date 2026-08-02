# COPILOT_RULES.md

# VectorVault Development Rules

Version: 1.0  
Product Name: **VectorVault**  
Product Descriptor: **Enterprise Retrieval Platform** / **Secure Knowledge Platform**  
Header Breadcrumb Standard: `VectorVault > Workspace > Control Center`  
Sidebar Title: `VectorVault Control Center`  

---

# Purpose

This document defines the mandatory development rules for any AI coding assistant working on the **VectorVault** project.

Before modifying any code, the assistant must understand the existing architecture and respect the established engineering standards.

The primary objective is consistency, maintainability, and incremental improvement.

The assistant must behave like a senior software engineer joining an existing enterprise project—not like a code generator creating a new application.

---

# Read Before Coding

Before writing any code, always read:

- `PROJECT_VISION.md`
- `DESIGN_SYSTEM.md`
- `UI_COPY.md`
- `RAG_ARCHITECTURE.md`
- `AI_SECURITY.md`
- `PERFORMANCE_GUIDE.md`

This project documentation has higher priority than assumptions.

Never ignore these documents.

---

# Architecture & Engine Rules

- Never redesign the application architecture.
- Never replace the local RAG pipeline.
- Never replace the VectorVault Local Engine.
- Never replace FastAPI, React, or SQLite.
- Never introduce cloud dependencies or external API calls.

---

# UI & UX Copy Rules

- Every UI modification must strictly follow `DESIGN_SYSTEM.md`.
- Always use the tokens defined in `DESIGN_SYSTEM.md` (`--vv-app-bg`, `--vv-primary`, etc.).
- Always use `UI_COPY.md` for interface strings, module titles, and notification copy.
- Header Breadcrumb Standard: `VectorVault > Workspace > Control Center`
- Sidebar Title: `VectorVault Control Center`

---

# Final Engineering Principle

Every change should make the project slightly better than before.

The best modification is the smallest modification that achieves the requested improvement while preserving consistency, performance, security, and maintainability.
