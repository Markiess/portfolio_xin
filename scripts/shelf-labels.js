"use strict";

function createShelfLabels(goTo, reduced) {
  const tabs = [...document.querySelectorAll(".decades button")];
  const indicator = document.querySelector(".indicator");
  const masks = [...document.querySelectorAll(".caption .mask")];
  const ease = "cubic-bezier(.2,.8,.2,1)";
  let sizes, current;
  for (const tab of tabs) tab.onclick = () => goTo(Number(tab.dataset.start));

  function setDecade(film) {
    const decade = Math.floor(film.year / 10) * 10;
    const tab = tabs.find(button => button.textContent === decade + "s");
    if (current === tab) return;
    current?.removeAttribute("aria-current");
    current = tab;
    tab.setAttribute("aria-current", "true");
    const box = sizes.get(tab);
    indicator.style.width = box.width + "px";
    indicator.style.transform = "translateX(" + box.left + "px)";
  }

  function measure(film) {
    sizes = new Map(tabs.map(tab => [tab, { width: tab.offsetWidth, left: tab.offsetLeft }]));
    current?.removeAttribute("aria-current");
    current = null;
    setDecade(film);
  }

  function change(film, direction) {
    const values = [film.title, film.romaji + " / " + film.kanji, String(film.year)];
    const previous = masks.map(mask => mask.lastElementChild);
    // Read all three interrupted slide positions before changing any of the masks.
    const starts = reduced.matches ? [] : previous.map(span => getComputedStyle(span).transform);
    masks.forEach((mask, i) => {
      const next = document.createElement("span");
      next.textContent = values[i];
      if (reduced.matches) {
        mask.replaceChildren(next);
        return;
      }
      const old = previous[i];
      old.getAnimations().forEach(animation => animation.cancel());
      old.setAttribute("aria-hidden", "true");
      old.style.cssText = "position:absolute;inset:0";
      const leave = old.animate([
        { transform: starts[i] === "none" ? "translateY(0)" : starts[i] },
        { transform: "translateY(" + (-direction * 105) + "%)" }
      ], { duration: 650, easing: ease, fill: "both" });
      leave.onfinish = () => old.remove();
      mask.append(next);
      next.animate([{ transform: "translateY(" + (direction * 105) + "%)" }, { transform: "translateY(0)" }],
        { duration: 650, easing: ease });
    });
    setDecade(film);
  }

  return { measure, change };
}
