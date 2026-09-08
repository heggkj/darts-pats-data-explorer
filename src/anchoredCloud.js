// Pack measured word rectangles around a reserved search result. There is no
// vertical limit: every word gets a slot, including words that fill earlier gaps.
export function packAnchoredCloud(words, width, anchorId, random = Math.random) {
  const anchor = words.find(word => word.id === anchorId);
  if (!anchor) throw new Error('An anchored cloud needs a visible search result');
  const heights = words.map(word => word.boxHeight).sort((a, b) => a - b);
  const rowHeight = heights[Math.floor(heights.length / 2)];
  const occupied = [{ ...anchor, left: (width - anchor.boxWidth) / 2,
    top: words.length > 2 ? rowHeight * 2 : 0 }];
  for (const word of words.filter(item => item.id !== anchorId)) {
    const desiredX = (width - word.boxWidth) * (0.25 + random() * 0.5);
    const levels = [...new Set([0, ...occupied.map(item => item.top + item.boxHeight)])].sort((a, b) => a - b);
    for (const top of levels) {
      const blocked = occupied.filter(item => item.top < top + word.boxHeight && item.top + item.boxHeight > top)
        .map(item => [item.left, item.left + item.boxWidth]).sort((a, b) => a[0] - b[0]);
      const gaps = [];
      let edge = 0;
      for (const [left, right] of [...blocked, [width, width]]) {
        if (left - edge >= word.boxWidth) gaps.push([edge, left - word.boxWidth]);
        edge = Math.max(edge, right);
      }
      if (!gaps.length) continue;
      const positions = gaps.map(([left, right]) => Math.max(left, Math.min(desiredX, right)));
      positions.sort((a, b) => Math.abs(a - desiredX) - Math.abs(b - desiredX));
      occupied.push({ ...word, left: positions[0], top });
      break;
    }
  }
  const height = Math.max(...occupied.map(word => word.top + word.boxHeight)) + 24;
  return { width, height, words: occupied.map(word => ({ ...word,
    x: word.left + word.boxWidth / 2 - width / 2,
    y: word.top + word.padding + word.ascent + 12 - height / 2,
    rotate: 0, x0: -word.boxWidth / 2, x1: word.boxWidth / 2,
    y0: -word.ascent - word.padding, y1: word.boxHeight - word.ascent - word.padding,
  })) };
}
