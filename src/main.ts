import "./style.css";
import { createInitialState, rankTitle, applyDelta, type GameState } from "./state";
import { LocalStorageStore } from "./storage";
import { advancePeriod, scheduleEffect } from "./effects";
import { LEGACY_PAGES } from "./legacy/pages";
import { availableScenarios, getScenario } from "./scenarios/data";
import type { Choice, ChoiceQuestionOption, DocumentReviewScenario } from "./scenarios/types";
import {
  appendSelectionInput,
  bindInputs,
  clearGlobalHandlers,
  fmtBody,
  insertAfter,
  renderMenuItems,
  renderTerminal,
  terminalScreenEl,
  type FooterAction,
} from "./terminal";

const store = new LocalStorageStore();

type Screen =
  | { type: "main-menu" }
  | { type: "work-queue" }
  | { type: "scenario-choice"; id: string }
  | { type: "scenario-result"; text: string }
  | { type: "doc-intro"; id: string }
  | { type: "legacy-web"; scenarioId: string; pageId: string }
  | { type: "doc-form"; id: string }
  | { type: "doc-scope-warning"; id: string; answers: Record<string, string> }
  | { type: "doc-result"; text: string }
  | { type: "period-summary"; lines: string[] }
  | { type: "promotion"; title: string }
  | { type: "reports" }
  | { type: "system-unavailable"; label: string };

const MAIN_MENU_ITEMS: { key: string; label: string; kind: "work-queue" | "reports" | "stub" }[] = [
  { key: "1", label: "Executive Work Queue", kind: "work-queue" },
  { key: "2", label: "Process Management", kind: "stub" },
  { key: "3", label: "Financial Performance", kind: "stub" },
  { key: "4", label: "Customer Performance", kind: "stub" },
  { key: "5", label: "Personnel / Headcount", kind: "stub" },
  { key: "6", label: "Strategic Initiatives", kind: "stub" },
  { key: "7", label: "Reports", kind: "reports" },
  { key: "8", label: "Messages", kind: "stub" },
  { key: "9", label: "Legacy Systems", kind: "stub" },
];

class Game {
  state: GameState;
  screen: Screen = { type: "main-menu" };

  constructor() {
    this.state = store.load() ?? createInitialState();
  }

  save(): void {
    store.save(this.state);
  }

  goto(screen: Screen): void {
    this.screen = screen;
    this.render();
  }

  metricLine(label: string, value: number, suffix = ""): string {
    return `  ${label.padEnd(24, " ")}${String(Math.round(value)).padStart(6, " ")}${suffix}`;
  }

  render(): void {
    switch (this.screen.type) {
      case "main-menu":
        return this.renderMainMenu();
      case "work-queue":
        return this.renderWorkQueue();
      case "scenario-choice":
        return this.renderScenarioChoice(this.screen.id);
      case "scenario-result":
        return this.renderMessage("PROCESS MAINTENANCE", this.screen.text, () =>
          this.goto({ type: "work-queue" })
        );
      case "doc-intro":
        return this.renderDocIntro(this.screen.id);
      case "legacy-web":
        return this.renderLegacyWeb(this.screen.scenarioId, this.screen.pageId);
      case "doc-form":
        return this.renderDocForm(this.screen.id);
      case "doc-scope-warning":
        return this.renderDocScopeWarning(this.screen.id, this.screen.answers);
      case "doc-result":
        return this.renderMessage("EXECUTIVE REVIEW", this.screen.text, () =>
          this.goto({ type: "work-queue" })
        );
      case "period-summary":
        return this.renderPeriodSummary(this.screen.lines);
      case "promotion":
        return this.renderPromotion(this.screen.title);
      case "reports":
        return this.renderReports();
      case "system-unavailable":
        return this.renderSystemUnavailable(this.screen.label);
    }
  }

  selectMainMenuItem(key: string): void {
    const item = MAIN_MENU_ITEMS.find((i) => i.key === key);
    if (!item) return;
    if (item.kind === "work-queue") this.goto({ type: "work-queue" });
    else if (item.kind === "reports") this.goto({ type: "reports" });
    else this.goto({ type: "system-unavailable", label: item.label });
  }

