# Supabase Edge Functions

This directory will contain Edge Functions for Website V2 server-side operations.

## Planned Functions (by Epic)

### Epic B - News Ingestion
- `news-ingestion/` - Fetch and process news feeds
- `article-clustering/` - Group articles into events using AI
- `question-generation/` - Generate neutral questions from events

### Epic H - Moderation
- `content-moderation/` - AI-powered toxicity detection
- `moderator-queue/` - Queue management for human review

### Epic I - Notifications
- `digest-generator/` - Weekly digest compilation
- `notification-sender/` - Alert delivery system

### Epic J - Admin Operations
- `pipeline-monitor/` - Health checks and logging
- `source-manager/` - News source configuration

## Development Notes
- Functions will use mocked external APIs during development
- All Edge Functions will be added in subsequent steps
- Use environment variables for API keys (configured via Supabase dashboard)

## External Integrations (Mocked in Development)
- OpenAI API (question generation, moderation)
- News APIs (RSS feeds, news aggregators)
- Translation services (Epic M)