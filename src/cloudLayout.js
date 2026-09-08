import cloud from "d3-cloud";
import { packAnchoredCloud } from "./anchoredCloud.js";

function seededRandom(seed) {
  let value = (Math.abs(seed) % 2147483646) + 1;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

// Keep every label in a single packed cloud. Grow the canvas when a pass omits a word.
export function layoutEntityCloud(entities, { width, seed = 1729, spotlightId = null, canvas = () => document.createElement("canvas"), onEnd, onError }) {
  let stopped = false;
  let activeLayout;
  let retryTimer;
  // D3's collision board stores 32 pixels per integer.
  const layoutWidth = Math.max(256, Math.floor(width / 32) * 32);
  const context = canvas().getContext("2d");
  const counts = entities.map((entity) => entity.count);
  const minCount = Math.min(...counts);
  const maxCount = Math.max(...counts);
  const baseWords = entities.map((entity) => {
    const fraction = maxCount === minCount ? 0.35
      : (Math.log(entity.count) - Math.log(minCount)) / (Math.log(maxCount) - Math.log(minCount));
    let size = Math.round(14 + fraction * 22);
    // Measure the same font D3 uses for its sprite, including its one-pixel allowance.
    context.font = `600 ${size + 1}px Fraunces`;
    while (size > 10 && context.measureText(entity.name).width > layoutWidth - 48) {
      size--;
      context.font = `600 ${size + 1}px Fraunces`;
    }
    return { ...entity, text: entity.name, size };
  });
  if (baseWords.some(word => word.id === spotlightId)) {
    const measured = baseWords.map(word => {
      const padding = word.id === spotlightId ? 10 : 3;
      let size = word.id === spotlightId ? Math.max(22, Math.round(word.size * 1.18)) : word.size;
      let metrics;
      do {
        context.font = `600 ${size}px Fraunces`;
        metrics = context.measureText(word.text);
        if (metrics.width + padding * 2 + 4 <= layoutWidth) break;
        size--;
      } while (size > 1);
      const ascent = metrics.actualBoundingBoxAscent || size;
      const descent = metrics.actualBoundingBoxDescent || size * 0.25;
      return { ...word, size, padding, ascent, boxWidth: Math.ceil(Math.max(metrics.width,
        (metrics.actualBoundingBoxLeft || 0) + (metrics.actualBoundingBoxRight || 0)) + padding * 2 + 4),
        boxHeight: Math.ceil(ascent + descent + padding * 2) };
    });
    onEnd(packAnchoredCloud(measured, layoutWidth, spotlightId, seededRandom(seed)));
    return { stop() {} };
  }
  const area = baseWords.reduce((sum, word) => {
    context.font = `600 ${word.size + 1}px Fraunces`;
    return sum + (context.measureText(word.text).width + 8) * (word.size + 6);
  }, 0);
  let height = Math.ceil(Math.max(240, area / (layoutWidth * 1.1)));

  function attempt(pass = 0) {
    if (stopped) return;
    activeLayout = cloud().canvas(canvas).size([layoutWidth, height])
      .words(baseWords.map((word) => ({ ...word }))).padding(2).rotate(() => 0)
      .font("Fraunces").fontWeight(600).fontSize((word) => word.size)
      .spiral("archimedean").random(seededRandom(seed + pass * 104729)).timeInterval(12)
      .on("end", (words) => {
        if (stopped) return;
        if (words.length !== entities.length) {
          if (pass >= 11) {
            onError?.(new Error("The full cloud could not be arranged. Please try Scramble."));
            return;
          }
          height = Math.ceil(height * 1.2);
          retryTimer = setTimeout(() => attempt(pass + 1), 0);
          return;
        }
        const left = Math.min(...words.map((word) => word.x + word.x0));
        const right = Math.max(...words.map((word) => word.x + word.x1));
        const top = Math.min(...words.map((word) => word.y + word.y0));
        const bottom = Math.max(...words.map((word) => word.y + word.y1));
        // Trim spare vertical canvas space without shrinking the labels.
        for (const word of words) {
          word.x -= (left + right) / 2;
          word.y -= (top + bottom) / 2;
        }
        onEnd({ words, width: layoutWidth, height: Math.max(120, Math.ceil(bottom - top + 32)), passes: pass + 1 });
      });
    activeLayout.start();
  }
  attempt();
  return { stop() { stopped = true; clearTimeout(retryTimer); activeLayout?.stop(); } };
}
