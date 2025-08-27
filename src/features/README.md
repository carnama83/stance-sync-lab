# Features Directory

This directory will contain feature-specific components and logic organized by Epic.

## Planned Feature Structure

### Epic A - Identity & Onboarding
- `/identity/` - User profile, preferences, pseudonymous identity
- `/onboarding/` - Registration flow, DOB/location capture

### Epic B - News & Questions  
- `/news/` - News ingestion display, article clustering
- `/questions/` - AI-generated question components

### Epic C - Feed & Discovery
- `/feed/` - Tailored question feed
- `/discovery/` - Search, topic/region following

### Epic D - Stance Capture
- `/stance/` - Stance slider, rationale input, response forms

### Epic F - Community Analytics
- `/analytics/` - Community pulse dashboard, trend visualizations

### Epic G - Discussion
- `/discussion/` - Comments, upvoting, civility features

### Epic H - Moderation
- `/moderation/` - Report handling, toxicity detection UI

## Guidelines

- Each feature should be self-contained with its own components, hooks, and types
- Use feature-based organization rather than technical layers
- Export main components via barrel exports (index.ts files)
- Keep shared utilities in `/lib/` directory