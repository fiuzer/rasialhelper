import "./styles.css";
import { studyTimeline } from "./coach/timeline";
import { I18n } from "./i18n";
import {
  createAlt1PixelSource,
  isAlt1Available,
  isPixelAccessReady,
  sendOverlayPreview
} from "./integrations/alt1";
import type { RegionKey } from "./recognition/profiles";
import { setupPresets } from "./setup/catalog";
import { cycleSetupConfidence, getPresetItems } from "./setup/validator";
import { trackerDefinitions } from "./tracking/catalog";
import { captureIconTemplate } from "./tracking/icon-matcher";
import { getTrackerProfile } from "./tracking/profiles";
import { clearTrackerIconTemplates, saveTrackerIconTemplates } from "./tracking/template-storage";
import {
  advanceTimeline,
  analyzeSetup,
  clearDiagnostics,
  clearSetup,
  createInitialState,
  getSetupReport,
  resetTrackerCalibration,
  resetVisualCalibration,
  runCalibration,
  runTrackerScan,
  runVisualScan,
  selectPreset,
  selectTrackerProfile,
  selectVisualProfile,
  setTrackerIconTemplates,
  updateSettings,
  updateSetupItem,
  updateTrackerRegionOverride,
  updateTrackerSample,
  updateVisualRegionOverride,
  updateVisualSample,
  type AppState
} from "./state/store";
import type { LanguagePreference } from "./types/languages";
import { resolveRect } from "./visual/detector";
import { getVisualProfile } from "./visual/profiles";

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
    case "visual-profile-applied":
      return i18n.t("diagnostics.visualProfileApplied");
    case "visual-scan-complete":
      return i18n.t("diagnostics.visualScanComplete");
    case "visual-scan-empty":
      return i18n.t("diagnostics.visualScanEmpty");
    case "visual-reset":
      return i18n.t("diagnostics.visualReset");
    case "tracker-profile-applied":
      return i18n.t("diagnostics.trackerProfileApplied");
    case "tracker-scan-complete":
      return i18n.t("diagnostics.trackerScanComplete");
    case "tracker-scan-empty":
      return i18n.t("diagnostics.trackerScanEmpty");
    case "tracker-reset":
      return i18n.t("diagnostics.trackerReset");
    case "tracker-templates-captured":
      return i18n.t("diagnostics.trackerTemplatesCaptured");
    case "tracker-templates-reset":
      return i18n.t("diagnostics.trackerTemplatesReset");
    case "tracker-templates-failed":
      return i18n.t("diagnostics.trackerTemplatesFailed");
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

function renderSetupMini(state: AppState, i18n: I18n): string {
  return getPresetItems(state.selectedPresetId)
    .map((item) => {
      const confidence = state.setupItems[item.id]?.confidence ?? "missing";
      return `
        <button class="simple-row" data-setup-item="${item.id}">
          <span>${i18n.t(item.titleKey)}</span>
          <span class="${setupStatusClass(confidence)}">${i18n.t(`setup.statusNames.${confidence}`)}</span>
        </button>
      `;
    })
    .join("");
}

function renderTrackerMini(state: AppState, i18n: I18n): string {
  return trackerDefinitions
    .map((definition) => {
      const value = state.trackerValues[definition.id];
      const label =
        definition.kind === "toggle"
          ? value?.active
            ? i18n.t("tracker.active")
            : "--"
          : value?.value !== undefined
            ? `${value.value}${value.unit === "seconds" ? "s" : ""}`
            : "--";
      return `
        <article class="metric-card">
          <strong>${i18n.t(definition.shortKey)}</strong>
          <span>${label}</span>
        </article>
      `;
    })
    .join("");
}

function renderTrackedValueList(region: (typeof getTrackerProfile extends (...args: any[]) => infer R ? R : never)["regions"][number], i18n: I18n): string {
  const ids = region.slotAssignments?.length ? region.slotAssignments : region.trackerIds;
  return ids
    .map((id) => {
      const definition = trackerDefinitions.find((entry) => entry.id === id);
      return definition ? i18n.t(definition.shortKey) : id;
    })
    .join(" | ");
}

