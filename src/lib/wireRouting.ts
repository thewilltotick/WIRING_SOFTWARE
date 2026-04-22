export type Point = { x: number; y: number };

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

export function insertWaypointOnSegment(start: Point, waypoints: Point[], end: Point, click: Point): Point[] {
  const rendered = buildRenderedPoints(start, waypoints || [], end);
  const segIdx = nearestSegmentIndex(rendered, click);

  const a = rendered[segIdx];
  const b = rendered[segIdx + 1];

  let inserted: Point;
  if (a.x === b.x) {
    inserted = { x: a.x, y: click.y };
  } else if (a.y === b.y) {
    inserted = { x: click.x, y: a.y };
  } else {
    inserted = click;
  }

  const renderedInternal = rendered.slice(1, -1);
  renderedInternal.splice(segIdx, 0, inserted);

  return ensureOrthogonalWaypoints(start, renderedInternal, end);
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