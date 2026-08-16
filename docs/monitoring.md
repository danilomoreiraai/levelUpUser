# Consent-aware observability

The browser supports three complementary telemetry paths: Sentry-compatible error monitoring, Web
Vitals, and OpenTelemetry traces. Optional telemetry never starts before the matching consent choice.

## Consent model

- `monitoring` controls Sentry-compatible errors, performance signals, and OpenTelemetry traces.
- `analytics` controls Google Analytics and permits Web Vitals delivery to Google Analytics.
- `marketing` controls Meta Pixel campaign measurement.
- Revoking monitoring consent shuts down the active OpenTelemetry provider. Reloading the page with
  consent denied keeps optional telemetry disabled.

Do not add a new vendor or telemetry destination without documenting its purpose, data fields,
retention, transfer safeguards, and consent category in the privacy policy.

## Environment configuration

```txt
VITE_APP_ENV=production
VITE_SENTRY_DSN=https://YOUR_SENTRY_COMPATIBLE_DSN
VITE_SENTRY_TRACES_SAMPLE_RATE=0
VITE_GA_MEASUREMENT_ID=
VITE_META_PIXEL_ID=
VITE_OTEL_EXPORTER_OTLP_ENDPOINT=
```

Vite embeds these values during the build. Configure them in Easypanel and rebuild the application.
Do not place private API keys, collector credentials, Telegram bot tokens, or server secrets in
`VITE_*` variables because browser bundles are public.

## Sentry or GlitchTip

1. Create a React project in Sentry, GlitchTip, or another compatible service.
2. Configure its project DSN as `VITE_SENTRY_DSN`.
3. Keep the trace sample rate at `0` until the production sampling and retention policy is approved.
4. Grant monitoring consent in the application and verify one controlled test event.
5. Revoke consent and verify that a new session does not send optional events.

Project showcase events use the `Project metric:` prefix and the following tags:

```txt
action=project_link_click
action=project_card_hover
action=project_thumbnail_error
phase=delivered
phase=inProgress
```

Hover and thumbnail error signals are limited to once per project and browser session to reduce
noise. Link clicks are captured for each intentional external navigation when consent is active.

## Web Vitals

The app loads `web-vitals` after analytics or monitoring consent and observes CLS, FCP, INP, LCP,
and TTFB. Metrics are delivered only to already-consented, configured providers. They must not be
used to create sensitive profiles or be joined with unrelated personal data.

## OpenTelemetry collector

`VITE_OTEL_EXPORTER_OTLP_ENDPOINT` must be an HTTPS OTLP/HTTP traces endpoint exposed through a
controlled collector or gateway. The browser exporter is intentionally disabled when the endpoint
is absent.

Before enabling it in production:

1. Restrict CORS to the deployed application origins.
2. Apply rate limits, payload limits, authentication at the gateway where practical, and abuse
   monitoring.
3. Do not embed a reusable collector secret in the browser.
4. Review captured attributes and remove URLs, query strings, or identifiers that are unnecessary.
5. Configure retention, regional storage, deletion, and international-transfer safeguards.
6. Add the collector origin to the production Content Security Policy `connect-src` directive.

Browser OpenTelemetry instrumentation remains experimental upstream. Keep the integration narrow,
pin versions, test upgrades, and use a collector boundary rather than connecting the browser directly
to privileged backends.

## Alert routing

Alert destinations belong in the monitoring provider or a protected backend relay. For a Telegram
integration, create a bot with `@BotFather`, add it to the alert group, obtain the group ID, and
configure the provider webhook using a message such as:

```txt
https://api.telegram.org/botBOT_TOKEN/sendMessage?chat_id=CHAT_ID&text=New%20LevelUp%20User%20error
```

The bot token must never appear in frontend code, GitHub, logs, or public documentation with a real
value.

## Verification and incident response

For each production release:

1. Confirm CI, unit coverage, Playwright, and the production build succeeded.
2. Test denied, granular, accepted, and revoked consent paths.
3. Confirm telemetry requests are absent before consent.
4. Confirm configured providers receive only the expected event fields after consent.
5. Monitor error volume, Web Vitals regressions, collector rejection rates, and deployment health.
6. If telemetry behaves unexpectedly, disable the relevant `VITE_*` setting, rebuild, and investigate
   before re-enabling it.
