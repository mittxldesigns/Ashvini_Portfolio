// Grid state that outlives the grid component between route changes.
export const gridState = {
  position: null, // last {x, y} offset, restored on return
  zoom: 1, // map-like scale of the work grid
  visited: false, // intro ripple + hint only play on the first visit
  returnToId: null, // project whose tile should receive the shared hero
  homeFeaturedId: null, // homepage image entering the grid
  homeTarget: null, // center of that image in the viewport
  showHint: false,
};
