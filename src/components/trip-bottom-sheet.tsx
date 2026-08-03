"use client";

import type { CSSProperties, PointerEvent, ReactNode } from "react";
import { useEffect, useEffectEvent, useRef, useState } from "react";

type TripBottomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expandLabel: string;
  collapseLabel: string;
  summary: ReactNode;
  children: ReactNode;
};

type DragState = {
  pointerId: number;
  startY: number;
  startTy: number;
  lastY: number;
  lastTime: number;
  velocity: number;
  moved: boolean;
};

const VELOCITY_SNAP = 0.55;
const CLICK_THRESHOLD = 8;

export function TripBottomSheet({
  open,
  onOpenChange,
  expandLabel,
  collapseLabel,
  summary,
  children,
}: TripBottomSheetProps) {
  const sheetRef = useRef<HTMLElement>(null);
  const grabRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [maxTy, setMaxTy] = useState(280);
  const [openHeight, setOpenHeight] = useState(0);
  const [ty, setTy] = useState(280);
  const [dragging, setDragging] = useState(false);

  const measure = useEffectEvent(() => {
    const sheet = sheetRef.current;
    const grab = grabRef.current;
    if (!sheet || !grab) return;
    const nextOpenHeight = sheet.offsetHeight;
    const peekHeight = grab.offsetHeight;
    const nextMaxTy = Math.max(0, nextOpenHeight - peekHeight);
    setOpenHeight(nextOpenHeight);
    setMaxTy(nextMaxTy);
    if (!dragRef.current) {
      setTy(open ? 0 : nextMaxTy);
    }
  });

  useEffect(() => {
    measure();
    const sheet = sheetRef.current;
    if (!sheet || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(sheet);
    if (grabRef.current) observer.observe(grabRef.current);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  useEffect(() => {
    if (dragging) return;
    setTy(open ? 0 : maxTy);
  }, [open, maxTy, dragging]);

  const visibleHeight = Math.max(0, openHeight - ty);
  const progress = maxTy > 0 ? 1 - ty / maxTy : open ? 1 : 0;

  useEffect(() => {
    const layout = sheetRef.current?.closest(".viewer-layout");
    if (!(layout instanceof HTMLElement)) return;
    if (window.matchMedia("(min-width: 960px)").matches) {
      layout.style.removeProperty("--sheet-visible");
      return;
    }
    layout.style.setProperty("--sheet-visible", `${visibleHeight}px`);
  }, [visibleHeight]);

  const snapTo = (nextOpen: boolean) => {
    setDragging(false);
    dragRef.current = null;
    setTy(nextOpen ? 0 : maxTy);
    onOpenChange(nextOpen);
  };

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startTy: ty,
      lastY: event.clientY,
      lastTime: performance.now(),
      velocity: 0,
      moved: false,
    };
    setDragging(true);
  };

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const delta = event.clientY - drag.startY;
    if (Math.abs(delta) > CLICK_THRESHOLD) drag.moved = true;
    const nextTy = clamp(drag.startTy + delta, 0, maxTy);
    const now = performance.now();
    const dt = now - drag.lastTime;
    if (dt > 0) {
      drag.velocity = (event.clientY - drag.lastY) / dt;
    }
    drag.lastY = event.clientY;
    drag.lastTime = now;
    setTy(nextTy);
  };

  const onPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // capture may already be released
    }

    if (!drag.moved) {
      snapTo(!open);
      return;
    }

    const shouldOpen =
      drag.velocity < -VELOCITY_SNAP
        ? true
        : drag.velocity > VELOCITY_SNAP
          ? false
          : ty < maxTy * 0.45;
    snapTo(shouldOpen);
  };

  const onPointerCancel = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    snapTo(ty < maxTy * 0.45);
  };

  return (
    <>
      <button
        type="button"
        className="sheet-scrim"
        aria-label={collapseLabel}
        style={{
          opacity: Math.min(1, progress) * 0.34,
          pointerEvents: progress > 0.05 ? "auto" : "none",
        }}
        onClick={() => snapTo(false)}
      />

      <aside
        ref={sheetRef}
        className={`viewer-sheet${open ? " is-open" : " is-peek"}${dragging ? " is-dragging" : ""}`}
        style={
          {
            "--sheet-ty": `${ty}px`,
            "--sheet-visible": `${visibleHeight}px`,
          } as CSSProperties
        }
      >
        <button
          ref={grabRef}
          type="button"
          className="sheet-grab viewer-mobile-only"
          aria-label={open ? collapseLabel : expandLabel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          <span className="sheet-handle-hit">
            <span className="sheet-handle" aria-hidden="true" />
          </span>
          <span className="sheet-summary">{summary}</span>
        </button>
        <div className="sheet-body">{children}</div>
      </aside>
    </>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