  renderMainMenu(): void {
    const s = this.state;

    const header =
      `ACME ENTERPRISE MANAGEMENT SYSTEM\n` +
      `PERIOD ${s.period}   RANK: ${rankTitle(s).toUpperCase()}\n` +
      `${"-".repeat(60)}`;

    const divider = "-".repeat(60);

    const metrics =
      `${divider}\n` +
      `MANAGEMENT METRICS\n` +
      this.metricLine("Profit", s.profit) + "\n" +
      this.metricLine("Efficiency", s.efficiency) + "\n" +
      this.metricLine("Executive Confidence", s.executiveConfidence) + "\n\n" +
      `Selection ===> (arrow keys + Enter, or type a number)`;

    const actions: FooterAction[] = [
      { key: "F5", label: "Refresh", action: () => this.render() },
      {
        key: "F9",
        label: "New Game",
        action: () => {
          store.clear();
          this.state = createInitialState();
          this.render();
        },
      },
    ];

    renderTerminal({
      sys: "PRD01",
      headerLeft: "ACME EMS",
      bodyHtml: fmtBody(header),
      footerActions: actions,
    });

    const menuList = insertAfter(terminalScreenEl(), "div", "menu-list");
    renderMenuItems(
      menuList,
      MAIN_MENU_ITEMS.map((i) => ({
        key: i.key,
        label: i.label,
        action: () => this.selectMainMenuItem(i.key),
      }))
    );

    const dividerBlock = insertAfter(menuList, "pre", "terminal-block");
    dividerBlock.textContent = divider;

    const metricsBlock = insertAfter(dividerBlock, "pre", "terminal-block");
    metricsBlock.style.marginTop = "auto";
    metricsBlock.textContent = metrics;

    appendSelectionInput(metricsBlock, (value) => this.selectMainMenuItem(value.trim()));
  }

  renderSystemUnavailable(label: string): void {
    const body =
      `${label.toUpperCase()}\n\n` +
      `CPF5510 MODULE NOT AVAILABLE.\n\n` +
      `This system has not been provisioned for your account.\n` +
      `Contact Enterprise Systems if you believe this is an error.`;

    renderTerminal({
      sys: "PRD01",
      headerLeft: label.toUpperCase(),
      bodyHtml: fmtBody(body),
      footerActions: [{ key: "F12", label: "Return", action: () => this.goto({ type: "main-menu" }) }],
    });
  }

  renderReports(): void {
    const s = this.state;
    let body = `REPORTS\n${"-".repeat(60)}\n\n`;
    body += `MANAGEMENT METRICS\n`;
    body += this.metricLine("Profit", s.profit) + "\n";
    body += this.metricLine("Efficiency", s.efficiency) + "\n";
    body += this.metricLine("Executive Confidence", s.executiveConfidence) + "\n\n";

    body += `DECISION LOG\n`;
    if (s.decisions.length === 0) {
      body += `  (No decisions recorded.)\n`;
    } else {
      for (const d of s.decisions) {
        const title = getScenario(d.scenarioId).title;
        body += `  P${d.period}  ${title.padEnd(38, " ")}${d.choiceId}\n`;
      }
    }

    renderTerminal({
      sys: "PRD01",
      headerLeft: "REPORTS",
      bodyHtml: fmtBody(body),
      footerActions: [{ key: "F12", label: "Return", action: () => this.goto({ type: "main-menu" }) }],
    });
  }

  renderWorkQueue(): void {
    const s = this.state;
    const scenarios = availableScenarios(s.period, s.completedScenarios);

    const header =
      `EXECUTIVE WORK QUEUE                         PERIOD ${s.period}\n` +
      `${"-".repeat(62)}\n\n` +
      `Opt   Item                                  Priority   Status`;

    const actions: FooterAction[] = [
      { key: "F7", label: "Advance Period", action: () => this.advancePeriod() },
      { key: "F12", label: "Return", action: () => this.goto({ type: "main-menu" }) },
    ];

    renderTerminal({
      sys: "PRD01",
      headerLeft: "EXECUTIVE WORK QUEUE",
      bodyHtml: fmtBody(header),
      footerActions: actions,
    });

    if (scenarios.length === 0) {
      const tail = insertAfter(terminalScreenEl(), "pre", "terminal-block");
      tail.textContent = "\n  (No open items. Advance to the next period.)";
      return;
    }

    const menuList = insertAfter(terminalScreenEl(), "div", "menu-list");
    renderMenuItems(
      menuList,
      scenarios.map((sc, i) => ({
        key: `${i + 1}`,
        label: `${sc.title.padEnd(38, " ")}${sc.priority.padEnd(11, " ")}REVIEW`,
        action: () => this.openScenario(sc.id),
      }))
    );
  }

