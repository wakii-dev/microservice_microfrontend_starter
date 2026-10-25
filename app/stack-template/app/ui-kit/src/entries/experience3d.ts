// Entry subpath '@wakii/ui-kit/experience3d' (PO duyệt 2026-10-18) — WebGL cinematic
// qua peer-dep three + @react-three/fiber (consumer tự cài; devDeps chỉ để dev/test).
// KHÔNG import qua barrel chính — giữ bundle chính 0-deps. Fallback node khi thiếu dep
// (pattern chart/schedule/editor).
export { Scene3D, ShipModel, ScrollFlythrough, type Scene3DProps, type ShipModelProps, type ScrollFlythroughProps } from '../ui/experience3d/index.js';
