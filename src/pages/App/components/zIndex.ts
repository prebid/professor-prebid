// The largest z-index browsers accept: ad wrappers, sticky units and consent banners often use it, and the opened
// popover must stay above them. Constants rather than a scan of every element's computed style, which is too slow
// on ad-heavy pages.
export const POPOVER_Z_INDEX = 2147483647;

// One below the popover, so the slot overlays stay above the page but never cover an opened popover.
export const OVERLAY_Z_INDEX = POPOVER_Z_INDEX - 1;