  openScenario(id: string): void {
    const sc = getScenario(id);
    if (sc.kind === "choice") {
      this.goto({ type: "scenario-choice", id });
    } else {
      this.goto({ type: "doc-intro", id });
    }
  }

  renderScenarioChoice(id: string): void {
    const sc = getScenario(id);
    if (sc.kind !== "choice") throw new Error("wrong kind");

    let body = `PROCESS MAINTENANCE                         PROC: ${sc.id.toUpperCase()}\n`;
    body += `${"-".repeat(62)}\n\n`;
    body += `EXECUTIVE MESSAGE:\n${sc.executiveMessage}\n\n`;

    if (sc.processTable) {
      body += `Seq   Function                            Cost/Txn    Required\n`;
      for (const step of sc.processTable) {
        body += `${step.seq}   ${step.fn.padEnd(36, " ")}${step.costPerTxn.padEnd(12, " ")}${
          step.required ? "Y" : "N"
        }\n`;
      }
      body += "\n";
    }

    body += `Choose an action below.`;

    const actions: FooterAction[] = [
      { key: "F12", label: "Return without action", action: () => this.goto({ type: "work-queue" }) },
    ];

    renderTerminal({
      sys: "PRD01",
      headerLeft: sc.title.toUpperCase(),
      bodyHtml: fmtBody(body),
      footerActions: actions,
    });

    const menuList = insertAfter(terminalScreenEl(), "div", "menu-list");
    renderMenuItems(
      menuList,
      sc.choices.map((choice, i) => ({
        key: `${i + 1}`,
        label: choice.label.replace(/^\d+=/, ""),
        action: () => this.resolveChoice(sc.id, choice),
      }))
    );
  }

  resolveChoice(scenarioId: string, choice: Choice): void {
    const s = this.state;
    if (choice.immediate) applyDelta(s, choice.immediate);
    if (choice.delayed) {
      for (const d of choice.delayed) {
        scheduleEffect(s, {
          periodsLater: d.periodsLater,
          source: `${scenarioId}:${choice.id}`,
          label: d.label,
          effects: d.effects,
        });
      }
    }
    s.completedScenarios.push(scenarioId);
    s.decisions.push({ period: s.period, scenarioId, choiceId: choice.id });
    this.save();
    this.goto({ type: "scenario-result", text: choice.resultText });
  }

  renderDocIntro(id: string): void {
    const sc = getScenario(id) as DocumentReviewScenario;
    const artifacts = sc.artifacts ?? [];
    const webRefs = sc.webReferences ?? [];

    const body =
      `DOCUMENT REVIEW REQUIRED\n\n` +
      `Reference: ${sc.id.toUpperCase()}\n\n` +
      `EXECUTIVE MESSAGE:\n${sc.executiveMessage}\n\n` +
      `Supporting resources (select):`;

    const actions: FooterAction[] = [
      { key: "F10", label: "Proceed to response", action: () => this.goto({ type: "doc-form", id }) },
      { key: "F12", label: "Return", action: () => this.goto({ type: "work-queue" }) },
    ];

    renderTerminal({
      sys: "PRD01",
      headerLeft: sc.title.toUpperCase(),
      bodyHtml: fmtBody(body),
      footerActions: actions,
    });

    const menuItems = [
      ...artifacts.map((a, i) => ({
        key: `${i + 1}`,
        label: a.filename,
        action: () => {
          a.generate(this.state);
        },
      })),
      ...webRefs.map((w, i) => ({
        key: `${artifacts.length + i + 1}`,
        label: `[WEB] ${w.label}`,
        action: () => this.goto({ type: "legacy-web", scenarioId: id, pageId: w.pageId }),
      })),
    ];

    const menuList = insertAfter(terminalScreenEl(), "div", "menu-list");
    renderMenuItems(menuList, menuItems);

    const note = insertAfter(menuList, "pre", "terminal-block");
    note.textContent = "\nFile-based documents cannot be viewed in EMS. Web references open in a separate window.";
  }

  renderLegacyWeb(scenarioId: string, pageId: string): void {
    clearGlobalHandlers();
    const page = LEGACY_PAGES[pageId];
    if (!page) throw new Error(`Unknown legacy page: ${pageId}`);

    const app = document.getElementById("app")!;
    app.innerHTML = `
      <div class="legacy-browser">
        <div class="legacy-chrome">
          <span class="legacy-nav-icons">&#9664; Back &nbsp; &#9654; Forward &nbsp; &#8635; Refresh</span>
          <span class="legacy-address-bar">${page.url}</span>
          <button class="legacy-return-btn" id="legacy-return">Return to EMS Terminal</button>
        </div>
        <div class="legacy-content">
          <div class="legacy-content-inner-wrap">${page.bodyHtml}</div>
        </div>
      </div>
    `;

    document
      .getElementById("legacy-return")!
      .addEventListener("click", () => this.goto({ type: "doc-intro", id: scenarioId }));
  }

