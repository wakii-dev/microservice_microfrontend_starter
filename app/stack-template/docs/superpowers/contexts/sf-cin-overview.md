# Context pack — VU-53-CIN Cinematic Experience (epic-level, SF packs slice từ đây)

## Spec slice (font: REF-SPEC docs/team/ref/ đo trực tiếp site ref)
- Typography: display 12px/700 UPPERCASE tracking 2.4px · label mono 11px/700 tracking 2.64 · H1 hero 18px/300 LIGHT nền SÁNG chữ navy · H2 chapter ~29px/300 · body 12px/400 tracking 0.3 · copy punchy 2 dòng ALL-CAPS cho heading
- Cấu trúc: hero sáng → 5 chương nền TỐI tự chủ gradient (section owns bg, theme-independent) → End CTA + footer numbered. Side-nav Anchor sticky progress single-source.
- Motion vocabulary: parallax nền-gần-fixed (speed 0.08/strength 280) + split-text reveal + mask-reveal clip-path + sticky-pinned 200vh + mood crossfade theo scroll + sun-journey dawn→night. 150-250ms UI, infinite chỉ cho trạng thái. Reduced-motion tắt sạch.
- 3D: ScrollFlythrough (three peer-dep, procedural ship, fallback node) trong Ch4. fps ≥50.
- IP: kỹ thuật+cấu trúc+bố cọc sao chép được; copy/ảnh/art là của Orca (VN-flavored), KHÔNG copy nguyên văn ref.

## Touch map
src/templates/experience/** (chapters, lib/scroll-mood, index.stories) · src/ui/parallax (strength prop) · src/ui/experience3d (ScrollFlythrough) · src/styles/tokens.css (mood vars). Consumer apps KHÔNG đụng.

## ACCEPTANCE (user-visible)
1. Story Templates/Cinematic Experience — Experience chạy end-to-end: hero sáng → 5 chương → CTA, cuộn mượt không giật.
2. Đặt cạnh ref-hero.png/ref-mid-chapter.png: typography + nhịp + mood tương đồng (số đo đúng REF-SPEC).
3. Dark + light + prefers-reduced-motion + 375px đều đẹp; contrast ≥4.5:1 số đo được.
4. Ch4 camera bay quanh tàu 3D thật, không cứng khung.
5. Deploy alias xem được.

## Boundary
KHÔNG đụng: component core ngoài scope (chỉ dùng, không sửa API trừ prop mới đã ghi touch map) · apps consumer · pre-push hook. Việc cũ 6-chapter hiện có = prior art tái sử dụng, không phải ràng buộc.
