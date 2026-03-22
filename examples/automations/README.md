# Automation Recipes
# NOTE: These YAML examples use an extended/illustrative automation schema.
# The current runtime automation schema uses `actions[]` with `ai-complete`, `send-message`,
# `run-command`, and `http-request` action types. See @altos/shared for the actual
# AltosConfig interface.

## What it does
Every morning, summarizes your emails and sends a digest to Telegram.

## Setup Time
5 minutes

## Prerequisites
- Telegram bot configured in Altos
- Gmail connector (optional, for email summary)

```yaml
name: daily-digest
description: Send morning digest to Telegram
enabled: true

trigger:
  type: schedule
  config:
    cron: "0 8 * * *"  # 8:00 AM daily
    timezone: America/New_York

steps:
  - type: summarize
    name: Get Email Summary
    config:
      source: gmail
      filter: "is:unread newer_than:1d"
      length: medium
    conditions:
      - field: messages.count
        operator: greater_than
        value: "0"

  - type: send_message
    name: Send to Telegram
    config:
      channel: telegram
      message: |
        ☀️ Good morning!

        Here's your digest for {{trigger.date}}:

        {{steps.1.summary}}

        Have a great day!
```

---

## Automation Recipe: GitHub PR Notifier

## What it does
When a PR is opened in your repo, AI reviews it and posts to Discord.

## Setup Time
10 minutes

## Prerequisites
- GitHub app installed on repo
- Discord channel configured

```yaml
name: pr-review-assistant
description: AI-powered PR review with Discord notifications
enabled: true

trigger:
  type: github_event
  config:
    event: pull_request
    action: opened

steps:
  - type: call_llm
    name: AI Code Review
    config:
      prompt: |
        Review this pull request. Check for:
        1. Code quality and style
        2. Security vulnerabilities
        3. Performance issues
        4. Missing error handling
        5. Test coverage
        
        PR Title: {{trigger.pr_title}}
        PR Description: {{trigger.pr_body}}
        Files changed: {{trigger.files}}
        
        Provide a summary and specific comments.
      model: gpt-4o
      output-var: review_result

  - type: send_message
    name: Post to Discord
    config:
      channel: discord
      message: |
        🐙 New PR: **{{trigger.pr_title}}**
        
        Review: {{steps.1.review_result}}
        
        Author: {{trigger.pr_author}}
        Link: {{trigger.pr_url}}
```

---

## Automation Recipe: Support Ticket Triage

## What it does
Automatically classifies and routes incoming support requests.

## Setup Time
15 minutes

## Prerequisites
- Telegram bot for user input
- Notion for ticket storage

```yaml
name: support-triage
description: Auto-classify and route support requests
enabled: true

trigger:
  type: telegram_message
  config:
    bot-token: ${TELEGRAM_BOT_TOKEN}
    keywords:
      - help
      - support
      - problem
      - issue
      - bug

steps:
  - type: call_llm
    name: Classify Request
    config:
      prompt: |
        Classify this support request:
        
        "{{trigger.message}}"
        
        Categories:
        - urgent: Security issues, data loss, system down
        - high: Feature bugs, performance issues
        - normal: Questions, how-to requests
        - low: Feedback, suggestions
        
        Also extract:
        - main_topic: What the request is about
        - suggested_action: What should we do
        
        Respond in JSON format.
      model: gpt-4o-mini
      output-var: classification

  - type: create_note
    name: Create Ticket
    config:
      destination: notion
      title: "Support: {{steps.1.classification.main_topic}}"
      content: |
        Category: {{steps.1.classification.category}}
        From: {{trigger.user}}
        Message: {{trigger.message}}
        Suggested Action: {{steps.1.classification.suggested_action}}

  - type: send_message
    name: Confirm Receipt
    config:
      channel: telegram
      message: |
        Thanks for reaching out! Your request has been received.
        
        Category: {{steps.1.classification.category}}
        
        Our team will respond within 24 hours.
```

---

## Automation Recipe: Meeting Summarizer

## What it does
After each Google Calendar event, generates a summary and sends it to Slack.

## Setup Time
10 minutes

## Prerequisites
- Google Calendar connected
- Slack channel configured

```yaml
name: meeting-summary
description: Generate summaries after meetings
enabled: true

trigger:
  type: google_calendar
  config:
    event_type: event_end
    filter:
      hasMeetNotes: false

steps:
  - type: call_llm
    name: Generate Summary
    config:
      prompt: |
        Create a concise summary of this meeting:
        
        Title: {{trigger.event_title}}
        Description: {{trigger.event_description}}
        Attendees: {{trigger.attendees}}
        
        Include:
        - Key decisions made
        - Action items assigned
        - Next steps
        
        Format for easy reading.
      model: gpt-4o
      output-var: meeting_summary

  - type: send_message
    name: Send to Slack
    config:
      channel: slack
      message: |
        📋 Meeting Summary: **{{trigger.event_title}}**
        
        {{steps.1.meeting_summary}}
        
        📅 Event: {{trigger.event_link}}

  - type: save_result
    name: Store Summary
    config:
      variable-name: meeting_summary
      value: "{{steps.1.meeting_summary}}"
```

---

## Automation Recipe: Weekly Report Generator

## What it does
Every Friday, generates a summary of GitHub activity and sends it via email.

## Setup Time
10 minutes

## Prerequisites
- GitHub connector
- Gmail connector

```yaml
name: weekly-report
description: Generate weekly activity reports
enabled: true

trigger:
  type: schedule
  config:
    cron: "0 18 * * 5"  # Friday at 6 PM
    timezone: UTC

steps:
  - type: call_llm
    name: Generate Report
    config:
      prompt: |
        Create a weekly summary from this activity data:
        
        {{trigger.github_activity}}
        
        Include:
        - Total PRs merged
        - Issues closed
        - Contributors active
        - Top performing areas
        - Any concerns or blockers
        
        Make it suitable for management review.
      model: gpt-4o
      output-var: report

  - type: send_message
    name: Email Report
    config:
      channel: gmail
      to: team@company.com
      subject: "Weekly Report - Week of {{trigger.week_start}}"
      body: |
        Hi team,

        Here's our weekly activity report:

        {{steps.1.report}}

        Best,
        Altos Bot

  - type: send_message
    name: Slack Copy
    config:
      channel: slack
      message: |
        📊 Weekly Report is ready!
        
        {{steps.1.report}}
```
