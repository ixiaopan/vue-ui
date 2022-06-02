function ease(k) {
  return 0.5 * (1 - Math.cos(Math.PI * k));
}

const SCROLL_TIME = 468

function step(context) {
  const time = Date.now()
  
  let elapsed = (time - context.startTime) / SCROLL_TIME
  
  var value;
  var currentX;
  var currentY;

  elapsed = elapsed > 1 ? 1 : elapsed;

  value = ease(elapsed);
  if (typeof context.x == 'number') {
    currentX = context.startX + (context.x - context.startX) * value;
    context.scrollable.scrollLeft = currentX
  }
  if (typeof context.y == 'number') {
    currentY = context.startY + (context.y - context.startY) * value;
    context.scrollable.scrollTop = currentY
  }

  // scroll more if we have not reached our destination
  if ((typeof context.x == 'number' && currentX !== context.x) || (typeof context.y == 'number' && currentY !== context.y)) {
    window.requestAnimationFrame(step.bind(window, context));
  }
}

export function smoothScroll(elem: HTMLElement, opts) {
  const startX = elem.scrollLeft
  const startY = elem.scrollTop
  const startTime = Date.now()

  // scroll looping over a frame
  step({
    scrollable: elem,
    startTime: startTime,
    startX: startX,
    startY: startY,
    x: opts.x,
    y: opts.y
  })
}
