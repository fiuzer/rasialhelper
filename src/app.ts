import "./styles.css";
import { studyTimeline } from "./coach/timeline";
import { I18n } from "./i18n";
import { isAlt1Available, sendOverlayPreview } from "./integrations/alt1";
import type { RegionKey } from "./recognition/profiles";
import { setupPresets } from "./setup/catalog";
import { cycleSetupConfidence, getPresetItems } from "./setup/validator";
import {
  advanceTimeline,
  analyzeSetup,
  clearDiagnostics,
  clearSetup,
  createInitialState,
  getSetupReport,
  resetState,
  runCalibration,
  selectPreset,
  updateSettings,
  updateSetupItem,
  type AppState
} from "./state/store";
import type { LanguagePreference } from "./types/languages";

function optionMarkup(value: string, label: string, selected: string): string {
  return `<option value="${value}" ${value === selected ? "selected" : ""}>${label}</option>`;
}

function renderLanguageOptions(i18n: I18n, selected: LanguagePreference): string {
  return [
    optionMarkup("auto", i18n.t("language.auto"), selected),
    optionMarkup("pt-BR", i18n.t("language.pt-BR"), selected),
    optionMarkup("en-US", i18n.t("language.en-US"), selected)
  ].join("");
}

function regionLabel(i18n: I18n, region: RegionKey): string {
  return i18n.t(
    {
      boss: "calibration.regionBoss",
      phase: "calibration.regionPhase",
      hazard: "calibration.regionHazard",
      action: "calibration.regionAction"
    }[region]
  );
}

function buildRecognitionStatusClass(state: AppState): string {
  if (!state.lastMatch?.warning) {
    return "status-good";
  }
  if (state.lastMatch.warning === "uncertain" || state.lastMatch.warning === "language-mismatch") {
    return "status-warn";
  }
  return "status-danger";
}

function describeWarning(i18n: I18n, warning?: string): string {
  switch (warning) {
    case "language-mismatch":
      return i18n.t("calibration.mismatch");
    case "uncertain":
    case "no-match":
      return i18n.t("calibration.uncertain");
    default:
      return i18n.t("calibration.pass");
  }
}

function describeDiagnostic(i18n: I18n, message: string): string {
  switch (message) {
    case "settings-saved":
      return i18n.t("settings.saved");
    case "settings-save-failed":
      return i18n.t("settings.storageError");
    case "language-mismatch":
      return i18n.t("calibration.mismatch");
    case "uncertain":
    case "no-match":
      return i18n.t("calibration.uncertain");
    case "calibration-ok":
      return i18n.t("calibration.pass");
    case "preset-applied":
      return i18n.t("diagnostics.presetApplied");
    case "setup-analyzed":
      return i18n.t("diagnostics.setupAnalyzed");
    case "setup-no-match":
      return i18n.t("diagnostics.setupNoMatch");
    case "setup-cleared":
      return i18n.t("diagnostics.setupCleared");
    default:
      return message;
  }
}

function setupStatusClass(confidence: string): string {
  switch (confidence) {
    case "detected":
      return "status-good";
    case "manual":
      return "status-warn";
    case "uncertain":
      return "status-danger";
    default:
      return "status-muted";
  }
}

function renderSetupCards(state: AppState, i18n: I18n): string {
  return getPresetItems(state.selectedPresetId)
    .map((item) => {
      const itemState = state.setupItems[item.id];
      const confidence = itemState?.confidence ?? "missing";
      return `
        <article class="setup-card">
          <div class="row row-space">
            <div>
              <h3>${i18n.t(item.titleKey)}</h3>
              <p>${i18n.t(item.summaryKey)}</p>
            </div>
            <span class="pill ${setupStatusClass(confidence)}">${i18n.t(
              `setup.statusNames.${confidence}`
            )}</span>
          </div>
          <ul class="detail-list">
            <li><strong>${i18n.t("setup.category")}:</strong> ${i18n.t(
              `setup.categoryNames.${item.category}`
            )}</li>
            <li><strong>${i18n.t("setup.requirement")}:</strong> ${i18n.t(
              `setup.requirementNames.${item.requirement}`
            )}</li>
            <li><strong>${i18n.t("setup.source")}:</strong> ${item.detectionMethods
              .map((mode) => i18n.t(`setup.detectionModes.${mode}`))
              .join(", ")}</li>
            <li><strong>${i18n.t("setup.why")}:</strong> ${i18n.t(item.whyKey)}</li>
            <li><strong>${i18n.t("setup.nextAction")}:</strong> ${i18n.t(item.fixKey)}</li>
          </ul>
          <button class="ghost-button" data-setup-item="${item.id}">
            ${i18n.t("setup.status")}: ${i18n.t(`setup.statusNames.${confidence}`)}
          </button>
        </article>
      `;
    })
    .join("");
}

