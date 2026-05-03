# Monitoring

This project uses Sentry for frontend error monitoring. The app only sends events when `VITE_SENTRY_DSN` is configured.

## Easypanel Environment

Add these variables to the app environment in Easypanel:

```txt
VITE_APP_ENV=production
VITE_SENTRY_DSN=https://YOUR_PUBLIC_KEY@YOUR_ORG.ingest.sentry.io/YOUR_PROJECT_ID
VITE_SENTRY_TRACES_SAMPLE_RATE=0
```

Redeploy the app after changing Vite environment variables. Vite embeds `VITE_*` values at build time.

## Sentry Project

1. Create a Sentry account or open an existing organization.
2. Create a JavaScript React project.
3. Copy the client DSN.
4. Paste the DSN into `VITE_SENTRY_DSN` in Easypanel.

## Telegram Alerts

Sentry captures the errors. Telegram delivery should be configured in Sentry as an alert action.

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

### Create Sentry Webhook Alert

If your Sentry plan has webhook alert actions:

1. Go to `Alerts`.
2. Create an Issue Alert.
3. Trigger condition: `A new issue is created`.
4. Action: send a webhook.
5. Webhook URL:

```txt
https://api.telegram.org/botBOT_TOKEN/sendMessage?chat_id=CHAT_ID&text=New%20Sentry%20issue%20in%20levelupuser.com
```

If webhook alert actions are not available on your Sentry plan, use Sentry email alerts first, then add a small relay service later. Do not put the Telegram bot token in frontend code.

## Local Test

To verify Sentry delivery without exposing test controls in production UI, temporarily run this from the browser console in production:

```js
setTimeout(() => {
  throw new Error("Sentry production test");
});
```

Remove or resolve the test issue in Sentry after confirming alerts.
