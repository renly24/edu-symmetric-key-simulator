"use client";
import { type RefObject, useEffect, useRef } from "react";

/**
 * 要素の上でマウスホイールを回したとき、1目盛りごとに onStep(+1 / -1) を呼ぶ。
 * ページがスクロールしないように、ホイールの既定の動きを止める（React の onWheel では止められない）。
 */
export function useWheelStep(ref: RefObject<Element | null>, onStep: (dir: 1 | -1) => void) {
  const handler = useRef(onStep);
  useEffect(() => {
    handler.current = onStep;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let acc = 0;
    const onWheel = (e: Event) => {
      const we = e as WheelEvent;
      we.preventDefault();
      // トラックパッドの細かい動きは、ある程度たまってから1目盛りにする
      acc += Math.abs(we.deltaY) >= 40 ? Math.sign(we.deltaY) * 40 : we.deltaY;
      while (Math.abs(acc) >= 40) {
        const dir = acc > 0 ? 1 : -1;
        handler.current(dir);
        acc -= dir * 40;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [ref]);
}

/** 画面上の座標を、SVG の viewBox の座標に直す */
export function svgPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

/** 条件を満たしたら、一度だけ onDone を呼ぶ */
export function useDoneWhen(cond: boolean, onDone?: () => void) {
  const called = useRef(false);
  useEffect(() => {
    if (cond && !called.current) {
      called.current = true;
      onDone?.();
    }
  }, [cond, onDone]);
}