function renderVisualAdvanced(state: AppState, i18n: I18n): string {
  const profile = getVisualProfile(state.selectedVisualProfileId);
  return profile.regions
    .map((region) => {
      const result = state.visualResults[region.id];
      const override = state.visualRegionOverrides[region.id] ?? {};
      const rect = {
        x: override.x ?? region.defaultRect.x,
        y: override.y ?? region.defaultRect.y,
        w: override.w ?? region.defaultRect.w,
        h: override.h ?? region.defaultRect.h
      };
      return `
        <article class="simple-panel">
          <div class="row row-space">
            <strong>${i18n.t(region.titleKey)}</strong>
            <span class="${setupStatusClass(result?.status ?? "missing")}">${
              result ? i18n.t(`visual.regionStatus.${result.status}`) : i18n.t("visual.regionStatus.idle")
            }</span>
          </div>
          <div class="rect-grid">
            <label>X<input data-rect-input="${region.id}:x" type="number" min="0" max="98" step="1" value="${Math.round(rect.x * 100)}" /></label>
            <label>Y<input data-rect-input="${region.id}:y" type="number" min="0" max="98" step="1" value="${Math.round(rect.y * 100)}" /></label>
            <label>W<input data-rect-input="${region.id}:w" type="number" min="2" max="100" step="1" value="${Math.round(rect.w * 100)}" /></label>
            <label>H<input data-rect-input="${region.id}:h" type="number" min="2" max="100" step="1" value="${Math.round(rect.h * 100)}" /></label>
          </div>
          <textarea data-visual-sample="${region.id}" placeholder="${i18n.t("visual.samplePlaceholder")}">${
            state.visualSamples[region.id] ?? ""
          }</textarea>
          <button class="ghost-button" data-visual-scan="${region.id}">${i18n.t("visual.scanRegion")}</button>
        </article>
      `;
    })
    .join("");
}

function renderTrackerAdvanced(state: AppState, i18n: I18n): string {
  const profile = getTrackerProfile(state.selectedTrackerProfileId);
  return profile.regions
    .map((region) => {
      const result = state.trackerResults[region.id];
      const override = state.trackerRegionOverrides[region.id] ?? {};
      const rect = {
        x: override.x ?? region.defaultRect.x,
        y: override.y ?? region.defaultRect.y,
        w: override.w ?? region.defaultRect.w,
        h: override.h ?? region.defaultRect.h
      };
      return `
        <article class="simple-panel">
          <div class="row row-space">
            <strong>${i18n.t(region.titleKey)}</strong>
            <span class="${setupStatusClass(result?.status ?? "missing")}">${
              result ? i18n.t(`tracker.regionStatus.${result.status}`) : i18n.t("tracker.regionStatus.idle")
            }</span>
          </div>
          <div class="rect-grid">
            <label>X<input data-tracker-rect-input="${region.id}:x" type="number" min="0" max="98" step="1" value="${Math.round(rect.x * 100)}" /></label>
            <label>Y<input data-tracker-rect-input="${region.id}:y" type="number" min="0" max="98" step="1" value="${Math.round(rect.y * 100)}" /></label>
            <label>W<input data-tracker-rect-input="${region.id}:w" type="number" min="2" max="100" step="1" value="${Math.round(rect.w * 100)}" /></label>
            <label>H<input data-tracker-rect-input="${region.id}:h" type="number" min="2" max="100" step="1" value="${Math.round(rect.h * 100)}" /></label>
          </div>
          <div class="summary-line">
            <span>${i18n.t("tracker.linkedValues")}: ${renderTrackedValueList(region, i18n)}</span>
          </div>
          ${
            result?.rawText
              ? `<div class="summary-line"><span>${i18n.t("tracker.lastRead")}: ${result.rawText}</span></div>`
              : ""
          }
          ${
            result?.iconMatches?.length
              ? `<div class="summary-line"><span>${i18n.t("tracker.iconMatches")}: ${result.iconMatches
                  .map((match) => `${trackerDefinitions.find((entry) => entry.id === match.trackerId)?.id ?? match.trackerId}@${match.slotIndex + 1} (${Math.round(match.score * 100)}%)`)
                  .join(" | ")}</span></div>`
              : ""
          }
          <textarea data-tracker-sample="${region.id}" placeholder="${i18n.t("tracker.samplePlaceholder")}">${
            state.trackerSamples[region.id] ?? ""
          }</textarea>
          <button class="ghost-button" data-tracker-scan="${region.id}">${i18n.t("tracker.scanRegion")}</button>
        </article>
      `;
    })
    .join("");
}

