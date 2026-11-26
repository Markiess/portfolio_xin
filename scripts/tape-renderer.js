"use strict";

// Tape centres use the shared stage translation plus a small local offset.
// Closed tapes keep the same local transform throughout most of a scroll.
function createTapeRenderer(stage, tapes) {
  let height, width, stride, extraWidth, depth;
  let lastPosition;
  let geometryChanged = true;

  function resize(viewportWidth, tapeHeight) {
    width = viewportWidth;
    height = tapeHeight;
    depth = height * 474 / 900;
    const spine = height * 142 / 840;
    const gap = height * .03;
    stride = spine + gap;
    extraWidth = depth - spine + 1.6 * gap;
    stage.style.setProperty("--ws", spine + "px");
    stage.style.setProperty("--d", depth + "px");
    geometryChanged = true;
    return { stride, depth };
  }

  function draw(position, tiltX, tiltY, hovered, liftFactor) {
    if (position !== lastPosition || geometryChanged) {
      stage.style.transform = "translateX(" + (-position * stride) + "px)";
      lastPosition = position;
    }
    let lifting = false;
    const count = tapes.length;
    for (const tape of tapes) {
      const slot = tape.v - count * Math.floor((tape.v - position + count / 2) / count);
      const r = slot - position, distance = Math.abs(r);
      const bump = distance < 1 ? (r + Math.sin(Math.PI * r) / Math.PI) / 2 : Math.sign(r) / 2;
      const x = slot * stride + extraWidth * bump;
      const outside = Math.abs(r * stride + extraWidth * bump) > width / 2 + 1.5 * depth;
      if (tape.button.hidden !== outside) tape.button.hidden = outside;
      if (outside) continue;

      const liftGoal = hovered === tape.v && distance > .5 ? 1 : 0;
      const previousLift = tape.lift;
      tape.lift += (liftGoal - tape.lift) * liftFactor;
      if (Math.abs(tape.lift - liftGoal) < .0001) tape.lift = liftGoal;
      if (tape.lift !== liftGoal) lifting = true;
      const p = Math.max(0, 1 - distance), open = p * p * (3 - 2 * p);
      const rx = tiltX * open, ry = (-90 + tiltY) * open;
      if (geometryChanged || tape.x !== x || previousLift !== tape.lift ||
          tape.open !== open || tape.rx !== rx || tape.ry !== ry) {
        const y = (-open * .025 - tape.lift * .045) * height;
        tape.button.style.transform = "translate3d(" + x + "px," + y + "px," + (open * .2 * height) +
          "px) rotateZ(" + (-4.5 * open) + "deg) rotateX(" + rx + "deg) rotateY(" + ry + "deg)";
        tape.x = x;
        tape.rx = rx;
        tape.ry = ry;
      }
      if (tape.open !== open) {
        tape.spine.style.setProperty("--shade", open * .55);
        tape.cover.style.setProperty("--shade", (1 - open) * .5);
        tape.open = open;
      }
      const layer = Math.round(100 - distance * 4);
      if (tape.layer !== layer) {
        tape.button.style.zIndex = layer;
        tape.layer = layer;
      }
    }
    geometryChanged = false;
    return lifting;
  }

  return { resize, draw };
}
