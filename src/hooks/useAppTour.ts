"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import "@/styles/driver-oct.css";
import { buildAppTourSteps, type AppTourStep } from "@/lib/appTour";

function waitForElement(selector: string, timeoutMs = 12000): Promise<Element | null> {
  const tryFind = () => document.querySelector(selector);

  const found = tryFind();
  if (found) return Promise.resolve(found);

  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs;
    const observer = new MutationObserver(() => {
      const el = tryFind();
      if (el) {
        observer.disconnect();
        resolve(el);
      } else if (Date.now() > deadline) {
        observer.disconnect();
        resolve(null);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const interval = window.setInterval(() => {
      const el = tryFind();
      if (el) {
        window.clearInterval(interval);
        observer.disconnect();
        resolve(el);
      } else if (Date.now() > deadline) {
        window.clearInterval(interval);
        observer.disconnect();
        resolve(null);
      }
    }, 120);
  });
}

async function resolveStepElement(step: AppTourStep): Promise<Element | null> {
  const primary = await waitForElement(step.element, 8000);
  if (primary) return primary;
  if (step.fallbackElement) {
    return waitForElement(step.fallbackElement, 4000);
  }
  return null;
}

async function ensureRoute(
  router: ReturnType<typeof useRouter>,
  route: string | undefined
): Promise<void> {
  if (!route || window.location.pathname === route) return;
  router.push(route);
  await new Promise((r) => setTimeout(r, 120));
}

function prepareSidebarNav(path: string | undefined): Promise<void> {
  if (!path) return Promise.resolve();
  window.dispatchEvent(
    new CustomEvent("oct-tour-prepare-nav", { detail: { path } })
  );
  return new Promise((r) => setTimeout(r, 380));
}

export function useAppTour() {
  const router = useRouter();
  const driverRef = useRef<Driver | null>(null);
  const stepsRef = useRef<AppTourStep[]>([]);
  const indexRef = useRef(0);
  const onCompleteRef = useRef<(() => void) | undefined>(undefined);
  const activeRef = useRef(false);

  const destroyDriver = useCallback(() => {
    if (driverRef.current?.isActive()) {
      driverRef.current.destroy();
    }
    driverRef.current = null;
    activeRef.current = false;
  }, []);

  const showStepAt = useCallback(
    async (index: number, direction: "next" | "prev" | "init" = "init") => {
      const steps = stepsRef.current;
      const step = steps[index];

      if (!step) {
        destroyDriver();
        onCompleteRef.current?.();
        return;
      }

      if (step.prepareNav) {
        await prepareSidebarNav(step.prepareNav);
      }

      if (step.route) {
        await ensureRoute(router, step.route);
      }

      const element = await resolveStepElement(step);
      if (!element) {
        if (step.optional) {
          const nextIndex =
            direction === "prev"
              ? Math.max(0, index - 1)
              : Math.min(steps.length - 1, index + 1);
          if (nextIndex === index) {
            destroyDriver();
            onCompleteRef.current?.();
            return;
          }
          indexRef.current = nextIndex;
          return showStepAt(nextIndex, direction);
        }
      }

      const total = steps.length;
      const isLast = index === total - 1;
      const isFirst = index === 0;

      destroyDriver();

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
        showButtons: isFirst ? ["next", "close"] : isLast ? ["previous", "next", "close"] : ["previous", "next", "close"],
        steps: [
          {
            element: element ?? undefined,
            popover: {
              title: step.title,
              description: step.description,
              side: step.side ?? "right",
              showProgress: true,
              progressText: `${index + 1} / ${total}`,
              onNextClick: (_el, _s, { driver: d }) => {
                d.destroy();
                if (isLast) {
                  activeRef.current = false;
                  onCompleteRef.current?.();
                  return;
                }
                indexRef.current = index + 1;
                void showStepAt(index + 1, "next");
              },
              onPrevClick: (_el, _s, { driver: d }) => {
                d.destroy();
                indexRef.current = Math.max(0, index - 1);
                void showStepAt(indexRef.current, "prev");
              },
              onCloseClick: (_el, _s, { driver: d }) => {
                d.destroy();
                activeRef.current = false;
                onCompleteRef.current?.();
              },
            },
          },
        ],
        onDestroyed: () => {
          driverRef.current = null;
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
      onCompleteRef.current = onComplete;
      void showStepAt(0);
    },
    [showStepAt]
  );

  const stopTour = useCallback(() => {
    destroyDriver();
    onCompleteRef.current?.();
  }, [destroyDriver]);

  return {
    startTour,
    stopTour,
    isTourActive: () => activeRef.current,
  };
}
