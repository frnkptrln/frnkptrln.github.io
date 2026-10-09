# NON SERVIAM — runtime checks

The English and German reports share `engine.js`. Their text, score, state-grid
rules and sound design remain in the existing files.

The report now continues silently when Web Audio is absent, construction fails,
or resuming audio rejects. The sound control reflects the silent state and lets
the visitor try again. Ending the report disables playback controls so the
sound bed cannot be restarted after shutdown.

Language navigation transfers the elapsed score time and sound choice through
the existing one-use session record, and resumes paused. It accepts only finite,
in-range times and correctly typed fields from the last 30 seconds. Invalid,
stale or future-dated records return to the cover; they cannot fill the clock
and resource display with `NaN`. No persistent browser storage is introduced.

## Check locally

```bash
npm ci --prefix pieces/non-serviam/tests
npx --prefix pieces/non-serviam/tests playwright install chromium
npm test --prefix pieces/non-serviam/tests
```

Twenty-one Chromium browser cases cover both languages, real playback/pause,
three injected audio failures, malformed and expired handoffs, an actual
English-to-German navigation, blocked session storage, and ended controls.
The German failure cases use a narrow touch viewport. At the original main
commit `0cdcf4f`, the constructor-failure case leaves the clock stopped and
raises `Audio context unavailable`; it passes after the repair.

The checks exercise the actual audio setup but do not judge sound quality or
listen through the complete 5:56 work. The ending check restores a valid late
handoff instead of waiting through the score. Physical phones, Safari/Firefox,
assistive technology, and real device audio interruptions remain untested.

These changes are confined to this piece and its checks. Journal PR #49 is
independent; no live deployment is part of this work.