function render(state: AppState, root: HTMLElement): void {
  const i18n = new I18n(state.resolvedAppLanguage);
  const timelineEvent = state.timelineIndex >= 0 ? studyTimeline[state.timelineIndex] : undefined;
  const setupReport = getSetupReport(state);
  const alt1Mode = isAlt1Available();
  const pixelReady = isPixelAccessReady();
  const trackerProfile = getTrackerProfile(state.selectedTrackerProfileId);

  root.innerHTML = `
    <main class="shell shell-simple">
      <section class="topbar">
        <div>
          <h1>${i18n.t("app.title")}</h1>
          <p>${i18n.t("app.subtitle")}</p>
        </div>
        <div class="badge-row">
          <span class="badge ${alt1Mode ? "status-good" : "status-warn"}">${
            alt1Mode ? i18n.t("official.connected") : i18n.t("official.browserPreview")
          }</span>
          <span class="badge ${pixelReady ? "status-good" : "status-warn"}">${
            pixelReady ? i18n.t("visual.pixelReady") : i18n.t("visual.pixelNotReady")
          }</span>
        </div>
      </section>

      <section class="main-layout">
        <section class="primary-column">
          <article class="simple-section">
            <div class="row row-space">
              <h2>${i18n.t("tracker.title")}</h2>
              <div class="row">
                <button id="scan-tracker-profile">${i18n.t("tracker.scanAll")}</button>
                <button id="capture-tracker-templates">${i18n.t("tracker.captureTemplates")}</button>
                <button id="clear-tracker-templates">${i18n.t("tracker.clearTemplates")}</button>
                <button id="reset-tracker-profile">${i18n.t("tracker.reset")}</button>
              </div>
            </div>
            <div class="summary-line">
              <span>${i18n.t(trackerProfile.supportedModeKey)}</span>
              <span>${i18n.t("tracker.templatesSummary")}: ${Object.keys(state.trackerIconTemplates).length}</span>
            </div>
            <div class="metric-grid">
              ${renderTrackerMini(state, i18n)}
            </div>
          </article>

          <article class="simple-section">
            <div class="row row-space">
              <h2>${i18n.t("coach.title")}</h2>
              <div class="row">
                <button id="start-coach">${i18n.t("coach.start")}</button>
                <button id="next-coach">${i18n.t("coach.next")}</button>
                <button id="restart-coach">${i18n.t("coach.restart")}</button>
              </div>
            </div>
            <div class="coach-strip">
              <div><strong>${i18n.t("coach.phaseMarker")}:</strong> ${timelineEvent ? timelineEvent.phase : "-"}</div>
              <div><strong>${i18n.t("coach.timeline")}:</strong> ${timelineEvent?.mechanicId ?? i18n.t("coach.empty")}</div>
              <div><strong>${i18n.t("coach.recommended")}:</strong> ${
                timelineEvent ? i18n.t(timelineEvent.recommendationId) : i18n.t("coach.empty")
              }</div>
            </div>
          </article>

          <article class="simple-section">
            <div class="row row-space">
              <h2>${i18n.t("setup.title")}</h2>
              <div class="row">
                <select id="preset-select">
                  ${setupPresets
                    .map((preset) => optionMarkup(preset.id, i18n.t(preset.titleKey), state.selectedPresetId))
                    .join("")}
                </select>
                <button id="apply-preset">${i18n.t("setup.applyPreset")}</button>
              </div>
            </div>
            <div class="summary-line">
              <span>${i18n.t("setup.readiness")}: ${setupReport.readinessScore}%</span>
              <span>${i18n.t("setup.requiredSummary")}: ${setupReport.requiredReady}/${setupReport.requiredTotal}</span>
            </div>
            <div class="simple-list">
              ${renderSetupMini(state, i18n)}
            </div>
          </article>
        </section>

        <aside class="side-column">
          <article class="simple-section">
            <h2>${i18n.t("settings.title")}</h2>
            <div class="stack compact-stack">
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
              <button id="save-settings">${i18n.t("settings.save")}</button>
            </div>
          </article>

          <article class="simple-section">
            <h2>${i18n.t("setup.sampleLabel")}</h2>
            <textarea id="setup-sample" placeholder="${i18n.t("setup.samplePlaceholder")}"></textarea>
            <div class="row">
              <button id="analyze-setup">${i18n.t("setup.analyze")}</button>
              <button id="clear-setup">${i18n.t("setup.clear")}</button>
            </div>
          </article>

          <details class="simple-section details-section">
            <summary>${i18n.t("tracker.title")} / ${i18n.t("visual.title")} / ${i18n.t("calibration.title")}</summary>
            <div class="stack advanced-stack">
              <div class="row">
                <select id="tracker-profile-select">
                  ${optionMarkup("rasial-standard", i18n.t("tracker.profiles.rasialStandard.title"), state.selectedTrackerProfileId)}
                </select>
                <button id="apply-tracker-profile">${i18n.t("tracker.applyProfile")}</button>
              </div>
              ${renderTrackerAdvanced(state, i18n)}

              <div class="row">
                <select id="visual-profile-select">
                  ${optionMarkup("standard-16x9", i18n.t("visual.profiles.standard16x9.title"), state.selectedVisualProfileId)}
                  ${optionMarkup("compact-ui", i18n.t("visual.profiles.compactUi.title"), state.selectedVisualProfileId)}
                </select>
                <button id="apply-visual-profile">${i18n.t("visual.applyProfile")}</button>
                <button id="scan-visual-profile">${i18n.t("visual.scanAll")}</button>
                <button id="reset-visual-profile">${i18n.t("visual.reset")}</button>
              </div>
              ${renderVisualAdvanced(state, i18n)}

              <div class="stack compact-stack">
                <label>
                  ${i18n.t("calibration.regionLabel")}
                  <select id="region-select">
                    ${(["boss", "phase", "hazard", "action"] as RegionKey[])
                      .map((region) => optionMarkup(region, regionLabel(i18n, region), "phase"))
                      .join("")}
                  </select>
                </label>
                <textarea id="sample-input" placeholder="Phase 2 / Fase 2 / Soul volley"></textarea>
                <div class="row">
                  <button id="run-calibration">${i18n.t("calibration.run")}</button>
                  <button id="clear-calibration">${i18n.t("calibration.clear")}</button>
                </div>
              </div>
            </div>
          </details>

          <details class="simple-section details-section">
            <summary>${i18n.t("diagnostics.title")}</summary>
            <ul class="diagnostics compact-diagnostics">
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
            <button id="clear-diagnostics">${i18n.t("diagnostics.clear")}</button>
          </details>
        </aside>
      </section>
    </main>
  `;

  const appLanguageSelect = root.querySelector<HTMLSelectElement>("#app-language");
  const gameLanguageSelect = root.querySelector<HTMLSelectElement>("#game-language");
  const forceLanguageCheckbox = root.querySelector<HTMLInputElement>("#force-language");
  const saveSettingsButton = root.querySelector<HTMLButtonElement>("#save-settings");
  const presetSelect = root.querySelector<HTMLSelectElement>("#preset-select");
  const applyPresetButton = root.querySelector<HTMLButtonElement>("#apply-preset");
  const setupSample = root.querySelector<HTMLTextAreaElement>("#setup-sample");
  const analyzeSetupButton = root.querySelector<HTMLButtonElement>("#analyze-setup");
  const clearSetupButton = root.querySelector<HTMLButtonElement>("#clear-setup");
  const setupStatusButtons = root.querySelectorAll<HTMLButtonElement>("[data-setup-item]");
  const startCoachButton = root.querySelector<HTMLButtonElement>("#start-coach");
  const nextCoachButton = root.querySelector<HTMLButtonElement>("#next-coach");
  const restartCoachButton = root.querySelector<HTMLButtonElement>("#restart-coach");
  const clearDiagnosticsButton = root.querySelector<HTMLButtonElement>("#clear-diagnostics");
  const runCalibrationButton = root.querySelector<HTMLButtonElement>("#run-calibration");
  const clearCalibrationButton = root.querySelector<HTMLButtonElement>("#clear-calibration");
  const sampleInput = root.querySelector<HTMLTextAreaElement>("#sample-input");
  const regionSelect = root.querySelector<HTMLSelectElement>("#region-select");
  const visualProfileSelect = root.querySelector<HTMLSelectElement>("#visual-profile-select");
  const applyVisualProfileButton = root.querySelector<HTMLButtonElement>("#apply-visual-profile");
  const scanVisualProfileButton = root.querySelector<HTMLButtonElement>("#scan-visual-profile");
  const resetVisualProfileButton = root.querySelector<HTMLButtonElement>("#reset-visual-profile");
  const visualSampleInputs = root.querySelectorAll<HTMLTextAreaElement>("[data-visual-sample]");
  const visualRectInputs = root.querySelectorAll<HTMLInputElement>("[data-rect-input]");
  const visualRegionButtons = root.querySelectorAll<HTMLButtonElement>("[data-visual-scan]");
  const trackerProfileSelect = root.querySelector<HTMLSelectElement>("#tracker-profile-select");
  const applyTrackerProfileButton = root.querySelector<HTMLButtonElement>("#apply-tracker-profile");
  const scanTrackerProfileButton = root.querySelector<HTMLButtonElement>("#scan-tracker-profile");
  const captureTrackerTemplatesButton = root.querySelector<HTMLButtonElement>("#capture-tracker-templates");
  const clearTrackerTemplatesButton = root.querySelector<HTMLButtonElement>("#clear-tracker-templates");
  const resetTrackerProfileButton = root.querySelector<HTMLButtonElement>("#reset-tracker-profile");
  const trackerSampleInputs = root.querySelectorAll<HTMLTextAreaElement>("[data-tracker-sample]");
  const trackerRectInputs = root.querySelectorAll<HTMLInputElement>("[data-tracker-rect-input]");
  const trackerRegionButtons = root.querySelectorAll<HTMLButtonElement>("[data-tracker-scan]");

  function syncTrackerInputs(): void {
    trackerSampleInputs.forEach((input) => {
      const regionId = input.dataset.trackerSample;
      if (regionId) {
        state = updateTrackerSample(state, regionId, input.value);
      }
    });
    trackerRectInputs.forEach((input) => {
      const token = input.dataset.trackerRectInput;
      if (!token) {
        return;
      }
      const [regionId, field] = token.split(":");
      state = updateTrackerRegionOverride(state, regionId, { [field]: Number(input.value) / 100 });
    });
  }

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

  startCoachButton?.addEventListener("click", () => {
    const nextState = advanceTimeline(state, studyTimeline.length - 1);
    const nextEvent = nextState.timelineIndex >= 0 ? studyTimeline[nextState.timelineIndex] : undefined;
    state = nextState;
    if (nextEvent) {
      sendOverlayPreview(`${i18n.t("overlay.phase")} ${nextEvent.phase}: ${i18n.t(nextEvent.recommendationId)}`);
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

  applyTrackerProfileButton?.addEventListener("click", () => {
    state = selectTrackerProfile(state, trackerProfileSelect?.value ?? state.selectedTrackerProfileId);
    render(state, root);
  });

  scanTrackerProfileButton?.addEventListener("click", () => {
    syncTrackerInputs();
    state = runTrackerScan(state, createAlt1PixelSource());
    render(state, root);
  });

  captureTrackerTemplatesButton?.addEventListener("click", () => {
    syncTrackerInputs();
    const source = createAlt1PixelSource();
    const profile = getTrackerProfile(state.selectedTrackerProfileId);
    const buffRegion = profile.regions.find((region) => region.id === "buff-bar");
    if (!buffRegion || !source?.isReady()) {
      state = {
        ...state,
        diagnostics: [
          { timestamp: new Date().toISOString(), message: "tracker-templates-failed" },
          ...state.diagnostics
        ]
      };
      render(state, root);
      return;
    }

    const rect = resolveRect(buffRegion.defaultRect, state.trackerRegionOverrides[buffRegion.id]);
    const nextTemplates = { ...state.trackerIconTemplates };
    for (const definition of trackerDefinitions) {
      const defaultSlot = definition.wiki.defaultBarSlot;
      if (!defaultSlot) {
        continue;
      }
      const template = captureIconTemplate(
        source,
        buffRegion.id,
        rect,
        buffRegion.slotCount ?? 1,
        defaultSlot - 1,
        definition.id
      );
      if (template) {
        nextTemplates[definition.id] = template;
      }
    }

    saveTrackerIconTemplates(window.localStorage, nextTemplates);
    state = {
      ...setTrackerIconTemplates(state, nextTemplates),
      diagnostics: [
        {
          timestamp: new Date().toISOString(),
          message: Object.keys(nextTemplates).length ? "tracker-templates-captured" : "tracker-templates-failed"
        },
        ...state.diagnostics
      ]
    };
    render(state, root);
  });

  clearTrackerTemplatesButton?.addEventListener("click", () => {
    clearTrackerIconTemplates(window.localStorage);
    state = {
      ...setTrackerIconTemplates(state, {}),
      diagnostics: [
        { timestamp: new Date().toISOString(), message: "tracker-templates-reset" },
        ...state.diagnostics
      ]
    };
    render(state, root);
  });

  resetTrackerProfileButton?.addEventListener("click", () => {
    state = resetTrackerCalibration(state);
    render(state, root);
  });

  trackerRegionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetRegionId = button.dataset.trackerScan;
      if (!targetRegionId) {
        return;
      }
      syncTrackerInputs();
      const fullScan = runTrackerScan(state, createAlt1PixelSource());
      state = {
        ...fullScan,
        trackerResults: Object.fromEntries(
          Object.entries(fullScan.trackerResults).filter(([regionId]) => regionId === targetRegionId)
        )
      };
      render(state, root);
    });
  });

  applyVisualProfileButton?.addEventListener("click", () => {
    state = selectVisualProfile(state, visualProfileSelect?.value ?? state.selectedVisualProfileId);
    render(state, root);
  });

  scanVisualProfileButton?.addEventListener("click", () => {
    visualSampleInputs.forEach((input) => {
      const regionId = input.dataset.visualSample;
      if (regionId) {
        state = updateVisualSample(state, regionId, input.value);
      }
    });
    visualRectInputs.forEach((input) => {
      const token = input.dataset.rectInput;
      if (!token) {
        return;
      }
      const [regionId, field] = token.split(":");
      state = updateVisualRegionOverride(state, regionId, { [field]: Number(input.value) / 100 });
    });
    state = runVisualScan(state, createAlt1PixelSource());
    render(state, root);
  });

  resetVisualProfileButton?.addEventListener("click", () => {
    state = resetVisualCalibration(state);
    render(state, root);
  });

  visualRegionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetRegionId = button.dataset.visualScan;
      if (!targetRegionId) {
        return;
      }
      visualSampleInputs.forEach((input) => {
        const regionId = input.dataset.visualSample;
        if (regionId) {
          state = updateVisualSample(state, regionId, input.value);
        }
      });
      visualRectInputs.forEach((input) => {
        const token = input.dataset.rectInput;
        if (!token) {
          return;
        }
        const [regionId, field] = token.split(":");
        state = updateVisualRegionOverride(state, regionId, { [field]: Number(input.value) / 100 });
      });
      const fullScan = runVisualScan(state, createAlt1PixelSource());
      state = {
        ...fullScan,
        visualResults: Object.fromEntries(
          Object.entries(fullScan.visualResults).filter(([regionId]) => regionId === targetRegionId)
        )
      };
      render(state, root);
    });
  });

  runCalibrationButton?.addEventListener("click", () => {
    const sample = sampleInput?.value.trim() ?? "";
    if (!sample) {
      return;
    }
    state = runCalibration(state, sample, (regionSelect?.value ?? "phase") as RegionKey);
    render(state, root);
  });

  clearCalibrationButton?.addEventListener("click", () => {
    state = { ...state, lastMatch: undefined };
    render(state, root);
  });
}

export function bootstrap(root: HTMLElement): void {
  const state = createInitialState(window.localStorage, navigator.language);
  render(state, root);
}
