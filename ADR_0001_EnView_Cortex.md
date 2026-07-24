# ADR-0001: EnView Cortex

**Status:** Accepted  
**Release:** v0.11.0

## Decision
Introduce EnView Cortex as the central intelligence layer that converts asset exceptions into ranked insights for the dashboard.

## Why
- The dashboard should answer what matters today rather than only display records.
- Every future module needs a common insight format.
- Ranking and explanation should be separate from the underlying asset data.

## Initial implementation
v0.11.0 reads active EnView assets, converts service and attention states into standard insights, scores them, and supplies the Daily Briefing and Today's Insight card.

## Future extension
Weather, PowerView, FinanceView, NetworkView, and other Connected Services will publish insights into the same Cortex model.
