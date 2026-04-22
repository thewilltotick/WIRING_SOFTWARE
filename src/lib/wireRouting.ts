export type Point = { x: number; y: number };

const DEFAULT_JOG = 40;

export function manhattanPath(start: Point, end: Point): Point[] {
  if (start.x === end.x || start.y === end.y) {
    return [start, end];
  }

  const midX = Math.round((start.x + end.x) / 2);
  return [
    start,
    { x: midX, y: start.y },
    { x: midX, y: end.y },
    end
  ];
}

export function buildRenderedPoints(start: Point, waypoints: Point[], end: Point): Point[] {
  const effective =
    waypoints && waypoints.length
      ? [start, ...waypoints, end]
      : manhattanPath(start, end);

  return simplifyOrthogonalPath(effective);
}

export function simplifyOrthogonalPath(points: Point[]): Point[] {
  if (points.length <= 2) return points;

  const out: Point[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const a = out[out.length - 1];
    const b = points[i];
    const c = points[i + 1];

    const sameX = a.x === b.x && b.x === c.x;
    const sameY = a.y === b.y && b.y === c.y;

    if (sameX || sameY) continue;
    out.push(b);
  }
  out.push(points[points.length - 1]);

  const dedup: Point[] = [];
  for (const p of out) {
    const last = dedup[dedup.length - 1];
    if (!last || last.x !== p.x || last.y !== p.y) dedup.push(p);
  }
  return dedup;
}

export function ensureOrthogonalWaypoints(start: Point, waypoints: Point[], end: Point): Point[] {
  const pts = [start, ...(waypoints || []), end];
  const out: Point[] = [pts[0]];

  for (let i = 1; i < pts.length; i++) {
    const prev = out[out.length - 1];
    const curr = pts[i];

    if (prev.x === curr.x || prev.y === curr.y) {
      out.push(curr);
    } else {
      out.push({ x: curr.x, y: prev.y });
      out.push(curr);
    }
  }

  return simplifyOrthogonalPath(out).slice(1, -1);
}

export function pointToSegmentDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  if (dx === 0 && dy === 0) {
    return Math.hypot(p.x - a.x, p.y - a.y);
  }

  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return Math.hypot(p.x - projX, p.y - projY);
}

export function nearestSegmentIndex(points: Point[], p: Point): number {
  let bestIdx = 0;
  let bestDist = Number.POSITIVE_INFINITY;

  for (let i = 0; i < points.length - 1; i++) {
    const d = pointToSegmentDistance(p, points[i], points[i + 1]);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function clampToSegment(click: Point, a: Point, b: Point): Point {
  if (a.x === b.x) {
    const minY = Math.min(a.y, b.y);
    const maxY = Math.max(a.y, b.y);
    return { x: a.x, y: Math.max(minY, Math.min(maxY, click.y)) };
  }
  if (a.y === b.y) {
    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);
    return { x: Math.max(minX, Math.min(maxX, click.x)), y: a.y };
  }
  return click;
}

export function insertWaypointOnSegment(start: Point, waypoints: Point[], end: Point, click: Point): Point[] {
  const rendered = buildRenderedPoints(start, waypoints || [], end);
  const segIdx = nearestSegmentIndex(rendered, click);
  const a = rendered[segIdx];
  const b = rendered[segIdx + 1];

  const anchor = clampToSegment(click, a, b);
  const internal = rendered.slice(1, -1);
  const safeIdx = Math.max(0, Math.min(internal.length, segIdx));

  // Create a visible orthogonal jog instead of an invisible split.
  if (a.x === b.x) {
    // vertical segment -> jog horizontally
    const jogA = { x: anchor.x + DEFAULT_JOG, y: anchor.y - DEFAULT_JOG / 2 };
    const jogB = { x: anchor.x + DEFAULT_JOG, y: anchor.y + DEFAULT_JOG / 2 };
    internal.splice(safeIdx, 0, jogA, jogB);
  } else if (a.y === b.y) {
    // horizontal segment -> jog vertically
    const jogA = { x: anchor.x - DEFAULT_JOG / 2, y: anchor.y + DEFAULT_JOG };
    const jogB = { x: anchor.x + DEFAULT_JOG / 2, y: anchor.y + DEFAULT_JOG };
    internal.splice(safeIdx, 0, jogA, jogB);
  } else {
    internal.splice(safeIdx, 0, anchor);
  }

  return ensureOrthogonalWaypoints(start, internal, end);
}

export function moveWaypoint(start: Point, waypoints: Point[], end: Point, waypointIndex: number, point: Point): Point[] {
  const next = [...(waypoints || [])];
  if (waypointIndex < 0 || waypointIndex >= next.length) return next;
  next[waypointIndex] = point;
  return ensureOrthogonalWaypoints(start, next, end);
}

export function moveSegment(start: Point, waypoints: Point[], end: Point, segmentIndex: number, delta: Point): Point[] {
  const pts = buildRenderedPoints(start, waypoints || [], end);
  if (segmentIndex < 0 || segmentIndex >= pts.length - 1) return waypoints || [];

  const next = [...pts];
  const a = next[segmentIndex];
  const b = next[segmentIndex + 1];
  const vertical = a.x === b.x;
  const horizontal = a.y === b.y;

  if (vertical) {
    next[segmentIndex] = { ...next[segmentIndex], x: next[segmentIndex].x + delta.x };
    next[segmentIndex + 1] = { ...next[segmentIndex + 1], x: next[segmentIndex + 1].x + delta.x };
  } else if (horizontal) {
    next[segmentIndex] = { ...next[segmentIndex], y: next[segmentIndex].y + delta.y };
    next[segmentIndex + 1] = { ...next[segmentIndex + 1], y: next[segmentIndex + 1].y + delta.y };
  }

  return ensureOrthogonalWaypoints(next[0], next.slice(1, -1), next[next.length - 1]);
}

export function segmentMidpoint(a: Point, b: Point): Point {
  return {
    x: Math.round((a.x + b.x) / 2),
    y: Math.round((a.y + b.y) / 2)
  };
}