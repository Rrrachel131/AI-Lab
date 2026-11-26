import { useFrame } from "@react-three/fiber";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { useEffect, useRef, type PointerEvent, type ReactNode, type RefObject } from "react";
import { MathUtils, Vector3 } from "three";

const DRAG_THRESHOLD = 6;
const MIN_ZOOM = 0.68;
const MAX_ZOOM = 1.65;

interface OrbitView {
  yaw: number;
  pitch: number;
  zoom: number;
  pointerX: number;
  pointerY: number;
}

const defaultView = (): OrbitView => ({ yaw: 0, pitch: 0, zoom: 1, pointerX: 0, pointerY: 0 });
type OrbitViewRef = RefObject<OrbitView>;

export function OrbitViewport({
  children,
  motion,
  locked = false,
  className,
}: {
  children: (view: OrbitViewRef, labels: RefObject<HTMLElement>) => ReactNode;
  motion: boolean;
  locked?: boolean;
  className: string;
}) {
  const area = useRef<HTMLDivElement>(null);
  const labels = useRef<HTMLDivElement>(null!);
  const view = useRef(defaultView());
  const gesture = useRef<{ id: number; x: number; y: number; dragged: boolean } | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    const element = area.current;
    if (!element || locked) return;
    function onWheel(event: WheelEvent) {
      if (!event.shiftKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      zoomBy(Math.sign(event.deltaY || event.deltaX) * 0.1);
    }
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [locked]);

  function zoomBy(change: number) {
    const input = view.current;
    input.zoom = MathUtils.clamp(input.zoom + change, MIN_ZOOM, MAX_ZOOM);
  }

  function rotateBy(yaw: number, pitch: number) {
    const input = view.current;
    input.yaw += yaw;
    input.pitch = MathUtils.clamp(input.pitch + pitch, -0.27, 0.65);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (locked) return;
    const input = view.current;
    const active = gesture.current;
    if (active?.id === event.pointerId && event.buttons === 0 && event.pointerType === "mouse") {
      endGesture(event);
    } else if (active?.id === event.pointerId) {
      const x = event.clientX - active.x;
      const y = event.clientY - active.y;
      if (!active.dragged) {
        if (Math.hypot(x, y) < DRAG_THRESHOLD) return;
        active.dragged = true;
        suppressClick.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.dataset["dragging"] = "";
        input.pointerX = input.pointerY = 0;
      }
      active.x = event.clientX;
      active.y = event.clientY;
      rotateBy(-x * 0.008, y * 0.005);
      return;
    }
    if (motion && event.pointerType === "mouse") {
      const bounds = event.currentTarget.getBoundingClientRect();
      input.pointerX = (2 * (event.clientX - bounds.left)) / bounds.width - 1;
      input.pointerY = 1 - (2 * (event.clientY - bounds.top)) / bounds.height;
    }
  }

  function endGesture(event: PointerEvent<HTMLDivElement>) {
    if (gesture.current?.id !== event.pointerId) return;
    gesture.current = null;
    delete event.currentTarget.dataset["dragging"];
  }

  const buttons = [
    { label: "放大星图", Icon: Plus, action: () => zoomBy(-0.17) },
    { label: "缩小星图", Icon: Minus, action: () => zoomBy(0.17) },
    {
      label: "重置视角",
      Icon: RotateCcw,
      action: () => {
        view.current = defaultView();
      },
    },
  ];

  return (
    <div className="absolute inset-0 isolate">
      <div
        ref={area}
        role="region"
        aria-label="星图视角，方向键旋转，减号与加号缩放，Home 重置"
        tabIndex={0}
        className="absolute inset-0 touch-pan-y cursor-grab outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber data-[dragging]:cursor-grabbing"
        onPointerDownCapture={(event) => {
          if (locked || event.button !== 0 || !event.isPrimary) return;
          suppressClick.current = false;
          gesture.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            dragged: false,
          };
        }}
        onPointerMoveCapture={onPointerMove}
        onPointerUpCapture={endGesture}
        onPointerCancelCapture={endGesture}
        onLostPointerCapture={endGesture}
        onPointerLeave={(event) => {
          view.current.pointerX = view.current.pointerY = 0;
          if (!gesture.current?.dragged) endGesture(event);
        }}
        onClickCapture={(event) => {
          if (suppressClick.current && event.detail > 0) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
        onKeyDown={(event) => {
          if (locked || event.target !== event.currentTarget) return;
          switch (event.key) {
            case "ArrowLeft":
              rotateBy(0.16, 0);
              break;
            case "ArrowRight":
              rotateBy(-0.16, 0);
              break;
            case "ArrowUp":
              rotateBy(0, 0.1);
              break;
            case "ArrowDown":
              rotateBy(0, -0.1);
              break;
            case "+":
            case "=":
              zoomBy(-0.17);
              break;
            case "-":
              zoomBy(0.17);
              break;
            case "Home":
              view.current = defaultView();
              break;
            default:
              return;
          }
          event.preventDefault();
        }}
      >
        <div ref={labels} className="pointer-events-none absolute inset-0 z-10" />
        {children(view, labels)}
      </div>
      <div className={className}>
        <span className="mr-1 hidden font-sans text-[11px] text-ink-muted sm:inline">
          拖动旋转 · Shift + 滚轮缩放
        </span>
        {buttons.map(({ label, Icon, action }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            title={label}
            disabled={locked}
            onClick={action}
            className="inline-grid size-8 place-items-center rounded-full border border-ink-foreground/15 bg-ink/70 text-ink-foreground hover:border-amber/70 hover:text-amber focus-visible:outline-2 focus-visible:outline-amber disabled:opacity-40"
          >
            <Icon aria-hidden className="size-3.5" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function OrbitCamera({
  view,
  height,
  distance,
  lookY = 0,
  motion,
  target,
  onArrive,
}: {
  view: OrbitViewRef;
  height: number;
  distance: number;
  lookY?: number;
  motion: boolean;
  target?: Vector3 | null;
  onArrive?: () => void;
}) {
  const dest = useRef(new Vector3());
  const look = useRef(new Vector3(0, lookY, 0));
  const flightTime = useRef(0);
  const basePitch = Math.atan2(height, distance);
  const baseDistance = Math.hypot(height, distance);
  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.05);
    if (target) {
      const towardCamera = dest.current
        .copy(camera.position)
        .sub(target)
        .normalize()
        .multiplyScalar(1.2);
      camera.position.lerp(towardCamera.add(target), 1 - Math.exp(-4 * dt));
      look.current.lerp(target, 1 - Math.exp(-5 * dt));
      camera.lookAt(look.current);
      const next = flightTime.current + dt;
      if (flightTime.current < 0.82 && next >= 0.82) onArrive?.();
      flightTime.current = next;
      return;
    }
    flightTime.current = 0;
    const input = view.current;
    const yaw = input.yaw + (motion ? input.pointerX * 0.23 : 0);
    const pitch = basePitch + input.pitch + (motion ? input.pointerY * 0.13 : 0);
    const radius = baseDistance * input.zoom;
    const horizontal = Math.cos(pitch) * radius;
    dest.current.set(
      Math.sin(yaw) * horizontal,
      Math.sin(pitch) * radius,
      Math.cos(yaw) * horizontal,
    );
    camera.position.lerp(dest.current, motion ? 1 - Math.exp(-9 * dt) : 1);
    look.current.set(0, lookY, 0);
    camera.lookAt(look.current);
  });
  return null;
}
