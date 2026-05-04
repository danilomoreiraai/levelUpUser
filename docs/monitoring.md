# Monitoring

This project uses `@sentry/react` for frontend error monitoring. Production events are sent to GlitchTip, which is Sentry SDK compatible.

The app only sends events when `VITE_SENTRY_DSN` is configured.

## Easypanel Environment

Add these variables to the app environment in Easypanel:

```txt
VITE_APP_ENV=production
VITE_SENTRY_DSN=https://YOUR_GLITCHTIP_DSN
VITE_SENTRY_TRACES_SAMPLE_RATE=0
```

Enable Easypanel's `.env` file creation for this app, then rebuild after changing Vite environment variables. Vite embeds `VITE_*` values at build time.

## GlitchTip Project

1. Create a GlitchTip account or open an existing organization.
2. Create a React project.
3. Copy the project DSN.
4. Paste the DSN into `VITE_SENTRY_DSN` in Easypanel.
5. Rebuild the Easypanel app.

## Telegram Alerts

GlitchTip captures errors. Telegram delivery is configured as a project alert recipient.

### Create Telegram Bot

1. Open Telegram and start a chat with `@BotFather`.
2. Send `/newbot` and follow the prompts.
3. Copy the bot token.
4. Create a Telegram group for production alerts.
5. Add the bot to the group.
6. Send any message in the group.
7. Open this URL, replacing `BOT_TOKEN`:

```txt
https://api.telegram.org/botBOT_TOKEN/getUpdates
```

8. Find the group `chat.id`. Group IDs usually start with `-`.

### Create GlitchTip Project Alert

In the GlitchTip project:

1. Open project settings.
2. Go to `Project Alerts`.
3. Click `Create New Alert`.
4. Use the condition `If an event happens 1 time in 1 minute, send an alert`.
5. Add an alert recipient.
6. Choose webhook or URL recipient.
7. Use this URL, replacing `BOT_TOKEN` and `CHAT_ID`:

```txt
https://api.telegram.org/botBOT_TOKEN/sendMessage?chat_id=CHAT_ID&text=Novo%20erro%20em%20levelupuser.com
```

Do not put the Telegram bot token in frontend code, GitHub, or Easypanel variables for this frontend app. The token should live only in GlitchTip alert configuration or a backend relay.

## Local Test

To verify GlitchTip delivery without exposing test controls in production UI, temporarily run this from the browser console in production:

```js
setTimeout(() => {
  throw new Error("GlitchTip production test");
});
```

Expected result:

1. A new issue appears in GlitchTip.
2. The Telegram group receives the project alert.

Remove or resolve the test issue in GlitchTip after confirming alerts.