  renderDocForm(id: string): void {
    const sc = getScenario(id) as DocumentReviewScenario;

    if (sc.choiceQuestion) {
      return this.renderDocChoiceQuestion(id, sc);
    }

    const questions = sc.questions ?? [];
    let body = `EXECUTIVE RESPONSE REQUIRED\n\nBased on supporting documentation, answer below.\n\n`;
    for (const q of questions) body += `  ${q.prompt}\n\n`;

    renderTerminal({
      sys: "PRD01",
      headerLeft: sc.title.toUpperCase(),
      bodyHtml: fmtBody(body),
      footerActions: [
        { key: "F10", label: "Submit", action: () => this.submitDocForm(id) },
        { key: "F12", label: "Return to documents", action: () => this.goto({ type: "doc-intro", id }) },
      ],
    });

    const form = insertAfter(terminalScreenEl(), "div");
    for (const q of questions) {
      const row = document.createElement("div");
      row.className = "term-input-row";
      const label = document.createElement("span");
      label.textContent = q.id + " ===>";
      const input = document.createElement("input");
      input.type = "text";
      input.dataset.field = q.id;
      row.appendChild(label);
      row.appendChild(input);
      form.appendChild(row);
    }
  }

  renderDocChoiceQuestion(id: string, sc: DocumentReviewScenario): void {
    const cq = sc.choiceQuestion!;
    const body = `EXECUTIVE RESPONSE REQUIRED\n\n${cq.prompt}\n\nChoose your response below.`;

    renderTerminal({
      sys: "PRD01",
      headerLeft: sc.title.toUpperCase(),
      bodyHtml: fmtBody(body),
      footerActions: [
        { key: "F12", label: "Return to documents", action: () => this.goto({ type: "doc-intro", id }) },
      ],
    });

    const menuList = insertAfter(terminalScreenEl(), "div", "menu-list");
    renderMenuItems(
      menuList,
      cq.options.map((opt, i) => ({
        key: `${i + 1}`,
        label: opt.label.replace(/^\d+=/, ""),
        action: () => this.resolveChoiceQuestion(id, opt),
      }))
    );
  }

  resolveChoiceQuestion(scenarioId: string, option: ChoiceQuestionOption): void {
    const s = this.state;
    if (option.immediate) applyDelta(s, option.immediate);
    if (option.delayed) {
      for (const d of option.delayed) {
        scheduleEffect(s, {
          periodsLater: d.periodsLater,
          source: `${scenarioId}:${option.id}`,
          label: d.label,
          effects: d.effects,
        });
      }
    }
    s.completedScenarios.push(scenarioId);
    s.decisions.push({ period: s.period, scenarioId, choiceId: option.id });
    this.save();
    this.goto({ type: "doc-result", text: option.resultText });
  }

  submitDocForm(id: string): void {
    const sc = getScenario(id) as DocumentReviewScenario;
    const questions = sc.questions ?? [];
    const inputs = bindInputs();
    const answers: Record<string, string> = {};
    let allCorrect = true;

    for (const q of questions) {
      const raw = (inputs[q.id]?.value ?? "").trim().toUpperCase();
      answers[q.id] = raw;
      const accepted = [q.answer.toUpperCase(), ...(q.aliases ?? []).map((a) => a.toUpperCase())];
      if (!accepted.includes(raw)) allCorrect = false;
    }

    if (!allCorrect) {
      this.goto({
        type: "doc-result",
        text:
          "CPF1132 RESPONSE DOES NOT MATCH SOURCE REPORT.\n\n" +
          "Review the supporting documentation and try again.",
      });
      return;
    }

    if (sc.unsolicited) {
      this.goto({ type: "doc-scope-warning", id, answers });
    } else {
      this.finalizeDocReview(id, false);
    }
  }

