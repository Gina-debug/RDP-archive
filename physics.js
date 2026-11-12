// ==========================================================================
// RDP // RAGAZZI DI PROVINCIA — ANTIGRAVITY 2D RIGID-BODY PHYSICS ENGINE
// ==========================================================================

const RDPPhysics = (() => {
  let isActive = false;
  let rafId = null;
  let lastTimestamp = 0;
  let bodies = [];
  let draggedBody = null;
  let topBound = 120;
  let onCardClickCb = null;

  const GRAVITY = 1650; // px/s^2
  const RESTITUTION = 0.56;
  const WALL_RESTITUTION = 0.62;
  const AIR_DAMPING = 0.995;
  const ANGULAR_DAMPING = 0.975;
  const FLOOR_FRICTION = 0.91;
  const CLICK_THRESHOLD_PX = 6;

  function getHeaderBottom() {
    const header = document.getElementById("siteHeader");
    return header ? header.getBoundingClientRect().bottom : 120;
  }

  function applyBodyTransform(body) {
    body.el.style.transform = `translate3d(${body.x.toFixed(2)}px, ${body.y.toFixed(2)}px, 0) rotate(${body.angle.toFixed(4)}rad)`;
  }

  function resolveWallCollisions(body, vw, vh) {
    const minX = 4;
    const maxX = Math.max(minX, vw - body.w - 4);
    const minY = topBound + 4;
    const maxY = Math.max(minY, vh - body.h - 4);

    if (body.x < minX) {
      body.x = minX;
      body.vx = Math.abs(body.vx) * WALL_RESTITUTION;
      body.omega += body.vy * 0.0012;
    } else if (body.x > maxX) {
      body.x = maxX;
      body.vx = -Math.abs(body.vx) * WALL_RESTITUTION;
      body.omega -= body.vy * 0.0012;
    }

    if (body.y < minY) {
      body.y = minY;
      body.vy = Math.abs(body.vy) * WALL_RESTITUTION;
    } else if (body.y >= maxY) {
      body.y = maxY;
      if (Math.abs(body.vy) > 65) {
        body.vy = -Math.abs(body.vy) * RESTITUTION;
        body.omega += (body.vx * 0.0018);
      } else {
        body.vy = 0;
      }
      body.vx *= FLOOR_FRICTION;
      body.omega *= 0.86;
      // Gently settle rotation toward flat when resting on floor
      if (Math.abs(body.vy) < 12 && Math.abs(body.vx) < 25) {
        body.angle *= 0.94;
      }
    }
  }

  function resolvePairCollisions() {
    const n = bodies.length;
    for (let i = 0; i < n; i++) {
      const a = bodies[i];
      for (let j = i + 1; j < n; j++) {
        const b = bodies[j];

        const ax = a.x + a.w * 0.5;
        const ay = a.y + a.h * 0.5;
        const bx = b.x + b.w * 0.5;
        const by = b.y + b.h * 0.5;

        // Slightly inset effective half-extents so stacked rotated cards interlock nicely
        const halfW = (a.w + b.w) * 0.44;
        const halfH = (a.h + b.h) * 0.44;

        const dx = bx - ax;
        const dy = by - ay;
        const overlapX = halfW - Math.abs(dx);
        const overlapY = halfH - Math.abs(dy);

        if (overlapX > 0 && overlapY > 0) {
          let nx = 0;
          let ny = 0;
          let penetration = 0;

          if (overlapX < overlapY) {
            penetration = overlapX;
            nx = dx >= 0 ? 1 : -1;
          } else {
            penetration = overlapY;
            ny = dy >= 0 ? 1 : -1;
          }

          const aFixed = a === draggedBody;
          const bFixed = b === draggedBody;

          if (!aFixed && !bFixed) {
            const halfPen = penetration * 0.5;
            a.x -= nx * halfPen;
            a.y -= ny * halfPen;
            b.x += nx * halfPen;
            b.y += ny * halfPen;
          } else if (aFixed && !bFixed) {
            b.x += nx * penetration;
            b.y += ny * penetration;
          } else if (!aFixed && bFixed) {
            a.x -= nx * penetration;
            a.y -= ny * penetration;
          }

          const rvx = b.vx - a.vx;
          const rvy = b.vy - a.vy;
          const velAlongNormal = rvx * nx + rvy * ny;

          if (velAlongNormal < 0) {
            const e = 0.45;
            const impulse = -(1 + e) * velAlongNormal * 0.5;

            if (!aFixed) {
              a.vx -= impulse * nx;
              a.vy -= impulse * ny;
              a.omega -= (nx * rvy - ny * rvx) * 0.0005;
            }
            if (!bFixed) {
              b.vx += impulse * nx;
              b.vy += impulse * ny;
              b.omega += (nx * rvy - ny * rvx) * 0.0005;
            }
          }
        }
      }
    }
  }

  function step(timestamp) {
    if (!isActive) return;

    if (!lastTimestamp) lastTimestamp = timestamp;
    const rawDt = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;
    const dt = Math.min(rawDt, 0.032);

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    topBound = getHeaderBottom();

    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      if (b === draggedBody) {
        applyBodyTransform(b);
        continue;
      }

      b.vy += GRAVITY * dt;
      b.vx *= AIR_DAMPING;
      b.vy *= AIR_DAMPING;
      b.omega *= ANGULAR_DAMPING;

      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.angle += b.omega * dt;

      // Clamp angle softly
      if (b.angle > 0.65) b.angle = 0.65;
      if (b.angle < -0.65) b.angle = -0.65;

      resolveWallCollisions(b, vw, vh);
    }

    resolvePairCollisions();

    // Secondary floor clamp after pair resolution
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      if (b !== draggedBody) {
        resolveWallCollisions(b, vw, vh);
      }
      applyBodyTransform(b);
    }

    rafId = window.requestAnimationFrame(step);
  }

  function onPointerDown(e) {
    if (!isActive) return;
    if (e.button !== undefined && e.button !== 0) return;

    const cardEl = e.currentTarget;
    const body = bodies.find((b) => b.el === cardEl);
    if (!body) return;

    e.preventDefault();
    cardEl.setPointerCapture(e.pointerId);

    draggedBody = body;
    body.pointerId = e.pointerId;
    body.dragStartX = e.clientX;
    body.dragStartY = e.clientY;
    body.lastPointerX = e.clientX;
    body.lastPointerY = e.clientY;
    body.lastPointerTime = performance.now();
    body.offsetX = e.clientX - body.x;
    body.offsetY = e.clientY - body.y;
    body.dragMoved = 0;
    body.throwVx = 0;
    body.throwVy = 0;
    body.vx = 0;
    body.vy = 0;
    body.omega = 0;

    cardEl.classList.add("is-dragging");
  }

  function onPointerMove(e) {
    if (!isActive || !draggedBody || draggedBody.pointerId !== e.pointerId) return;

    const now = performance.now();
    const dt = Math.max(0.004, (now - draggedBody.lastPointerTime) / 1000);
    const dx = e.clientX - draggedBody.lastPointerX;
    const dy = e.clientY - draggedBody.lastPointerY;

    draggedBody.dragMoved = Math.max(
      draggedBody.dragMoved,
      Math.hypot(e.clientX - draggedBody.dragStartX, e.clientY - draggedBody.dragStartY)
    );

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    draggedBody.x = Math.max(0, Math.min(vw - draggedBody.w, e.clientX - draggedBody.offsetX));
    draggedBody.y = Math.max(topBound, Math.min(vh - draggedBody.h, e.clientY - draggedBody.offsetY));

    // Exponentially smoothed throw velocity
    const instVx = dx / dt;
    const instVy = dy / dt;
    draggedBody.throwVx = draggedBody.throwVx * 0.45 + instVx * 0.55;
    draggedBody.throwVy = draggedBody.throwVy * 0.45 + instVy * 0.55;
    draggedBody.angle = Math.max(-0.35, Math.min(0.35, draggedBody.throwVx * 0.00018));

    draggedBody.lastPointerX = e.clientX;
    draggedBody.lastPointerY = e.clientY;
    draggedBody.lastPointerTime = now;
  }

  function onPointerUp(e) {
    if (!draggedBody || draggedBody.pointerId !== e.pointerId) return;

    const body = draggedBody;
    const cardEl = body.el;
    draggedBody = null;
    cardEl.classList.remove("is-dragging");

    try {
      cardEl.releasePointerCapture(e.pointerId);
    } catch (_err) {
      // Ignore if capture already released
    }

    if (body.dragMoved < CLICK_THRESHOLD_PX) {
      if (typeof onCardClickCb === "function") {
        onCardClickCb(cardEl.dataset.itemId);
      }
      return;
    }

    const maxSpeed = 2200;
    body.vx = Math.max(-maxSpeed, Math.min(maxSpeed, body.throwVx));
    body.vy = Math.max(-maxSpeed, Math.min(maxSpeed, body.throwVy));
    body.omega = Math.max(-4, Math.min(4, body.vx * 0.002));
  }

  function enable(cardElements, onCardClick) {
    if (isActive) return;
    if (!cardElements || cardElements.length === 0) return;

    onCardClickCb = onCardClick;
    topBound = getHeaderBottom();

    // Pass 1: Read layout metrics before mutating DOM
    const snapshots = Array.from(cardElements).map((el) => {
      const slot = el.parentElement;
      const rect = el.getBoundingClientRect();
      return { el, slot, rect };
    });

    // Pass 2: Detach cards cleanly into fixed rigid bodies
    bodies = snapshots.map(({ el, slot, rect }, idx) => {
      if (slot) {
        slot.style.height = `${rect.height}px`;
        slot.classList.add("is-empty-slot");
      }

      el.classList.add("is-physics");
      el.style.width = `${rect.width}px`;
      el.style.height = `${rect.height}px`;

      el.addEventListener("pointerdown", onPointerDown);
      el.addEventListener("pointermove", onPointerMove);
      el.addEventListener("pointerup", onPointerUp);
      el.addEventListener("pointercancel", onPointerUp);

      const dir = idx % 2 === 0 ? 1 : -1;
      const body = {
        el,
        slot,
        w: rect.width,
        h: rect.height,
        x: rect.left,
        y: rect.top,
        vx: dir * (70 + Math.random() * 140),
        vy: -120 - Math.random() * 140,
        angle: (Math.random() - 0.5) * 0.08,
        omega: (Math.random() - 0.5) * 1.4,
        pointerId: null,
        dragMoved: 0
      };
      applyBodyTransform(body);
      return body;
    });

    isActive = true;
    lastTimestamp = 0;
    rafId = window.requestAnimationFrame(step);
  }

  function disable(immediate = false) {
    if (!isActive && bodies.length === 0) return;
    isActive = false;

    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
    draggedBody = null;

    const currentBodies = bodies.slice();
    bodies = [];

    currentBodies.forEach((b) => {
      b.el.removeEventListener("pointerdown", onPointerDown);
      b.el.removeEventListener("pointermove", onPointerMove);
      b.el.removeEventListener("pointerup", onPointerUp);
      b.el.removeEventListener("pointercancel", onPointerUp);
      b.el.classList.remove("is-dragging");

      if (immediate || !b.slot) {
        cleanupBodyElement(b);
        return;
      }

      const slotRect = b.slot.getBoundingClientRect();
      b.el.classList.add("is-returning");
      b.el.style.transform = `translate3d(${slotRect.left}px, ${slotRect.top}px, 0) rotate(0rad)`;

      window.setTimeout(() => {
        cleanupBodyElement(b);
      }, 430);
    });
  }

  function cleanupBodyElement(b) {
    b.el.classList.remove("is-physics", "is-returning", "is-dragging");
    b.el.style.transform = "";
    b.el.style.width = "";
    b.el.style.height = "";
    if (b.slot) {
      b.slot.style.height = "";
      b.slot.classList.remove("is-empty-slot");
    }
  }

  function shockwave() {
    if (!isActive || bodies.length === 0) return;
    const cx = window.innerWidth * 0.5;
    const cy = window.innerHeight * 0.65;

    bodies.forEach((b) => {
      if (b === draggedBody) return;
      const bx = b.x + b.w * 0.5;
      const by = b.y + b.h * 0.5;
      const dx = bx - cx;
      const dy = by - cy;
      const dist = Math.max(40, Math.hypot(dx, dy));

      b.vx += (dx / dist) * (580 + Math.random() * 420);
      b.vy -= 920 + Math.random() * 520;
      b.omega += (Math.random() - 0.5) * 6;
    });
  }

  function getActiveState() {
    return isActive;
  }

  return {
    enable,
    disable,
    shockwave,
    getActiveState
  };
})();
