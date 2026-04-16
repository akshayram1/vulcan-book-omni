(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // node_modules/@akshayram1/omnibrowser-agent/dist/lib.js
  var __defProp2 = Object.defineProperty;
  var __getOwnPropNames2 = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames2(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp2(target, name, { get: all[name], enumerable: true });
  };
  var parse_action_exports = {};
  __export(parse_action_exports, {
    PARSE_FAILURE_PATTERN: () => PARSE_FAILURE_PATTERN,
    parseAction: () => parseAction,
    parsePlannerResult: () => parsePlannerResult
  });
  function extractFirstJsonObject(text) {
    const start = text.indexOf("{");
    if (start === -1) return null;
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\" && inString) {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) return text.slice(start, i + 1);
      }
    }
    if (depth > 0) {
      return text.slice(start) + "}".repeat(depth);
    }
    return null;
  }
  function parseAction(raw) {
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const candidate = fenceMatch ? fenceMatch[1].trim() : raw.trim();
    const jsonStr = extractFirstJsonObject(candidate);
    if (!jsonStr) {
      return { type: "done", reason: `No JSON object found in: ${raw.slice(0, 120)}` };
    }
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return { type: "done", reason: `JSON parse error for: ${jsonStr.slice(0, 120)}` };
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { type: "done", reason: "Parsed value is not an object" };
    }
    const obj = parsed;
    if (typeof obj.type !== "string" || !VALID_TYPES.has(obj.type)) {
      return { type: "done", reason: `Unknown or missing action type: ${String(obj.type)}` };
    }
    const t = obj.type;
    if ((t === "click" || t === "type" || t === "extract" || t === "focus") && typeof obj.selector !== "string") {
      return { type: "done", reason: `Missing required field 'selector' for action type: ${t}` };
    }
    if (t === "extract" && typeof obj.label !== "string") {
      return { type: "done", reason: `Missing required field 'label' for action type: extract` };
    }
    if (t === "type" && typeof obj.text !== "string") {
      return { type: "done", reason: `Missing required field 'text' for action type: type` };
    }
    if (t === "navigate" && typeof obj.url !== "string") {
      return { type: "done", reason: `Missing required field 'url' for action type: navigate` };
    }
    if (t === "scroll" && typeof obj.deltaY !== "number") {
      return { type: "done", reason: `Missing required field 'deltaY' for action type: scroll` };
    }
    if (t === "wait" && typeof obj.ms !== "number") {
      return { type: "done", reason: `Missing required field 'ms' for action type: wait` };
    }
    if (t === "done" && typeof obj.reason !== "string") {
      return { type: "done", reason: `Missing required field 'reason' for action type: done` };
    }
    return obj;
  }
  function parsePlannerResult(raw) {
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const candidate = fenceMatch ? fenceMatch[1].trim() : raw.trim();
    const jsonStr = extractFirstJsonObject(candidate);
    if (!jsonStr) {
      return { action: { type: "done", reason: `No JSON found in: ${raw.slice(0, 120)}` } };
    }
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return { action: { type: "done", reason: `JSON parse error: ${jsonStr.slice(0, 120)}` } };
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { action: { type: "done", reason: "Parsed value is not an object" } };
    }
    const obj = parsed;
    if (typeof obj.action === "object" && obj.action !== null) {
      const action = parseAction(JSON.stringify(obj.action));
      return {
        action,
        evaluation: typeof obj.evaluation === "string" ? obj.evaluation : void 0,
        memory: typeof obj.memory === "string" ? obj.memory : void 0,
        nextGoal: typeof obj.nextGoal === "string" ? obj.nextGoal : typeof obj.next_goal === "string" ? obj.next_goal : void 0
      };
    }
    return { action: parseAction(jsonStr) };
  }
  var PARSE_FAILURE_PATTERN;
  var VALID_TYPES;
  var init_parse_action = __esm({
    "src/shared/parse-action.ts"() {
      "use strict";
      PARSE_FAILURE_PATTERN = /(No JSON|JSON parse error|Parsed value is not an object|Unknown or missing action type|Missing required field)/;
      VALID_TYPES = /* @__PURE__ */ new Set([
        "click",
        "type",
        "navigate",
        "extract",
        "scroll",
        "focus",
        "wait",
        "done"
      ]);
    }
  });
  function mustFind(selector) {
    const node = document.querySelector(selector);
    if (node instanceof HTMLElement) {
      return node;
    }
    const tagMatch = selector.match(/^(\w+)/);
    if (tagMatch) {
      const tag = tagMatch[1];
      const attrMatch = selector.match(/\[(\w[\w-]*)=["']?([^\]"']+)["']?\]/);
      if (attrMatch) {
        const fallback = document.querySelector(`${tag}[${attrMatch[1]}="${attrMatch[2]}"]`);
        if (fallback instanceof HTMLElement) return fallback;
      }
      const allOfTag = document.querySelectorAll(tag);
      if (allOfTag.length === 1 && allOfTag[0] instanceof HTMLElement) {
        return allOfTag[0];
      }
    }
    throw new Error(`Selector not found: ${selector}`);
  }
  function dispatchInputEvents(el) {
    el.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }
  async function executeAction(action) {
    switch (action.type) {
      case "click": {
        const el = mustFind(action.selector);
        if (el.disabled) {
          throw new Error(`Element is disabled: ${action.selector}`);
        }
        el.click();
        return `Clicked ${action.selector}`;
      }
      case "type": {
        const input = mustFind(action.selector);
        if (input.value === action.text) {
          return `Already contains correct value in ${action.selector}`;
        }
        input.focus();
        if (action.clearFirst) {
          input.value = "";
          dispatchInputEvents(input);
        }
        input.value = `${input.value}${action.text}`;
        dispatchInputEvents(input);
        if (input.value.indexOf(action.text) === -1) {
          throw new Error(`Type verification failed: value did not update for ${action.selector}`);
        }
        return `Typed into ${action.selector}`;
      }
      case "navigate": {
        window.location.href = action.url;
        return `Navigated to ${action.url}`;
      }
      case "extract": {
        const value = mustFind(action.selector).innerText.trim();
        if (!value) {
          throw new Error(`Extract returned empty text from ${action.selector}`);
        }
        return `${action.label}: ${value}`;
      }
      case "scroll": {
        const target = action.selector ? mustFind(action.selector) : document.documentElement;
        target.scrollBy({ top: action.deltaY, behavior: "smooth" });
        return `Scrolled ${action.deltaY > 0 ? "down" : "up"} ${Math.abs(action.deltaY)}px`;
      }
      case "focus": {
        mustFind(action.selector).focus();
        return `Focused ${action.selector}`;
      }
      case "wait": {
        await new Promise((resolve) => setTimeout(resolve, action.ms));
        return `Waited ${action.ms}ms`;
      }
      case "done": {
        return action.reason;
      }
      default:
        return "No-op";
    }
  }
  var CANDIDATE_SELECTOR = "a,button,input,textarea,select,[role='button'],[role='link'],[contenteditable='true']";
  var MAX_CANDIDATES = 60;
  function cssPath(element) {
    if (!(element instanceof HTMLElement)) {
      return element.tagName.toLowerCase();
    }
    if (element.id) {
      return `#${CSS.escape(element.id)}`;
    }
    const tag = element.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") {
      const name = element.getAttribute("name");
      if (name && document.querySelectorAll(`${tag}[name=${CSS.escape(name)}]`).length === 1) {
        return `${tag}[name=${CSS.escape(name)}]`;
      }
      const type = element.type;
      const placeholder = element.getAttribute("placeholder");
      if (placeholder && document.querySelectorAll(`${tag}[placeholder=${CSS.escape(placeholder)}]`).length === 1) {
        return `${tag}[placeholder=${CSS.escape(placeholder)}]`;
      }
      const ariaLabel = element.getAttribute("aria-label");
      if (ariaLabel && document.querySelectorAll(`${tag}[aria-label=${CSS.escape(ariaLabel)}]`).length === 1) {
        return `${tag}[aria-label=${CSS.escape(ariaLabel)}]`;
      }
      if (name && type) {
        const combo = `${tag}[name=${CSS.escape(name)}][type=${CSS.escape(type)}]`;
        if (document.querySelectorAll(combo).length === 1) {
          return combo;
        }
      }
    }
    if (tag === "button" || tag === "a") {
      const ariaLabel = element.getAttribute("aria-label");
      if (ariaLabel && document.querySelectorAll(`${tag}[aria-label=${CSS.escape(ariaLabel)}]`).length === 1) {
        return `${tag}[aria-label=${CSS.escape(ariaLabel)}]`;
      }
    }
    const parts = [];
    let current = element;
    while (current && parts.length < 4) {
      let part = current.tagName.toLowerCase();
      if (current.classList.length > 0) {
        part += `.${Array.from(current.classList).slice(0, 2).map(CSS.escape).join(".")}`;
      }
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter((s) => s.tagName === current.tagName);
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          part += `:nth-of-type(${index})`;
        }
      }
      parts.unshift(part);
      current = parent;
    }
    return parts.join(" > ");
  }
  function isVisible(el) {
    const style = window.getComputedStyle(el);
    if (el.offsetParent === null && el.tagName !== "BODY" && style.position !== "fixed") return false;
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 || rect.height > 0;
  }
  function isInViewport(el) {
    const rect = el.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
  }
  function isActiveElement(el) {
    if (el.classList.contains("active")) return true;
    if (el.getAttribute("aria-selected") === "true") return true;
    const ariaCurrent = el.getAttribute("aria-current");
    if (ariaCurrent && ariaCurrent !== "false") return true;
    if (el.getAttribute("aria-pressed") === "true") return true;
    return false;
  }
  function getAssociatedLabel(el) {
    if (el.id) {
      const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (label) return label.innerText.trim();
    }
    const labelledBy = el.getAttribute("aria-labelledby");
    if (labelledBy) {
      const labelEl = document.getElementById(labelledBy);
      if (labelEl) return labelEl.innerText.trim();
    }
    const ariaLabel = el.getAttribute("aria-label");
    if (ariaLabel) return ariaLabel.trim();
    const parentLabel = el.closest("label");
    if (parentLabel) {
      return Array.from(parentLabel.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent?.trim() ?? "").filter(Boolean).join(" ");
    }
    return "";
  }
  function collectSnapshot() {
    const allNodes = Array.from(
      document.querySelectorAll(CANDIDATE_SELECTOR)
    ).filter(isVisible).filter((el) => !el.closest("[data-agent-exclude]"));
    const inView = allNodes.filter(isInViewport);
    const offScreen = allNodes.filter((el) => !isInViewport(el));
    const nodes = [...inView, ...offScreen].slice(0, MAX_CANDIDATES);
    const candidates = nodes.map((node) => {
      const placeholder = node.placeholder?.trim() || node.getAttribute("placeholder")?.trim();
      const controlValue = node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement || node instanceof HTMLSelectElement ? String(node.value ?? "").trim().slice(0, 120) : void 0;
      const associatedLabel = getAssociatedLabel(node);
      return {
        selector: cssPath(node),
        role: node.getAttribute("role") ?? node.tagName.toLowerCase(),
        text: (node.innerText || node.getAttribute("name") || "").trim().slice(0, 120),
        value: controlValue,
        placeholder: placeholder || void 0,
        label: associatedLabel || void 0,
        active: isActiveElement(node) || void 0
      };
    });
    const textPreview = document.body.innerText.replace(/\s+/g, " ").trim().slice(0, 1500);
    return {
      url: window.location.href,
      title: document.title,
      textPreview,
      candidates
    };
  }
  var URL_PATTERN = /(?:go to|navigate to|open)\s+(https?:\/\/\S+)/i;
  var SEARCH_PATTERN = /search(?:\s+for)?\s+(.+)/i;
  var FILL_PATTERN = /(?:fill|type|enter)\s+"?([^"]+)"?\s+(?:in(?:to)?|for|on)\s+(.+)/i;
  var FILL_WITH_PATTERN = /(?:fill|type|enter)\s+(?:the\s+)?(.+?)\s+(?:field\s+)?with\s+"?([^"]+)"?\s*$/i;
  var CLICK_PATTERN = /click(?:\s+(?:on|the))?\s+(.+)/i;
  function findByText(candidates, text) {
    const lower = text.toLowerCase();
    return candidates.find(
      (c) => c.text.toLowerCase().includes(lower) || (c.placeholder?.toLowerCase().includes(lower) ?? false) || (c.label?.toLowerCase().includes(lower) ?? false)
    );
  }
  function findInput(candidates) {
    return candidates.find(
      (c) => c.role === "input" || c.role === "textarea" || c.selector.includes("input") || c.selector.includes("textarea")
    );
  }
  function findButton(candidates) {
    return candidates.find(
      (c) => c.role === "button" || c.role === "a" || c.selector.includes("button") || c.selector.includes("a")
    );
  }
  function heuristicPlan(input) {
    const { goal, snapshot, history } = input;
    const navMatch = goal.match(URL_PATTERN);
    if (navMatch) {
      return { type: "navigate", url: navMatch[1] };
    }
    const fillMatch = goal.match(FILL_PATTERN);
    if (fillMatch) {
      const [, text, fieldHint] = fillMatch;
      const target = findByText(snapshot.candidates, fieldHint) ?? findInput(snapshot.candidates);
      if (target) {
        return { type: "type", selector: target.selector, text, clearFirst: true, label: target.label || target.text || target.placeholder };
      }
    }
    const fillWithMatch = goal.match(FILL_WITH_PATTERN);
    if (fillWithMatch) {
      const [, fieldHint, text] = fillWithMatch;
      const target = findByText(snapshot.candidates, fieldHint) ?? findInput(snapshot.candidates);
      if (target) {
        return { type: "type", selector: target.selector, text, clearFirst: true, label: target.label || target.text || target.placeholder };
      }
    }
    const searchMatch = goal.match(SEARCH_PATTERN);
    if (searchMatch) {
      const input2 = findInput(snapshot.candidates);
      if (input2) {
        return { type: "type", selector: input2.selector, text: searchMatch[1].trim(), clearFirst: true, label: input2.label || input2.text || input2.placeholder };
      }
    }
    const clickMatch = goal.match(CLICK_PATTERN);
    if (clickMatch) {
      const target = findByText(snapshot.candidates, clickMatch[1].trim());
      if (target) {
        return { type: "click", selector: target.selector, label: target.text };
      }
    }
    const firstInput = findInput(snapshot.candidates);
    const firstButton = findButton(snapshot.candidates);
    if (firstInput && !history.some((h) => h.startsWith("Typed"))) {
      const searchTerm = goal.replace(/.*(?:search|find|look up)\s+/i, "").trim();
      return { type: "type", selector: firstInput.selector, text: searchTerm, clearFirst: true, label: firstInput.label || firstInput.text || firstInput.placeholder };
    }
    if (firstButton && !history.some((h) => h.startsWith("Clicked"))) {
      return { type: "click", selector: firstButton.selector, label: firstButton.text };
    }
    return { type: "done", reason: "No further heuristic actions available" };
  }
  function toPlannerResult(raw) {
    if ("action" in raw && typeof raw.action === "object") {
      return raw;
    }
    return { action: raw };
  }
  async function parsePlannerText(raw) {
    const { parsePlannerResult: parsePlannerResult2, PARSE_FAILURE_PATTERN: PARSE_FAILURE_PATTERN2 } = await Promise.resolve().then(() => (init_parse_action(), parse_action_exports));
    const result = parsePlannerResult2(raw);
    const parseFailed = result.action.type === "done" && PARSE_FAILURE_PATTERN2.test(result.action.reason);
    return { result, parseFailed };
  }
  async function normalizeBridgeResponse(raw) {
    if (typeof raw === "string") {
      const { result, parseFailed } = await parsePlannerText(raw);
      return { result, parseFailed, rawText: raw };
    }
    return { result: toPlannerResult(raw), parseFailed: false };
  }
  async function planNextAction(config, input) {
    if (config.kind === "heuristic") {
      return { action: heuristicPlan(input) };
    }
    const bridge = window.__browserAgentWebLLM;
    if (!bridge) {
      return {
        action: {
          type: "done",
          reason: "WebLLM bridge is not configured. Use heuristic mode or wire a WebLLM bridge implementation."
        }
      };
    }
    const plannerInput = { ...input, systemPrompt: config.systemPrompt };
    const firstAttempt = await normalizeBridgeResponse(await bridge.plan(plannerInput, config.modelId));
    if (!firstAttempt.parseFailed) {
      const action = firstAttempt.result.action;
      if (action.type === "wait" || action.type === "done") {
        const heuristic = heuristicPlan(input);
        if (heuristic.type !== "done") {
          return { action: heuristic };
        }
      }
      return firstAttempt.result;
    }
    if (bridge.retryInvalidJson && firstAttempt.rawText) {
      const retryAttempt = await normalizeBridgeResponse(
        await bridge.retryInvalidJson(plannerInput, firstAttempt.rawText, config.modelId)
      );
      if (!retryAttempt.parseFailed) {
        return retryAttempt.result;
      }
    }
    return {
      action: {
        type: "done",
        reason: "WebLLM output could not be parsed after retry."
      }
    };
  }
  var RISKY_KEYWORDS = /\b(delete|remove|pay|purchase|submit|confirm|checkout|transfer|withdraw|send)\b/i;
  function elementTextRisky(text) {
    return text != null && RISKY_KEYWORDS.test(text);
  }
  function candidateText(selector, candidates) {
    const match = candidates?.find((c) => c.selector === selector);
    return match ? [match.label, match.text, match.placeholder].filter(Boolean).join(" ") || void 0 : void 0;
  }
  function assessRisk(action, candidates) {
    switch (action.type) {
      case "navigate": {
        if (action.url.startsWith("#") || action.url.startsWith("/") || action.url.startsWith("./") || action.url.startsWith("../")) {
          return "safe";
        }
        try {
          const next = new URL(action.url);
          if (!["http:", "https:"].includes(next.protocol)) {
            return "blocked";
          }
        } catch {
          return "blocked";
        }
        return "safe";
      }
      case "click": {
        const text = action.label ?? candidateText(action.selector, candidates) ?? action.selector;
        return elementTextRisky(text) ? "review" : "safe";
      }
      case "type": {
        const text = action.label ?? candidateText(action.selector, candidates) ?? action.selector;
        return elementTextRisky(text) ? "review" : "safe";
      }
      case "focus":
      case "scroll":
      case "wait":
        return "safe";
      case "extract":
        return "review";
      case "done":
        return "safe";
      default:
        return "review";
    }
  }
  init_parse_action();
  var MAX_TEXT_PREVIEW_LENGTH = 800;
  var DEFAULT_SYSTEM_PROMPT = [
    "You are OmniBrowser Agent, an on-page web automation planner.",
    "Choose exactly one next action using the provided page snapshot.",
    "",
    "Output rules:",
    "- Reply with only one valid JSON object (no markdown fences, no prose).",
    '- JSON shape must be: { "evaluation": string, "memory": string, "nextGoal": string, "action": AgentAction }.',
    "- Keep evaluation/memory/nextGoal concise but informative.",
    "",
    "Valid AgentAction shapes:",
    '- {"type":"click","selector":"<css>","label":"<optional>"}',
    '- {"type":"type","selector":"<css>","text":"<text>","clearFirst":true|false,"label":"<optional>"}',
    '- {"type":"navigate","url":"https://..."}',
    '- {"type":"extract","selector":"<css>","label":"<label>"}',
    '- {"type":"scroll","selector":"<optional css>","deltaY":number}',
    '- {"type":"focus","selector":"<css>"}',
    '- {"type":"wait","ms":number}',
    '- {"type":"done","reason":"<reason>"}',
    "",
    "IMPORTANT: You MUST use selectors exactly as listed in the candidates. NEVER invent or guess selectors.",
    "For form controls, candidate `value` is the current filled value. `placeholder` is only hint text and does NOT mean the field is filled.",
    "If you cannot find a matching candidate for a target element, use the closest match from the candidates list.",
    "When previous step failed, recover by trying a different candidate selector or fallback strategy.",
    "NEVER use navigate for in-page tab switches or buttons \u2014 use click with the button's selector instead.",
    "",
    "Loop prevention rules (CRITICAL):",
    "- If a candidate shows 'state: active', it is already selected/active \u2014 do NOT click it again.",
    "- Check the History before acting. If the same selector was already clicked or typed in a recent step, do NOT repeat it \u2014 proceed to the next logical step or return done.",
    "- If the goal is already achieved (value is set, element clicked, task complete), return done immediately.",
    "- NEVER click a navigation tab or button more than once per goal unless the page changed to a different section."
  ].join("\n");
  function formatCandidate(candidate, index) {
    const parts = [
      `${candidate.role || "element"}`,
      `selector: ${JSON.stringify(candidate.selector)}`,
      `text: ${JSON.stringify(candidate.text || "")}`
    ];
    if (candidate.label) {
      parts.push(`label: ${JSON.stringify(candidate.label)}`);
    }
    if (candidate.value !== void 0) {
      parts.push(`value: ${JSON.stringify(candidate.value)}`);
    }
    if (candidate.placeholder) {
      parts.push(`placeholder: ${JSON.stringify(candidate.placeholder)}`);
    }
    if (candidate.active) {
      parts.push(`state: active`);
    }
    return `[${index + 1}] ${parts.join(" | ")}`;
  }
  function buildSystemPrompt(customPrompt) {
    if (!customPrompt?.trim()) {
      return DEFAULT_SYSTEM_PROMPT;
    }
    return `${DEFAULT_SYSTEM_PROMPT}

Additional instructions:
${customPrompt.trim()}`;
  }
  function buildUserMessage(input) {
    const { goal, snapshot, history, memory, lastError } = input;
    const candidates = snapshot.candidates.map(formatCandidate).join("\n");
    const historyLines = history.length > 0 ? history.map((step, index) => `${index + 1}. ${step}`).join("\n") : "(none)";
    return [
      `Goal: ${goal}`,
      "",
      "Page snapshot:",
      `- URL: ${snapshot.url}`,
      `- Title: ${snapshot.title}`,
      `- Text preview (first ${MAX_TEXT_PREVIEW_LENGTH} chars): ${JSON.stringify(snapshot.textPreview.slice(0, MAX_TEXT_PREVIEW_LENGTH))}`,
      "",
      `Interactive candidates (${snapshot.candidates.length}):`,
      candidates || "(none)",
      "",
      "History:",
      historyLines,
      "",
      `Working memory: ${memory ? JSON.stringify(memory) : "(none)"}`,
      `Last error: ${lastError ? JSON.stringify(lastError) : "(none)"}`,
      "If Last error is present, recover and choose a different valid action."
    ].join("\n");
  }
  var INVALID_JSON_RETRY_MESSAGE = [
    "Your reply was not valid JSON. Output ONLY a JSON object \u2014 no explanation, no markdown, no extra text.",
    'Required format: {"evaluation":"...","memory":"...","nextGoal":"...","action":{"type":"click","selector":"EXACT_SELECTOR","label":"..."}}'
  ].join("\n");
  var BARE_ACTION_RETRY_MESSAGE = [
    "Still not valid JSON. Output ONLY the action object. No evaluation, memory, or nextGoal fields.",
    'Example: {"type":"type","selector":"EXACT_SELECTOR_FROM_LIST","text":"value","clearFirst":true}',
    'Example: {"type":"click","selector":"EXACT_SELECTOR_FROM_LIST","label":"button text"}'
  ].join("\n");
  function isParseFailure(result) {
    if (result.action.type !== "done") {
      return false;
    }
    const reason = result.action.reason;
    return PARSE_FAILURE_PATTERN.test(reason);
  }
  function contentToText(content) {
    if (typeof content === "string") {
      return content;
    }
    if (Array.isArray(content)) {
      const chunks = content.map((part) => {
        if (typeof part === "string") {
          return part;
        }
        if (typeof part === "object" && part !== null && "text" in part && typeof part.text === "string") {
          return part.text;
        }
        return "";
      }).filter(Boolean);
      return chunks.join("\n");
    }
    return "";
  }
  function failureResult(attempts) {
    return {
      action: {
        type: "done",
        reason: `WebLLM returned invalid JSON after ${attempts} attempt${attempts === 1 ? "" : "s"}. Unable to continue.`
      }
    };
  }
  async function createCompletion(engine, messages, modelId) {
    const response = await engine.chat.completions.create({
      messages,
      temperature: 0,
      max_tokens: 700,
      ...modelId ? { model: modelId } : {}
    });
    return contentToText(response.choices?.[0]?.message?.content).trim();
  }
  function buildBaseMessages(input) {
    return [
      { role: "system", content: buildSystemPrompt(input.systemPrompt) },
      { role: "user", content: buildUserMessage(input) }
    ];
  }
  async function retryInvalidJsonWithHistory(engine, baseMessages, badOutput, modelId) {
    const attempt2Messages = [
      ...baseMessages,
      { role: "assistant", content: badOutput },
      { role: "user", content: INVALID_JSON_RETRY_MESSAGE }
    ];
    const raw2 = await createCompletion(engine, attempt2Messages, modelId);
    const result2 = parsePlannerResult(raw2);
    if (!isParseFailure(result2)) return result2;
    const attempt3Messages = [
      ...attempt2Messages,
      { role: "assistant", content: raw2 },
      { role: "user", content: BARE_ACTION_RETRY_MESSAGE }
    ];
    const raw3 = await createCompletion(engine, attempt3Messages, modelId);
    const result3 = parsePlannerResult(raw3);
    if (!isParseFailure(result3)) return result3;
    return failureResult(3);
  }
  function createWebLLMBridge(engine) {
    return {
      async plan(input, modelId) {
        const baseMessages = buildBaseMessages(input);
        const raw1 = await createCompletion(engine, baseMessages, modelId);
        const result1 = parsePlannerResult(raw1);
        if (!isParseFailure(result1)) return result1;
        return retryInvalidJsonWithHistory(engine, baseMessages, raw1, modelId);
      },
      async retryInvalidJson(input, badOutput, modelId) {
        const baseMessages = buildBaseMessages(input);
        return retryInvalidJsonWithHistory(engine, baseMessages, badOutput, modelId);
      }
    };
  }
  init_parse_action();
  var DEFAULT_PLANNER = { kind: "heuristic" };
  var MAX_CONSECUTIVE_ERRORS = 2;
  var LOOP_WINDOW = 8;
  var LOOP_THRESHOLD = 3;
  function actionSignature(action) {
    if (action.type === "click" || action.type === "type" || action.type === "focus") {
      return `${action.type}:${action.selector}`;
    }
    if (action.type === "wait") {
      return "wait";
    }
    return null;
  }
  var BrowserAgent = class {
    constructor(config, events = {}) {
      __publicField(this, "session");
      __publicField(this, "maxSteps");
      __publicField(this, "stepDelayMs");
      __publicField(this, "events");
      __publicField(this, "isStopped", false);
      __publicField(this, "signal");
      __publicField(this, "recentActionSigs", []);
      this.session = {
        id: crypto.randomUUID(),
        tabId: null,
        goal: config.goal,
        mode: config.mode ?? "human-approved",
        planner: config.planner ?? DEFAULT_PLANNER,
        history: [],
        isRunning: false
      };
      this.maxSteps = config.maxSteps ?? 20;
      this.stepDelayMs = config.stepDelayMs ?? 500;
      this.events = events;
      this.signal = config.signal;
    }
    getSession() {
      return { ...this.session, history: [...this.session.history] };
    }
    get isRunning() {
      return this.session.isRunning;
    }
    get hasPendingAction() {
      return this.session.pendingAction != null;
    }
    async start() {
      this.isStopped = false;
      this.recentActionSigs = [];
      this.session.isRunning = true;
      this.events.onStart?.(this.getSession());
      return this.runLoop();
    }
    async resume() {
      if (this.session.pendingAction) {
        const approvalResult = await this.approvePendingAction();
        if (approvalResult.status === "error") {
          return approvalResult;
        }
      }
      this.session.isRunning = true;
      return this.runLoop();
    }
    async runLoop() {
      let consecutiveErrors = 0;
      let lastError;
      for (let step = 0; step < this.maxSteps; step += 1) {
        if (this.isStopped || !this.session.isRunning) {
          return { status: "done", message: "Stopped" };
        }
        if (this.signal?.aborted) {
          this.session.isRunning = false;
          return { status: "done", message: "Aborted" };
        }
        const result2 = await this.tick(lastError);
        this.events.onStep?.(result2, this.getSession());
        if (result2.status === "error") {
          consecutiveErrors += 1;
          lastError = result2.message;
          this.session.history.push(`Error: ${result2.message}`);
          if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            this.session.isRunning = false;
            this.events.onError?.(new Error(result2.message), this.getSession());
            this.events.onDone?.(result2, this.getSession());
            return result2;
          }
          await this.delay(this.stepDelayMs);
          continue;
        }
        consecutiveErrors = 0;
        lastError = void 0;
        this.session.history.push(result2.message);
        if (result2.status === "needs_approval") {
          this.session.pendingAction = result2.action;
          this.session.isRunning = false;
          if (result2.action) {
            this.events.onApprovalRequired?.(result2.action, this.getSession());
          }
          return result2;
        }
        if (["done", "blocked"].includes(result2.status)) {
          this.session.isRunning = false;
          this.events.onDone?.(result2, this.getSession());
          return result2;
        }
        await this.delay(this.stepDelayMs);
      }
      const result = { status: "done", message: "Reached max steps" };
      this.session.history.push(result.message);
      this.session.isRunning = false;
      this.events.onMaxStepsReached?.(this.getSession());
      this.events.onDone?.(result, this.getSession());
      return result;
    }
    async approvePendingAction() {
      if (!this.session.pendingAction) {
        return { status: "error", message: "No pending action to approve" };
      }
      try {
        const message = await executeAction(this.session.pendingAction);
        const result = {
          status: "executed",
          message,
          action: this.session.pendingAction
        };
        this.session.history.push(message);
        this.session.pendingAction = void 0;
        this.session.isRunning = true;
        this.events.onStep?.(result, this.getSession());
        return result;
      } catch (error) {
        this.session.isRunning = false;
        this.events.onError?.(error, this.getSession());
        return { status: "error", message: String(error) };
      }
    }
    stop() {
      this.isStopped = true;
      this.session.isRunning = false;
    }
    async tick(lastError) {
      try {
        const snapshot = collectSnapshot();
        const plannerResult = await planNextAction(this.session.planner, {
          goal: this.session.goal,
          snapshot,
          history: this.session.history,
          lastError,
          memory: this.session.memory
        });
        if (plannerResult.memory !== void 0) {
          this.session.memory = plannerResult.memory;
        }
        return this.processAction(plannerResult, snapshot.candidates);
      } catch (error) {
        return { status: "error", message: String(error) };
      }
    }
    async processAction(plannerResult, candidates) {
      const { action } = plannerResult;
      const reflection = plannerResult.evaluation !== void 0 || plannerResult.memory !== void 0 || plannerResult.nextGoal !== void 0 ? { evaluation: plannerResult.evaluation, memory: plannerResult.memory, nextGoal: plannerResult.nextGoal } : void 0;
      const sig = actionSignature(action);
      if (sig) {
        this.recentActionSigs.push(sig);
        if (this.recentActionSigs.length > LOOP_WINDOW) {
          this.recentActionSigs.shift();
        }
        const repeatCount = this.recentActionSigs.filter((s) => s === sig).length;
        if (repeatCount >= LOOP_THRESHOLD) {
          return {
            status: "done",
            action,
            message: "Loop detected \u2014 goal appears to be complete.",
            reflection
          };
        }
      }
      const risk = assessRisk(action, candidates);
      if (risk === "blocked") {
        return { status: "blocked", action, message: `Blocked action: ${JSON.stringify(action)}`, reflection };
      }
      if (this.session.mode === "human-approved" && risk === "review") {
        return { status: "needs_approval", action, message: `Approval needed for ${action.type}`, reflection };
      }
      if (action.type === "done") {
        return { status: "done", action, message: action.reason, reflection };
      }
      const message = await executeAction(action);
      return { status: "executed", action, message, reflection };
    }
    async delay(ms) {
      await new Promise((resolve) => setTimeout(resolve, ms));
    }
  };
  function createBrowserAgent(config, events) {
    return new BrowserAgent(config, events);
  }

  // src/chatbot.js
  var MODEL_ID = "Llama-3.2-1B-Instruct-q4f16_1-MLC";
  var ROOT_LINK_SELECTOR = "link[href*='assets/stylesheets/extra.css']";
  var SUGGESTIONS = [
    "Summarize this page",
    "What is the data product lifecycle?",
    "Show related guides"
  ];
  var DOC_ASSISTANT_PROMPT = [
    "You are Omni, a documentation assistant embedded in a MkDocs site.",
    "You must answer using only the context provided in the goal.",
    "Never click, type, navigate, focus, scroll, wait, or extract.",
    "Always return a single done action.",
    "Put the final answer in the done.reason field.",
    "If the answer is not in context, say that briefly and suggest the most relevant pages from the provided matches."
  ].join(" ");
  var state = {
    panelOpen: false,
    loading: false,
    aiEnabled: false,
    aiLoading: false,
    searchIndex: null,
    searchIndexPromise: null,
    engine: null
  };
  function getSiteRoot() {
    const rootHint = document.querySelector(ROOT_LINK_SELECTOR);
    if (rootHint) {
      return new URL(rootHint.getAttribute("href"), window.location.href).href.replace(/assets\/stylesheets\/extra\.css.*$/, "");
    }
    return new URL(".", window.location.href).href;
  }
  function normalize(text) {
    return (text || "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ");
  }
  function tokenize(text) {
    return normalize(text).split(/\s+/).filter((token) => token.length > 2);
  }
  function unique(tokens) {
    return [...new Set(tokens)];
  }
  function escapeHtml(text) {
    return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }
  function currentPagePath() {
    return window.location.pathname.replace(/^\/+/, "");
  }
  function currentPageTitle() {
    return document.querySelector(".md-content h1")?.textContent?.trim() || document.title;
  }
  function currentPageExcerpt() {
    const article = document.querySelector(".md-content .md-content__inner");
    return (article?.textContent || "").replace(/\s+/g, " ").trim().slice(0, 2400);
  }
  function scoreDoc(doc, queryTokens) {
    const haystack = normalize(`${doc.title || ""} ${doc.text || ""} ${doc.location || ""}`);
    let score = 0;
    for (const token of queryTokens) {
      if (haystack.includes(token)) {
        score += 2;
      }
      if (normalize(doc.title || "").includes(token)) {
        score += 4;
      }
      if ((doc.location || "").includes(token.replace(/\s+/g, "-"))) {
        score += 1;
      }
    }
    if ((doc.location || "").replace(/^\/+/, "") === currentPagePath()) {
      score += 3;
    }
    return score;
  }
  async function loadSearchIndex() {
    if (state.searchIndex) return state.searchIndex;
    if (state.searchIndexPromise) return state.searchIndexPromise;
    const searchUrl = new URL("search/search_index.json", getSiteRoot()).href;
    state.searchIndexPromise = fetch(searchUrl).then((response) => {
      if (!response.ok) {
        throw new Error(`Unable to load search index (${response.status})`);
      }
      return response.json();
    }).then((payload) => {
      state.searchIndex = payload.docs || [];
      return state.searchIndex;
    });
    return state.searchIndexPromise;
  }
  function findMatches(question, docs) {
    const queryTokens = unique(tokenize(question));
    return docs.map((doc) => ({ ...doc, score: scoreDoc(doc, queryTokens) })).filter((doc) => doc.score > 0).sort((left, right) => right.score - left.score).slice(0, 4);
  }
  function buildFallbackAnswer(question, matches) {
    const currentTitle = currentPageTitle();
    const currentExcerptText = currentPageExcerpt();
    if (!matches.length) {
      return {
        answer: `I could not find a strong match for "${question}" in the indexed docs yet. Try asking with a guide name, component name, or engine name.`,
        links: []
      };
    }
    const lead = matches[0];
    const parts = [];
    if ((lead.location || "").replace(/^\/+/, "") === currentPagePath() && currentExcerptText) {
      parts.push(`On this page, ${currentTitle} covers: ${currentExcerptText.slice(0, 320)}...`);
    } else {
      parts.push(`The closest match is "${lead.title}" and it appears to cover: ${(lead.text || "").slice(0, 320)}...`);
    }
    if (matches.length > 1) {
      parts.push("You may also want these related pages.");
    }
    return {
      answer: parts.join("\n\n"),
      links: matches.map((match) => ({
        title: match.title,
        href: new URL(match.location, getSiteRoot()).href
      }))
    };
  }
  async function ensureLocalAI(statusNode) {
    if (state.aiEnabled) return;
    if (state.aiLoading) return;
    state.aiLoading = true;
    statusNode.textContent = "Loading local AI model in your browser. First load can take a minute.";
    try {
      const webllm = await import("https://esm.sh/@mlc-ai/web-llm?bundle");
      state.engine = await webllm.CreateMLCEngine(MODEL_ID, {
        initProgressCallback(progress) {
          const percent = Math.round((progress.progress || 0) * 100);
          const label = progress.text || "Preparing model";
          statusNode.textContent = `${label} ${Number.isFinite(percent) ? `(${percent}%)` : ""}`.trim();
        }
      });
      window.__browserAgentWebLLM = createWebLLMBridge(state.engine);
      state.aiEnabled = true;
      statusNode.textContent = "Local AI is ready on this device.";
    } catch (error) {
      console.error(error);
      statusNode.textContent = "Local AI could not be loaded in this browser. Search mode is still available.";
    } finally {
      state.aiLoading = false;
    }
  }
  function buildAgentGoal(question, matches) {
    const pageContext = [
      `Current page title: ${currentPageTitle()}`,
      `Current page path: ${currentPagePath() || "/"}`,
      `Current page excerpt: ${currentPageExcerpt() || "No page excerpt available."}`
    ].join("\n");
    const relatedContext = matches.length ? matches.map((match, index) => `Match ${index + 1}: ${match.title}
Path: ${match.location}
Snippet: ${(match.text || "").slice(0, 700)}`).join("\n\n") : "No related matches were found in the search index.";
    return [
      `User question: ${question}`,
      "",
      "Use the following documentation context to answer.",
      pageContext,
      "",
      relatedContext,
      "",
      "Respond with a done action whose reason is a concise answer followed by relevant page titles if helpful."
    ].join("\n");
  }
  async function answerWithAgent(question, matches) {
    return new Promise((resolve, reject) => {
      const agent = createBrowserAgent({
        goal: buildAgentGoal(question, matches),
        mode: "autonomous",
        maxSteps: 1,
        stepDelayMs: 0,
        planner: {
          kind: "webllm",
          modelId: MODEL_ID,
          systemPrompt: DOC_ASSISTANT_PROMPT
        }
      }, {
        onDone(result) {
          resolve(result.message);
        },
        onError(error) {
          reject(error);
        },
        onMaxStepsReached() {
          reject(new Error("Agent reached max steps without answering."));
        }
      });
      agent.start().catch(reject);
    });
  }
  function createMessage(text, role, links = []) {
    const message = document.createElement("div");
    message.className = `omni-chat__message omni-chat__message--${role}`;
    const bubble = document.createElement("div");
    bubble.className = "omni-chat__bubble";
    bubble.innerHTML = escapeHtml(text).replace(/\n/g, "<br>");
    message.appendChild(bubble);
    if (links.length) {
      const linkList = document.createElement("div");
      linkList.className = "omni-chat__links";
      for (const link of links) {
        const anchor = document.createElement("a");
        anchor.className = "omni-chat__link";
        anchor.href = link.href;
        anchor.textContent = link.title;
        linkList.appendChild(anchor);
      }
      message.appendChild(linkList);
    }
    return message;
  }
  function appendMessage(container, text, role, links = []) {
    const node = createMessage(text, role, links);
    container.appendChild(node);
    container.scrollTop = container.scrollHeight;
  }
  function createSuggestionRow(input) {
    const row = document.createElement("div");
    row.className = "omni-chat__suggestions";
    for (const suggestion of SUGGESTIONS) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "omni-chat__chip";
      button.textContent = suggestion;
      button.addEventListener("click", () => {
        input.value = suggestion;
        input.focus();
      });
      row.appendChild(button);
    }
    return row;
  }
  function buildShell() {
    const launcher = document.createElement("button");
    launcher.type = "button";
    launcher.className = "omni-chat__launcher";
    launcher.setAttribute("aria-label", "Open docs assistant");
    launcher.innerHTML = "Ask Omni";
    const panel = document.createElement("section");
    panel.className = "omni-chat";
    panel.hidden = true;
    panel.innerHTML = `
    <div class="omni-chat__header">
      <div>
        <strong>Omni Docs Assistant</strong>
        <div class="omni-chat__subhead">Free search mode with optional local AI in your browser.</div>
      </div>
      <button type="button" class="omni-chat__close" aria-label="Close chat">Close</button>
    </div>
    <div class="omni-chat__status"></div>
    <div class="omni-chat__messages"></div>
    <form class="omni-chat__form">
      <textarea class="omni-chat__input" rows="3" placeholder="Ask about Vulcan docs..."></textarea>
      <div class="omni-chat__actions">
        <button type="button" class="omni-chat__toggle-ai">Enable Local AI</button>
        <button type="submit" class="omni-chat__submit">Send</button>
      </div>
    </form>
  `;
    document.body.appendChild(launcher);
    document.body.appendChild(panel);
    return {
      launcher,
      panel,
      close: panel.querySelector(".omni-chat__close"),
      status: panel.querySelector(".omni-chat__status"),
      messages: panel.querySelector(".omni-chat__messages"),
      form: panel.querySelector(".omni-chat__form"),
      input: panel.querySelector(".omni-chat__input"),
      aiToggle: panel.querySelector(".omni-chat__toggle-ai")
    };
  }
  async function handleQuestion(question, ui) {
    if (!question.trim() || state.loading) return;
    state.loading = true;
    ui.status.textContent = "Searching the docs...";
    appendMessage(ui.messages, question.trim(), "user");
    ui.input.value = "";
    try {
      const docs = await loadSearchIndex();
      const matches = findMatches(question, docs);
      if (state.aiEnabled) {
        ui.status.textContent = "Thinking with local AI...";
        const answer = await answerWithAgent(question, matches);
        appendMessage(ui.messages, answer, "assistant", matches.slice(0, 3).map((match) => ({
          title: match.title,
          href: new URL(match.location, getSiteRoot()).href
        })));
        ui.status.textContent = "Local AI answered using indexed docs context.";
      } else {
        const fallback = buildFallbackAnswer(question, matches);
        appendMessage(ui.messages, fallback.answer, "assistant", fallback.links);
        ui.status.textContent = "Search mode is active. Enable Local AI for richer answers on supported browsers.";
      }
    } catch (error) {
      console.error(error);
      appendMessage(ui.messages, "Something went wrong while loading docs context. Please try again after the page finishes loading.", "assistant");
      ui.status.textContent = "The assistant hit an error.";
    } finally {
      state.loading = false;
    }
  }
  function bootstrap() {
    if (document.body.dataset.omniChatMounted === "true") return;
    document.body.dataset.omniChatMounted = "true";
    const ui = buildShell();
    ui.messages.appendChild(createSuggestionRow(ui.input));
    appendMessage(
      ui.messages,
      "Ask about the current page, a guide, or a concept. By default I use the built-in docs search. You can also enable Local AI to run the omnibrowser agent fully in your browser.",
      "assistant"
    );
    ui.launcher.addEventListener("click", () => {
      state.panelOpen = !state.panelOpen;
      ui.panel.hidden = !state.panelOpen;
      ui.launcher.classList.toggle("omni-chat__launcher--active", state.panelOpen);
      if (state.panelOpen) {
        ui.input.focus();
      }
    });
    ui.close.addEventListener("click", () => {
      state.panelOpen = false;
      ui.panel.hidden = true;
      ui.launcher.classList.remove("omni-chat__launcher--active");
    });
    ui.aiToggle.addEventListener("click", async () => {
      await ensureLocalAI(ui.status);
      if (state.aiEnabled) {
        ui.aiToggle.textContent = "Local AI Ready";
        ui.aiToggle.disabled = true;
      }
    });
    ui.form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await handleQuestion(ui.input.value, ui);
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
  } else {
    bootstrap();
  }
})();
