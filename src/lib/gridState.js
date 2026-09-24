// Grid state that outlives the grid component between route changes.
export const gridState = {
  position: null, // last {x, y} offset, restored on return
  visited: false, // intro ripple + hint only play on the first visit
  returnToId: null, // project whose tile should receive the shared hero
};
