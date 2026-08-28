# What this system chose not to do, and why

*Reference for `AGENTS.md`. The contract stays short enough to read
in full on every task; this is what it points at when a task needs it.*

## Known trade-offs

- **Inverted stop naming** vs. Tailwind. Convention is correct but unfamiliar.
- **Single brand-c** for whole brand scale — for two-color brands, use `--gradient-hue-shift` OR hardcode hex.
- **Pixel baselines are machine-specific; the structure baseline is not**
  (`visual/README.md`).
- **The evals are a small sample.** Twelve tasks: evidence, not statistics, and
  one run per task scored ~20 points above three (`evals/BASELINE.md`).
