"use strict";

function createShelf({ artwork, reduced, isBrowsing, openFilm, requestFrame }) {
  const shelf = document.querySelector(".shelf");
  const stage = shelf.querySelector(".stage");
  const cursor = document.querySelector(".cursor");
  const probe = document.createElement("div");
  probe.className = "height-probe";
  document.body.append(probe);
  const fine = matchMedia("(pointer:fine)");
  const tapes = [];
  const renderer = createTapeRenderer(stage, tapes);
  const labels = createShelfLabels(goTo, reduced);
  const count = films.length * 3;
  const wrap = (n, size) => ((n % size) + size) % size;
  let position = films.length + 5, target = position, selected = -1, hovered = -1;
  let width, height, depth, stride, centerY;
  let gesture, wheelTimer, suppressClick = false;
  let mx = innerWidth / 2, my = 0, cx = mx, cy = 0, tiltY = 0, tiltX = 0;
  let pointerSeen = false, overControl = false, lastCursorMode, lastCursorTransform;

  function measure() {
    width = innerWidth;
    height = probe.getBoundingClientRect().height;
    const bounds = shelf.getBoundingClientRect();
    centerY = bounds.top + bounds.height / 2;
    labels.measure(films[wrap(Math.round(position), films.length)]);
    ({ stride, depth } = renderer.resize(width, height));
    requestFrame();
  }

  function setTarget(value) {
    clearTimeout(wheelTimer);
    target = value;
    requestFrame();
  }

  function step(direction) { setTarget(Math.round(target) + direction); }

  function goTo(index) {
    const base = Math.round(target), half = films.length / 2;
    setTarget(base + wrap(index - base + half, films.length) - half);
  }

  function openCurrent() {
    if (selected < 0 || !isBrowsing()) return;
    setTarget(Math.round(position));
    hovered = -1;
    openFilm(tapes[selected].film, tapes[selected].cover);
  }

  for (let v = 0; v < count; v++) {
    const index = v % films.length, film = films[index];
    const button = document.createElement("button");
    button.className = "tape";
    button.tabIndex = -1;
    button.type = "button";
    button.setAttribute("aria-label", film.title + " (" + film.year + ")");
    const spine = document.createElement("span"), cover = document.createElement("span");
    spine.className = "face sp";
    cover.className = "face cv";
    button.append(spine, cover);
    artwork.register(spine, cover, film, index);
    button.onpointerenter = () => { hovered = v; requestFrame(); };
    button.onpointerleave = () => { if (hovered === v) hovered = -1; requestFrame(); };
    button.onclick = () => {
      if (suppressClick || !isBrowsing()) return;
      const offset = wrap(v - position + count / 2, count) - count / 2;
      if (Math.abs(offset) < .5) openCurrent();
      else setTarget(Math.round(position + offset));
    };
    stage.append(button);
    tapes.push({ v, film, button, cover, spine, lift: 0 });
  }

  function trackPointer(event) {
    if (event.pointerType === "touch") return;
    mx = event.clientX;
    my = event.clientY;
    if (!pointerSeen) {
      pointerSeen = true; cx = mx; cy = my;
      document.documentElement.classList.add("pointer-ready");
      cursor.style.visibility = "visible";
    }
    overControl = Boolean(event.target.closest?.("button:not(.tape),a"));
    requestFrame();
  }
  document.addEventListener("pointermove", trackPointer);
  document.addEventListener("pointerover", trackPointer);
  document.documentElement.addEventListener("pointerleave", () => {
    pointerSeen = false; hovered = -1;
    cursor.style.visibility = "hidden";
    requestFrame();
  });
  shelf.addEventListener("pointerdown", event => {
    if (!event.isPrimary || event.button !== 0) return;
    clearTimeout(wheelTimer);
    suppressClick = false;
    gesture = { id: event.pointerId, x: event.clientX, start: target, dragging: false };
  });
  window.addEventListener("pointermove", event => {
    if (!gesture || event.pointerId !== gesture.id) return;
    const dx = event.clientX - gesture.x;
    if (!gesture.dragging && Math.abs(dx) > 5) {
      gesture.dragging = true;
      shelf.setPointerCapture(event.pointerId);
    }
    if (gesture.dragging) setTarget(gesture.start - dx / stride);
  });
  function endDrag(event) {
    if (!gesture || event.pointerId !== gesture.id) return;
    if (gesture.dragging) {
      setTarget(Math.round(target));
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);
    }
    gesture = null;
    requestFrame();
  }
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);
  window.addEventListener("wheel", event => {
    if (!isBrowsing() || event.ctrlKey) return;
    event.preventDefault();
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
    setTarget(target + delta * unit / stride * .5);
    wheelTimer = setTimeout(() => setTarget(Math.round(target)), 160);
  }, { passive: false });
  document.querySelector(".prev").onclick = () => step(-1);
  document.querySelector(".next").onclick = () => step(1);

  function approach(value, goal, factor, epsilon) {
    const next = value + (goal - value) * factor;
    return Math.abs(next - goal) < epsilon ? goal : next;
  }

  function draw(dt) {
    const factor = k => reduced.matches ? 1 : 1 - Math.exp(-k * dt);
    const previous = position;
    position = approach(position, target, factor(gesture?.dragging ? 18 : 5.2), .0001);
    const direction = Math.sign(position - previous) || 1;
    if (Math.abs(position) > count * 4 && !gesture) {
      const offset = Math.trunc(position / count) * count;
      position -= offset; target -= offset;
    }
    const next = wrap(Math.round(position), count);
    if (selected !== next) {
      const old = tapes[selected];
      if (old) {
        old.button.tabIndex = -1;
        labels.change(tapes[next].film, direction);
      }
      selected = next;
      tapes[selected].button.tabIndex = 0;
      if (old && document.activeElement === old.button) focusCover();
    }
    const browsing = isBrowsing();
    const onCover = pointerSeen && fine.matches && browsing && !gesture?.dragging && !overControl &&
      Math.abs(target - position) < .3 && Math.abs(mx - width / 2) < depth * .55 && Math.abs(my - centerY) < height * .55;
    const goalY = onCover ? (mx - width / 2) / (depth * .55) * 9 : (mx - width / 2) / width * 5;
    const goalX = onCover ? -(my - centerY) / (height / 2) * 6 : 0;
    tiltY = approach(tiltY, goalY, factor(7), .001);
    tiltX = approach(tiltX, goalX, factor(7), .001);
    const lifting = renderer.draw(position, tiltX, tiltY, browsing && !gesture?.dragging ? hovered : -1, factor(12));
    if (pointerSeen && fine.matches) {
      cx = approach(cx, mx, factor(16), .02);
      cy = approach(cy, my, factor(16), .02);
      const transform = "translate3d(" + cx + "px," + cy + "px,0)";
      if (transform !== lastCursorTransform) {
        cursor.style.transform = transform;
        lastCursorTransform = transform;
      }
      const mode = overControl ? " btn" : onCover ? " open" : hovered >= 0 && browsing ? " spine" : "";
      if (mode !== lastCursorMode) { cursor.className = "cursor" + mode; lastCursorMode = mode; }
    }
    return lifting || position !== target || tiltX !== goalX || tiltY !== goalY ||
      (pointerSeen && fine.matches && (cx !== mx || cy !== my));
  }

  function focusCover() { tapes[selected]?.button.focus({ preventScroll: true }); }
  return { measure, draw, goTo, step, openCurrent, focusCover };
}
