/**
 * Game Constants
 * Centralized configuration for magic numbers, timeouts, and thresholds
 */

// Grid & Isometric
export const GRID_COLS = 36
export const GRID_ROWS = 36
export const TILE_WIDTH = 44
export const TILE_HEIGHT = 32
export const ORIGIN_Y = 1000
export const X_STEP_RATIO = 0.44
export const Y_STEP_RATIO = 0.32

// Building System
export const BUILDING_CENTER_TILE_X = 18
export const BUILDING_CENTER_TILE_Y = 18
export const DRAG_THRESHOLD = 8
export const BUILDING_DEPTH_OFFSET = 1000
export const BUILDING_SCALE_MIN = 0.05
export const BUILDING_SCALE_MAX = 3.0
export const BUILDING_INTERACTION_RADIUS = 0.25

// Camera
export const CAMERA_PAN_SPEED = 8
export const CAMERA_ZOOM_MIN = 0.5
export const CAMERA_ZOOM_MAX = 2.6
export const CAMERA_ZOOM_INITIAL = 0.6
export const CAMERA_ZOOM_SENSITIVITY = 0.001
export const CAMERA_SMOOTHING = 0.1
export const VIEWPORT_ASPECT_RATIO = 16 / 9
export const CAMERA_Y_OFFSET = -250 // Negative moves ground down on screen
export const CAMERA_BOTTOM_PAN_LIMIT = 0.3 // Reduce pan distance downward (0-1, lower = tighter)

// NPC & Population
export const NPC_REST_DURATION = 5000 // ms
export const NPC_WALK_SPEED = 30 // pixels/second
export const NPC_PATHFIND_MAX_STEPS = 50
export const NPC_CAT_COLOR = 0xf4a460 // Sandy brown
export const NPC_CAT_RADIUS = 10
export const POPULATION_SPAWN_HOUR = 6
export const POPULATION_DESPAWN_HOUR = 22

// Time System
export const HOUR_DAY_START = 5
export const HOUR_DAY_END = 21
export const HOUR_MORNING_START = 5
export const HOUR_MORNING_END = 12
export const HOUR_AFTERNOON_START = 12
export const HOUR_AFTERNOON_END = 17
export const HOUR_EVENING_START = 17
export const HOUR_EVENING_END = 21
export const SECONDS_PER_DAY = 86400
export const DAYS_PER_SEASON = 90

// Depth Sorting
export const DEPTH_SCALE_FACTOR = 100 // depth = (tileX + tileY) * DEPTH_SCALE_FACTOR

// UI
export const TIME_UPDATE_INTERVAL = 1000 // ms
export const SIDEBAR_WIDTH = 380 // px
export const SPRITE_LIBRARY_THUMBNAIL_SIZE = 64 // px

// Overlay
export const DARKNESS_OVERLAY_DEPTH = 10000  // ✅ Above video (9999) to dim everything
export const DARKNESS_OVERLAY_MIN_ALPHA = 0
export const DARKNESS_OVERLAY_MAX_ALPHA = 0.5
