# Screen components

Presentational, theme-specific screen bodies. Rules:

- Receive ALL data and callbacks via a typed `Props` interface. No data fetching,
  no `useQuery`/`useMutation` here — that lives in the route `page.tsx`.
- One file per (screen, theme): `Glass<Screen>.tsx`, `Terminal<Screen>.tsx`.
- `page.tsx` is the only place that calls hooks, derives values, and switches theme.
- Local UI state (expanded row, open sheet) MAY live in the screen component.
