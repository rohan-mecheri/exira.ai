/* Framework-free scramble/decrypt text animation. Operates directly on a
   DOM element's textContent so it can be driven from anywhere — a React
   effect, a vanilla script — without pulling in a rendering dependency. */

export const CHARSET_ALNUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
export const CHARSET_HEX = "01ABCDEF#$%&*!?/\\{}[]<>";

export interface ScrambleOptions {
  /** Pool random characters are drawn from. Default CHARSET_ALNUM. */
  charset?: string;
  /** Milliseconds between ticks. Default 30. */
  speed?: number;
  /** Stagger, in ms, between one character locking and the next. Default 55. */
  revealDelay?: number;
}

/* Runs a single left-to-right decrypt pass on `el`, ending on `finalText`.
   Character i locks the moment i * revealDelay ms have elapsed and stays
   locked for the rest of the run — resolution reads as a wave moving left
   to right rather than the whole string flickering at once. Whitespace is
   excluded from scrambling so word shapes hold from the first frame.

   Returns a handle rather than a bare promise because callers (see
   components/Scramble.tsx) need to be able to cut a run short — on
   unmount, on a visibility change — without leaving the element mid-glitch
   or leaking the interval. */
export function scramble(
  el: HTMLElement,
  finalText: string,
  opts: ScrambleOptions = {}
): { done: Promise<void>; cancel: () => void } {
  const charset = opts.charset ?? CHARSET_ALNUM;
  const speed = opts.speed ?? 30;
  const revealDelay = opts.revealDelay ?? 55;

  const chars = finalText.split("");
  const isSpace = chars.map((c) => /\s/.test(c));

  let resolveDone: () => void = () => {};
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve;
  });

  let timer: ReturnType<typeof setInterval> | null = null;
  let tick = 0;
  let settled = false;

  const randomChar = () => charset.charAt(Math.floor(Math.random() * charset.length));

  const stop = () => {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };

  // Shared by natural completion and cancel() — either way the element
  // must land on the exact final text and done must resolve, exactly once.
  const finish = () => {
    stop();
    if (settled) return;
    settled = true;
    el.textContent = finalText;
    resolveDone();
  };

  const step = () => {
    const elapsed = tick * speed;
    let allLocked = true;
    let out = "";

    for (let i = 0; i < chars.length; i++) {
      if (isSpace[i] || elapsed >= i * revealDelay) {
        out += chars[i];
      } else {
        out += randomChar();
        allLocked = false;
      }
    }

    el.textContent = out;
    tick += 1;

    if (allLocked) finish();
  };

  timer = setInterval(step, speed);

  return { done, cancel: finish };
}

export interface ObfuscateOptions extends ScrambleOptions {
  /** How many characters are readable at once as the wave passes. Default 3. */
  band?: number;
  /** Ciphered characters between the end of one sweep and the next. Default 6. */
  gap?: number;
}

/* Permanent obfuscation. Unlike scramble(), this never settles: a narrow
   band of true characters sweeps left to right and the string re-ciphers
   behind it, forever.

   The band is deliberately shorter than the string. A decrypt that
   completes leaves a readable value on screen, which is the opposite of
   what a withheld client identifier should do; this one is always mid
   attempt and the whole value is never legible at once. The real string
   stays on the wrapper's aria-label for anyone who needs it. */
export function obfuscate(
  el: HTMLElement,
  text: string,
  opts: ObfuscateOptions = {}
): { stop: () => void } {
  const charset = opts.charset ?? CHARSET_ALNUM;
  const speed = opts.speed ?? 30;
  const revealDelay = opts.revealDelay ?? 55;
  const band = opts.band ?? 3;
  const gap = opts.gap ?? 6;

  const chars = text.split("");
  const isSpace = chars.map((c) => /\s/.test(c));
  const period = chars.length + band + gap;

  let timer: ReturnType<typeof setInterval> | null = null;
  let tick = 0;

  const randomChar = () => charset.charAt(Math.floor(Math.random() * charset.length));

  const step = () => {
    const head = ((tick * speed) / revealDelay) % period;
    let out = "";
    for (let i = 0; i < chars.length; i++) {
      const behind = head - i;
      out += isSpace[i] || (behind >= 0 && behind < band) ? chars[i] : randomChar();
    }
    el.textContent = out;
    tick += 1;
  };

  step();
  timer = setInterval(step, speed);

  return {
    stop: () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    },
  };
}
