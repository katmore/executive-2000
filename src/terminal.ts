export interface FooterAction {
  key: string;
  label: string;
  action: () => void;
}

export interface MenuItem {
  key: string;
  label: string;
  action: () => void;
}

const APP_EL = () => document.getElementById("app")!;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function fmtBody(text: string): string {
  return esc(text);
}

let currentActions: FooterAction[] = [];
let keyHandlerBound = false;

interface ActiveMenu {
  items: MenuItem[];
  index: number;
  container: HTMLElement;
}

let activeMenu: ActiveMenu | null = null;

function paintMenu(): void {
  if (!activeMenu) return;
  const { items, index, container } = activeMenu;
  container.innerHTML = "";
  items.forEach((item, i) => {
    const row = document.createElement("div");
    row.className = "menu-item" + (i === index ? " menu-item-active" : "");
    row.dataset.idx = String(i);

    const cursor = document.createElement("span");
    cursor.className = "menu-cursor";
    cursor.textContent = i === index ? "▶" : " ";

    const text = document.createElement("span");
    text.textContent = ` ${item.key.padStart(2, " ")}. ${item.label}`;

    row.appendChild(cursor);
    row.appendChild(text);

    container.appendChild(row);
  });
}

function moveMenu(delta: number): void {
  if (!activeMenu || activeMenu.items.length === 0) return;
  const n = activeMenu.items.length;
  activeMenu.index = (activeMenu.index + delta + n) % n;
  paintMenu();
}

function activateMenu(): void {
  if (!activeMenu || activeMenu.items.length === 0) return;
  activeMenu.items[activeMenu.index]?.action();
}

/**
 * Renders a keyboard-only selectable menu (inverse-video highlight bar,
 * Up/Down to move, Enter to choose) into `container`. No mouse interaction —
 * screens that also want number-entry should pair this with appendSelectionInput.
 */
export function renderMenuItems(
  container: HTMLElement,
  items: MenuItem[],
  startIndex = 0
): void {
  activeMenu = { items, index: startIndex, container };
  paintMenu();
}

function onKeyDown(e: KeyboardEvent): void {
  if (activeMenu) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveMenu(1);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      moveMenu(-1);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      activateMenu();
      return;
    }
  }

  const match = currentActions.find(
    (a) => a.key.toUpperCase() === e.key.toUpperCase()
  );
  if (match) {
    e.preventDefault();
    match.action();
  }
}

export function renderTerminal(opts: {
  sys: string;
  headerLeft: string;
  bodyHtml: string;
  footerActions: FooterAction[];
}): void {
  currentActions = opts.footerActions;
  activeMenu = null;

  if (!keyHandlerBound) {
    window.addEventListener("keydown", onKeyDown);
    keyHandlerBound = true;
  }

  const footerHtml = opts.footerActions
    .map(
      (a) =>
        `<button class="fkey" data-action-key="${esc(a.key)}"><span class="fkey-num">${esc(
          a.key
        )}</span>=${esc(a.label)}</button>`
    )
    .join("");

  APP_EL().innerHTML = `
    <div class="terminal">
      <div class="terminal-header">
        <span>${esc(opts.headerLeft)}</span>
        <span>SYS: ${esc(opts.sys)}</span>
      </div>
      <div class="terminal-body">
        <pre class="terminal-screen">${opts.bodyHtml}</pre>
      </div>
      <div class="terminal-footer">${footerHtml}</div>
    </div>
  `;

  APP_EL()
    .querySelectorAll<HTMLButtonElement>("[data-action-key]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.actionKey!;
        const match = currentActions.find((a) => a.key === key);
        match?.action();
      });
    });
}

/** Inserts a new element of `tag`/`className` immediately after `anchor` and returns it. */
export function insertAfter(anchor: Element, tag: string, className?: string): HTMLElement {
  const el = document.createElement(tag);
  if (className) el.className = className;
  anchor.after(el);
  return el;
}

export function terminalScreenEl(): HTMLElement {
  return APP_EL().querySelector(".terminal-screen")!;
}

export function bindTermLinks(handlers: Record<string, () => void>): void {
  APP_EL()
    .querySelectorAll<HTMLElement>("[data-link]")
    .forEach((el) => {
      const key = el.dataset.link!;
      el.addEventListener("click", () => handlers[key]?.());
    });
}

export function bindInputs(): Record<string, HTMLInputElement> {
  const map: Record<string, HTMLInputElement> = {};
  APP_EL()
    .querySelectorAll<HTMLInputElement>("[data-field]")
    .forEach((el) => {
      map[el.dataset.field!] = el;
    });
  return map;
}

/** Appends a real `Selection ===>` / text input row after `anchor`, AS/400-style. Enter submits. */
export function appendSelectionInput(anchor: Element, onSubmit: (value: string) => void): HTMLInputElement {
  const row = document.createElement("div");
  row.className = "term-input-row";
  const input = document.createElement("input");
  input.type = "text";
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.stopPropagation();
      onSubmit(input.value);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.stopPropagation();
    }
  });
  row.appendChild(input);
  anchor.after(row);
  return input;
}
