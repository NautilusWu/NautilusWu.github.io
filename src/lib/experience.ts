import { experience } from '../data/site';
import { formatMonth } from './format';

type Role = (typeof experience)[number];
type RoleKind = Role['kind'];

/** Every role, newest first — the order every page shows them in. */
export const roles: readonly Role[] = [...experience].sort((a, b) =>
  b.start.localeCompare(a.start),
);

export const rolesOf = (kind: RoleKind): Role[] => roles.filter((role) => role.kind === kind);

/** Professional and teaching roles together, newest first — leadership aside. */
export const workRoles: readonly Role[] = roles.filter((role) => role.kind !== 'leadership');

/** "Aug 2026 — Present", from the `YYYY-MM` strings in `site.ts`. */
export const formatPeriod = ({ start, end }: Role): string =>
  `${formatMonth(new Date(start))} — ${end ? formatMonth(new Date(end)) : 'Present'}`;