function renderSetupWarnings(state: AppState, i18n: I18n): string {
  const report = getSetupReport(state);
  if (!report.missingRequired.length) {
    return `<div class="pill status-good">${i18n.t("setup.allRequiredReady")}</div>`;
  }

  const warningItems = getPresetItems(state.selectedPresetId);
  const warningById = Object.fromEntries(warningItems.map((item) => [item.id, item]));

  return [
    ...report.missingRequired.map(
      (id) =>
        `<div class="pill status-danger"><strong>${i18n.t("setup.missingRequired")}:</strong> ${i18n.t(
          warningById[id].titleKey
        )}</div>`
    ),
    ...report.missingRecommended.map(
      (id) =>
        `<div class="pill status-warn"><strong>${i18n.t(
          "setup.missingRecommended"
        )}:</strong> ${i18n.t(warningById[id].titleKey)}</div>`
    )
  ].join("");
}

function render(state: AppState, root: HTMLElement): void {
  const i18n = new I18n(state.resolvedAppLanguage);
  const timelineEvent =
    state.timelineIndex >= 0 ? studyTimeline[state.timelineIndex] : undefined;
  const overlayText = timelineEvent
    ? `${i18n.t("overlay.phase")} ${timelineEvent.phase}: ${i18n.t(
        timelineEvent.recommendationId
      )}`
    : i18n.t("overlay.manualReminder");
  const setupReport = getSetupReport(state);
  const alt1Mode = isAlt1Available();

  root.innerHTML = `
    <main class="shell">
      <section class="hero">
        <div>
          <h1>${i18n.t("app.title")}</h1>
          <p>${i18n.t("app.subtitle")}</p>
          <p class="footer-note">${i18n.t("app.disclaimer")}</p>
        </div>
      </section>

      <section class="grid">
        <article class="panel">
          <h2>${i18n.t("official.title")}</h2>
          <p>${i18n.t("official.description")}</p>
          <div class="pill-list">
            <div class="pill ${alt1Mode ? "status-good" : "status-warn"}">${
              alt1Mode ? i18n.t("official.connected") : i18n.t("official.browserPreview")
            }</div>
            <div class="pill"><strong>${i18n.t("official.devUrl")}:</strong> ${window.location.origin}</div>
            <div class="pill"><strong>${i18n.t("official.buildUrl")}:</strong> http://127.0.0.1:4173</div>
          </div>
          <ol class="ordered-list">
            <li>${i18n.t("official.step1")}</li>
            <li>${i18n.t("official.step2")}</li>
            <li>${i18n.t("official.step3")}</li>
            <li>${i18n.t("official.step4")}</li>
          </ol>
        </article>

        <article class="panel">
          <h2>${i18n.t("settings.title")}</h2>
          <p>${i18n.t("settings.description")}</p>
          <div class="stack">
            <label>
              ${i18n.t("settings.appLanguage")}
              <select id="app-language">${renderLanguageOptions(i18n, state.settings.appLanguage)}</select>
            </label>
            <label>
              ${i18n.t("settings.gameLanguage")}
              <select id="game-language">${renderLanguageOptions(i18n, state.settings.gameLanguage)}</select>
            </label>
            <label class="row">
              <input id="force-language" type="checkbox" ${
                state.settings.forceRecognitionLanguage ? "checked" : ""
              } />
              <span>${i18n.t("settings.forceRecognition")}</span>
            </label>
            <p>${i18n.t("settings.forceRecognitionHelp")}</p>
            <div class="row">
              <button id="save-settings">${i18n.t("settings.save")}</button>
            </div>
          </div>
        </article>

        <article class="panel">
          <h2>${i18n.t("dashboard.title")}</h2>
          <p>${i18n.t("dashboard.overview")}</p>
          <ul class="stats">
            <li class="stat"><strong>${i18n.t("dashboard.appLanguage")}:</strong> ${state.resolvedAppLanguage}</li>
            <li class="stat"><strong>${i18n.t("dashboard.gameLanguage")}:</strong> ${state.resolvedGameLanguage}</li>
            <li class="stat"><strong>${i18n.t("dashboard.status")}:</strong> <span class="${buildRecognitionStatusClass(state)}">${
              state.lastMatch?.warning ? i18n.t("dashboard.uncertain") : i18n.t("dashboard.healthy")
            }</span></li>
            <li class="stat"><strong>${i18n.t("dashboard.confidence")}:</strong> ${
              state.lastMatch ? `${Math.round(state.lastMatch.confidence * 100)}%` : "0%"
            }</li>
          </ul>
          <div class="row">
            <button id="simulate-en">${i18n.t("dashboard.simulateEnglish")}</button>
            <button id="simulate-pt">${i18n.t("dashboard.simulatePortuguese")}</button>
            <button id="reset-state">${i18n.t("dashboard.reset")}</button>
          </div>
          <p class="footer-note">${i18n.t("dashboard.manualModeHelp")}</p>
        </article>
      </section>

      <section class="grid grid-wide">
        <article class="panel panel-wide">
          <h2>${i18n.t("setup.title")}</h2>
          <p>${i18n.t("setup.description")}</p>
          <div class="row">
            <label>
              ${i18n.t("setup.presetLabel")}
              <select id="preset-select">
                ${setupPresets
                  .map((preset) =>
                    optionMarkup(preset.id, i18n.t(preset.titleKey), state.selectedPresetId)
                  )
                  .join("")}
              </select>
            </label>
            <button id="apply-preset">${i18n.t("setup.applyPreset")}</button>
          </div>
          <div class="grid compact-grid">
            <div class="panel panel-subtle">
              <h3>${i18n.t("setup.reviewTitle")}</h3>
              <p>${i18n.t(
                setupPresets.find((preset) => preset.id === state.selectedPresetId)?.descriptionKey ??
                  setupPresets[0].descriptionKey
              )}</p>
              <div class="pill-list">
                <div class="pill"><strong>${i18n.t("setup.readiness")}:</strong> ${setupReport.readinessScore}%</div>
                <div class="pill"><strong>${i18n.t("setup.requiredSummary")}:</strong> ${setupReport.requiredReady}/${setupReport.requiredTotal}</div>
                <div class="pill"><strong>${i18n.t("setup.detectedSummary")}:</strong> ${setupReport.detectedCount}</div>
                <div class="pill"><strong>${i18n.t("setup.manualSummary")}:</strong> ${setupReport.manualCount}</div>
                <div class="pill"><strong>${i18n.t("setup.uncertainSummary")}:</strong> ${setupReport.uncertainCount}</div>
              </div>
              <div class="stack">
                <label>
                  ${i18n.t("setup.sampleLabel")}
                  <textarea id="setup-sample" placeholder="${i18n.t(
                    "setup.samplePlaceholder"
                  )}"></textarea>
                </label>
                <p>${i18n.t("setup.sampleHint")}</p>
                <div class="row">
                  <button id="analyze-setup">${i18n.t("setup.analyze")}</button>
                  <button id="clear-setup">${i18n.t("setup.clear")}</button>
                </div>
              </div>
              <div class="pill-list">
                ${renderSetupWarnings(state, i18n)}
              </div>
            </div>

            <div class="setup-card-list">
              ${renderSetupCards(state, i18n)}
            </div>
          </div>
        </article>
      </section>

      <section class="grid">
        <article class="panel">
          <h2>${i18n.t("overlay.title")}</h2>
          <div class="overlay-preview">
            <div class="overlay-card">
              <strong>${i18n.t("overlay.callout")}</strong>
              <div>${overlayText}</div>
            </div>
          </div>
          <p class="footer-note">${i18n.t("help.mixedLanguage")}</p>
        </article>

        <article class="panel">
          <h2>${i18n.t("coach.title")}</h2>
          <p>${i18n.t("coach.description")}</p>
          <div class="pill-list">
            <div class="pill"><strong>${i18n.t("coach.phaseMarker")}:</strong> ${timelineEvent ? timelineEvent.phase : "-"}</div>
            <div class="pill"><strong>${i18n.t("coach.timeline")}:</strong> ${
              timelineEvent?.mechanicId ?? i18n.t("coach.empty")
            }</div>
            <div class="pill"><strong>${i18n.t("coach.recommended")}:</strong> ${
              timelineEvent ? i18n.t(timelineEvent.recommendationId) : i18n.t("coach.empty")
            }</div>
          </div>
          <div class="row">
            <button id="start-coach">${i18n.t("coach.start")}</button>
            <button id="next-coach">${i18n.t("coach.next")}</button>
            <button id="restart-coach">${i18n.t("coach.restart")}</button>
          </div>
        </article>

        <article class="panel">
          <h2>${i18n.t("calibration.title")}</h2>
          <p>${i18n.t("calibration.description")}</p>
          <div class="stack">
            <label>
              ${i18n.t("calibration.regionLabel")}
              <select id="region-select">
                ${(["boss", "phase", "hazard", "action"] as RegionKey[])
                  .map((region) => optionMarkup(region, regionLabel(i18n, region), "phase"))
                  .join("")}
              </select>
            </label>
            <label>
              ${i18n.t("calibration.sampleLabel")}
              <textarea id="sample-input" placeholder="Phase 2 / Fase 2 / Soul volley / Rajada de almas"></textarea>
            </label>
            <div class="row">
              <button id="run-calibration">${i18n.t("calibration.run")}</button>
              <button id="clear-calibration">${i18n.t("calibration.clear")}</button>
            </div>
          </div>
          <div class="pill-list">
            <div class="pill"><strong>${i18n.t("calibration.result")}:</strong> ${describeWarning(
              i18n,
              state.lastMatch?.warning
            )}</div>
            <div class="pill"><strong>${i18n.t("calibration.match")}:</strong> ${state.lastMatch?.best?.alias ?? "-"}</div>
            <div class="pill"><strong>${i18n.t("calibration.detectedLanguage")}:</strong> ${
              state.lastMatch?.resolvedLanguage ?? state.resolvedGameLanguage
            }</div>
            <div class="pill"><strong>${i18n.t("calibration.selectedLanguage")}:</strong> ${
              state.settings.gameLanguage
            }</div>
          </div>
        </article>
      </section>

      <section class="grid">
        <article class="panel panel-wide">
          <h2>${i18n.t("diagnostics.title")}</h2>
          <p>${i18n.t("diagnostics.description")}</p>
          <ul class="diagnostics">
            ${
              state.diagnostics.length
                ? state.diagnostics
                    .slice(0, 10)
                    .map(
                      (entry) =>
                        `<li><strong>${entry.timestamp}</strong><br />${describeDiagnostic(
                          i18n,
                          entry.message
                        )}</li>`
                    )
                    .join("")
                : `<li>${i18n.t("diagnostics.empty")}</li>`
            }
          </ul>
          <div class="row">
            <button id="clear-diagnostics">${i18n.t("diagnostics.clear")}</button>
          </div>
        </article>
      </section>
    </main>
  `;

  const appLanguageSelect = root.querySelector<HTMLSelectElement>("#app-language");
  const gameLanguageSelect = root.querySelector<HTMLSelectElement>("#game-language");
  const forceLanguageCheckbox = root.querySelector<HTMLInputElement>("#force-language");
  const saveSettingsButton = root.querySelector<HTMLButtonElement>("#save-settings");
  const sampleInput = root.querySelector<HTMLTextAreaElement>("#sample-input");
  const regionSelect = root.querySelector<HTMLSelectElement>("#region-select");
  const runCalibrationButton = root.querySelector<HTMLButtonElement>("#run-calibration");
  const clearCalibrationButton = root.querySelector<HTMLButtonElement>("#clear-calibration");
  const startCoachButton = root.querySelector<HTMLButtonElement>("#start-coach");
  const nextCoachButton = root.querySelector<HTMLButtonElement>("#next-coach");
  const restartCoachButton = root.querySelector<HTMLButtonElement>("#restart-coach");
  const clearDiagnosticsButton = root.querySelector<HTMLButtonElement>("#clear-diagnostics");
  const simulateEnButton = root.querySelector<HTMLButtonElement>("#simulate-en");
  const simulatePtButton = root.querySelector<HTMLButtonElement>("#simulate-pt");
  const resetStateButton = root.querySelector<HTMLButtonElement>("#reset-state");
  const presetSelect = root.querySelector<HTMLSelectElement>("#preset-select");
  const applyPresetButton = root.querySelector<HTMLButtonElement>("#apply-preset");
  const setupSample = root.querySelector<HTMLTextAreaElement>("#setup-sample");
  const analyzeSetupButton = root.querySelector<HTMLButtonElement>("#analyze-setup");
  const clearSetupButton = root.querySelector<HTMLButtonElement>("#clear-setup");
  const setupStatusButtons = root.querySelectorAll<HTMLButtonElement>("[data-setup-item]");

  saveSettingsButton?.addEventListener("click", () => {
    state = updateSettings(
      state,
      window.localStorage,
      {
        appLanguage: (appLanguageSelect?.value ?? "auto") as LanguagePreference,
        gameLanguage: (gameLanguageSelect?.value ?? "auto") as LanguagePreference,
        forceRecognitionLanguage: Boolean(forceLanguageCheckbox?.checked)
      },
      navigator.language
    );
    render(state, root);
  });

  applyPresetButton?.addEventListener("click", () => {
    state = selectPreset(state, presetSelect?.value ?? state.selectedPresetId);
    render(state, root);
  });

  analyzeSetupButton?.addEventListener("click", () => {
    const sample = setupSample?.value.trim() ?? "";
    if (!sample) {
      state = {
        ...state,
        diagnostics: [
          { timestamp: new Date().toISOString(), message: i18n.t("errors.invalidSample") },
          ...state.diagnostics
        ]
      };
      render(state, root);
      return;
    }
    state = analyzeSetup(state, sample);
    render(state, root);
  });

  clearSetupButton?.addEventListener("click", () => {
    state = clearSetup(state);
    render(state, root);
  });

  setupStatusButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const itemId = button.dataset.setupItem;
      if (!itemId) {
        return;
      }
      const current = state.setupItems[itemId];
      state = updateSetupItem(state, itemId, {
        confidence: cycleSetupConfidence(current?.confidence ?? "missing"),
        lastSource: "manual"
      });
      render(state, root);
    });
  });

  runCalibrationButton?.addEventListener("click", () => {
    const sample = sampleInput?.value.trim() ?? "";
    const region = (regionSelect?.value ?? "phase") as RegionKey;
    if (!sample) {
      state = {
        ...state,
        diagnostics: [
          { timestamp: new Date().toISOString(), message: i18n.t("errors.invalidSample") },
          ...state.diagnostics
        ]
      };
      render(state, root);
      return;
    }

    state = runCalibration(state, sample, region);
    render(state, root);
  });

  clearCalibrationButton?.addEventListener("click", () => {
    state = { ...state, lastMatch: undefined };
    render(state, root);
  });

  startCoachButton?.addEventListener("click", () => {
    const nextState = advanceTimeline(state, studyTimeline.length - 1);
    const nextEvent =
      nextState.timelineIndex >= 0 ? studyTimeline[nextState.timelineIndex] : undefined;
    state = {
      ...nextState,
      diagnostics: [
        { timestamp: new Date().toISOString(), message: i18n.t("overlay.start") },
        ...state.diagnostics
      ]
    };
    if (nextEvent) {
      sendOverlayPreview(
        `${i18n.t("overlay.phase")} ${nextEvent.phase}: ${i18n.t(nextEvent.recommendationId)}`
      );
    }
    render(state, root);
  });

  nextCoachButton?.addEventListener("click", () => {
    state = advanceTimeline(state, studyTimeline.length - 1);
    render(state, root);
  });

  restartCoachButton?.addEventListener("click", () => {
    state = { ...state, timelineIndex: -1 };
    render(state, root);
  });

  clearDiagnosticsButton?.addEventListener("click", () => {
    state = clearDiagnostics(state);
    render(state, root);
  });

  simulateEnButton?.addEventListener("click", () => {
    state = runCalibration(state, "Phase 2", "phase");
    render(state, root);
  });

  simulatePtButton?.addEventListener("click", () => {
    state = runCalibration(state, "Fase 2", "phase");
    render(state, root);
  });

  resetStateButton?.addEventListener("click", () => {
    state = resetState(window.localStorage, navigator.language);
    render(state, root);
  });
}

export function bootstrap(root: HTMLElement): void {
  const state = createInitialState(window.localStorage, navigator.language);
  render(state, root);
}