  renderDocScopeWarning(id: string, _answers: Record<string, string>): void {
    const sc = getScenario(id) as DocumentReviewScenario;
    if (!sc.unsolicited) throw new Error("no unsolicited config");

    const body = `RESPONSE ACCEPTED.\n\nF10=Submit requested response only\n${sc.unsolicited.optionLabel}`;

    renderTerminal({
      sys: "PRD01",
      headerLeft: sc.title.toUpperCase(),
      bodyHtml: fmtBody(body),
      footerActions: [
        { key: "F10", label: "Submit requested response only", action: () => this.finalizeDocReview(id, false) },
        { key: "F8", label: "Attach unsolicited observation", action: () => this.confirmUnsolicited(id) },
      ],
    });
  }

  confirmUnsolicited(id: string): void {
    const sc = getScenario(id) as DocumentReviewScenario;
    if (!sc.unsolicited) throw new Error("no unsolicited config");

    renderTerminal({
      sys: "PRD01",
      headerLeft: sc.title.toUpperCase(),
      bodyHtml: fmtBody(sc.unsolicited.warningText),
      footerActions: [
        { key: "Y", label: "Yes, continue", action: () => this.finalizeDocReview(id, true) },
        { key: "N", label: "No, cancel", action: () => this.goto({ type: "doc-scope-warning", id, answers: {} }) },
      ],
    });
  }

  finalizeDocReview(id: string, withUnsolicited: boolean): void {
    const sc = getScenario(id) as DocumentReviewScenario;
    const s = this.state;
    if (!sc.onCorrect) throw new Error(`${id}: finalizeDocReview requires onCorrect`);

    if (sc.onCorrect.immediate) applyDelta(s, sc.onCorrect.immediate);
    if (sc.onCorrect.delayed) {
      for (const d of sc.onCorrect.delayed) {
        scheduleEffect(s, {
          periodsLater: d.periodsLater,
          source: `${id}:onCorrect`,
          label: d.label,
          effects: d.effects,
        });
      }
    }

    let text = sc.onCorrect.resultText;

    if (withUnsolicited && sc.unsolicited) {
      applyDelta(s, sc.unsolicited.effects);
      text += "\n\n" + sc.unsolicited.resultText;
    }

    s.completedScenarios.push(id);
    s.decisions.push({ period: s.period, scenarioId: id, choiceId: withUnsolicited ? "unsolicited" : "standard" });
    this.save();
    this.goto({ type: "doc-result", text });
  }

  renderMessage(header: string, text: string, onContinue: () => void): void {
    renderTerminal({
      sys: "PRD01",
      headerLeft: header,
      bodyHtml: fmtBody(text),
      footerActions: [{ key: "F10", label: "Continue", action: onContinue }],
    });
  }

  advancePeriod(): void {
    const applied = advancePeriod(this.state);
    this.checkPromotion();
    this.save();

    const lines = applied.length
      ? applied.map((a) => `  ${a.label}`)
      : ["  No scheduled effects triggered this period."];

    this.goto({ type: "period-summary", lines });
  }

  checkPromotion(): void {
    const s = this.state;
    const nextThreshold = (s.rank + 1) * 2;
    if (s.completedScenarios.length >= nextThreshold && s.executiveConfidence >= 50 && s.rank < 6) {
      s.rank += 1;
      this.pendingPromotion = rankTitle(s);
    }
  }

  pendingPromotion: string | null = null;

  renderPeriodSummary(lines: string[]): void {
    const s = this.state;
    const body =
      `PERIOD TRANSITION\n\n` +
      `Entering Period ${s.period}.\n\n` +
      `Scheduled effects applied:\n` +
      lines.join("\n") +
      `\n`;

    renderTerminal({
      sys: "PRD01",
      headerLeft: "PERIOD TRANSITION",
      bodyHtml: fmtBody(body),
      footerActions: [
        {
          key: "F10",
          label: "Continue",
          action: () => {
            if (this.pendingPromotion) {
              const title = this.pendingPromotion;
              this.pendingPromotion = null;
              this.goto({ type: "promotion", title });
            } else {
              this.goto({ type: "main-menu" });
            }
          },
        },
      ],
    });
  }

  renderPromotion(title: string): void {
    const body =
      `CONGRATULATIONS\n\n` +
      `You have been appointed\n\n` +
      `  ${title.toUpperCase()}\n\n` +
      `Leadership thanks you for your continued transformation efforts.`;

    renderTerminal({
      sys: "PRD01",
      headerLeft: "PROMOTION",
      bodyHtml: fmtBody(body),
      footerActions: [
        { key: "F10", label: "Accept New Role", action: () => this.goto({ type: "main-menu" }) },
      ],
    });
  }
}

const game = new Game();
game.render();
