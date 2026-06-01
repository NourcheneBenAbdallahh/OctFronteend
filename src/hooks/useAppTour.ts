"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import "@/styles/driver-oct.css";
import { buildAppTourSteps, navTourSelector, type AppTourStep } from "@/lib/appTour";

const POLL_MS = 16;

function setTourButtonsBusy(busy: boolean): void {
  const next = document.querySelector(".driver-popover-next-btn");
  const prev = document.querySelector(".driver-popover-prev-btn");
  if (next instanceof HTMLButtonElement) {
    next.disabled = busy;
    if (busy) next.dataset.octTourLabel = next.textContent ?? "";
    next.textContent = busy ? "Chargement…" : next.dataset.octTourLabel ?? "Suivant";
  }
  if (prev instanceof HTMLButtonElement) {
    prev.disabled = busy;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function waitForElement(selector: string, timeoutMs = 900): Promise<Element | null> {
  const tryFind = () => {
    const el = document.querySelector(selector);
    return el && isVisible(el) ? el : null;
  };

  const found = tryFind();
  if (found) return Promise.resolve(found);

  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs;
    const tick = () => {
      const el = tryFind();
      if (el) {
        cleanup();
        resolve(el);
      } else if (Date.now() > deadline) {
        cleanup();
        resolve(null);
      }
    };
    const observer = new MutationObserver(tick);
    observer.observe(document.body, { childList: true, subtree: true });
    const interval = window.setInterval(tick, POLL_MS);
    tick();

    function cleanup() {
      observer.disconnect();
      window.clearInterval(interval);
    }
  });
}

async function resolveStepElement(step: AppTourStep): Promise<Element | null> {
  const primary = await waitForElement(step.element, 700);
  if (primary) return primary;
  if (step.fallbackElement) {
    return waitForElement(step.fallbackElement, 500);
  }
  return null;
}

async function waitForPathname(path: string, timeoutMs = 1800): Promise<void> {
  if (window.location.pathname === path) return;

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (window.location.pathname === path) return;
    await sleep(POLL_MS);
  }
}

async function ensureRoute(
  router: ReturnType<typeof useRouter>,
  route: string | undefined
): Promise<void> {
  if (!route || window.location.pathname === route) return;
  router.push(route);
  await waitForPathname(route);
  await sleep(16);
}

async function prepareSidebarNav(path: string | undefined): Promise<void> {
  if (!path) return;

  const navSelector = navTourSelector(path);
  const existing = document.querySelector(navSelector);
  if (existing && isVisible(existing)) return;

  window.dispatchEvent(
    new CustomEvent("oct-tour-prepare-nav", { detail: { path } })
  );

  const opened = await waitForElement(navSelector, 350);
  if (opened) await sleep(16);
}

async function prepareStep(
  router: ReturnType<typeof useRouter>,
  step: AppTourStep
): Promise<Element | null> {
  await Promise.all([
    step.prepareNav ? prepareSidebarNav(step.prepareNav) : Promise.resolve(),
    step.route ? ensureRoute(router, step.route) : Promise.resolve(),
  ]);
  return resolveStepElement(step);
}

export function useAppTour() {
  const router = useRouter();
  const driverRef = useRef<Driver | null>(null);
  const stepsRef = useRef<AppTourStep[]>([]);
  const indexRef = useRef(0);
  const onCompleteRef = useRef<(() => void) | undefined>(undefined);
  const activeRef = useRef(false);
  const transitioningRef = useRef(false);

  const destroyDriver = useCallback((instance?: Driver | null) => {
    const target = instance ?? driverRef.current;
    if (target?.isActive()) {
      target.destroy();
    }
    if (!instance || instance === driverRef.current) {
      driverRef.current = null;
      activeRef.current = false;
    }
  }, []);

  const showStepAt = useCallback(
    async (
      index: number,
      direction: "next" | "prev" | "init" = "init",
      previousDriver?: Driver
    ) => {
      const steps = stepsRef.current;
      const step = steps[index];

      if (!step) {
        destroyDriver(previousDriver);
        onCompleteRef.current?.();
        return;
      }

      const element = await prepareStep(router, step);

      if (!element) {
        const nextIndex =
          direction === "prev"
            ? Math.max(0, index - 1)
            : Math.min(steps.length - 1, index + 1);
        if (nextIndex === index) {
          destroyDriver(previousDriver);
          onCompleteRef.current?.();
          return;
        }
        indexRef.current = nextIndex;
        return showStepAt(nextIndex, direction, previousDriver);
      }

      const total = steps.length;
      const isLast = index === total - 1;
      const isFirst = index === 0;

      destroyDriver(previousDriver);

      const driverInstance = driver({
        animate: true,
        overlayColor: "#1C2434",
        overlayOpacity: 0.55,
        stagePadding: 10,
        stageRadius: 16,
        allowClose: true,
        showProgress: true,
        progressText: "{{current}} / {{total}}",
        nextBtnText: "Suivant",
        prevBtnText: "Précédent",
        doneBtnText: "Terminer",
        popoverClass: "oct-driver-popover",
        showButtons: isFirst
          ? ["next", "close"]
          : isLast
            ? ["previous", "next", "close"]
            : ["previous", "next", "close"],
        steps: [
          {
            element,
            popover: {
              title: step.title,
              description: step.description,
              side: step.side ?? "right",
              showProgress: true,
              progressText: `${index + 1} / ${total}`,
              onNextClick: (_el, _s, { driver: d }) => {
                if (transitioningRef.current) return;
                if (isLast) {
                  transitioningRef.current = false;
                  d.destroy();
                  activeRef.current = false;
                  onCompleteRef.current?.();
                  return;
                }
                transitioningRef.current = true;
                setTourButtonsBusy(true);
                indexRef.current = index + 1;
                void showStepAt(index + 1, "next", d).finally(() => {
                  transitioningRef.current = false;
                  setTourButtonsBusy(false);
                });
              },
              onPrevClick: (_el, _s, { driver: d }) => {
                if (transitioningRef.current) return;
                transitioningRef.current = true;
                setTourButtonsBusy(true);
                indexRef.current = Math.max(0, index - 1);
                void showStepAt(indexRef.current, "prev", d).finally(() => {
                  transitioningRef.current = false;
                  setTourButtonsBusy(false);
                });
              },
              onCloseClick: (_el, _s, { driver: d }) => {
                transitioningRef.current = false;
                d.destroy();
                activeRef.current = false;
                onCompleteRef.current?.();
              },
            },
          },
        ],
        onDestroyed: () => {
          if (driverRef.current === driverInstance) {
            driverRef.current = null;
            activeRef.current = false;
          }
        },
      });

      driverRef.current = driverInstance;
      activeRef.current = true;
      driverInstance.drive(0);
    },
    [destroyDriver, router]
  );

  const startTour = useCallback(
    (role: string | undefined | null, onComplete?: () => void) => {
      stepsRef.current = buildAppTourSteps(role);
      indexRef.current = 0;
      transitioningRef.current = false;
      onCompleteRef.current = onComplete;
      void showStepAt(0);
    },
    [showStepAt]
  );

  const stopTour = useCallback(() => {
    transitioningRef.current = false;
    destroyDriver();
    onCompleteRef.current?.();
  }, [destroyDriver]);

  return {
    startTour,
    stopTour,
    isTourActive: () => activeRef.current,
  };
}
