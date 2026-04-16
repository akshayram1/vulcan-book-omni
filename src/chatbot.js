import { createBrowserAgent, createWebLLMBridge } from "@akshayram1/omnibrowser-agent";

const MODEL_ID = "Llama-3.2-1B-Instruct-q4f16_1-MLC";
const ROOT_LINK_SELECTOR = "link[href*='assets/stylesheets/extra.css']";
const SUGGESTIONS = [
  "Summarize this page",
  "What is the data product lifecycle?",
  "Show related guides",
];
const DOC_ASSISTANT_PROMPT = [
  "You are Omni, a documentation assistant embedded in a MkDocs site.",
  "You must answer using only the context provided in the goal.",
  "Never click, type, navigate, focus, scroll, wait, or extract.",
  "Always return a single done action.",
  "Put the final answer in the done.reason field.",
  "If the answer is not in context, say that briefly and suggest the most relevant pages from the provided matches.",
].join(" ");

const state = {
  panelOpen: false,
  loading: false,
  aiEnabled: false,
  aiLoading: false,
  searchIndex: null,
  searchIndexPromise: null,
  engine: null,
};

function getSiteRoot() {
  const rootHint = document.querySelector(ROOT_LINK_SELECTOR);
  if (rootHint) {
    return new URL(rootHint.getAttribute("href"), window.location.href)
      .href.replace(/assets\/stylesheets\/extra\.css.*$/, "");
  }
  return new URL(".", window.location.href).href;
}

function normalize(text) {
  return (text || "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ");
}

function tokenize(text) {
  return normalize(text)
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function unique(tokens) {
  return [...new Set(tokens)];
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
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
  state.searchIndexPromise = fetch(searchUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Unable to load search index (${response.status})`);
      }
      return response.json();
    })
    .then((payload) => {
      state.searchIndex = payload.docs || [];
      return state.searchIndex;
    });

  return state.searchIndexPromise;
}

function findMatches(question, docs) {
  const queryTokens = unique(tokenize(question));
  return docs
    .map((doc) => ({ ...doc, score: scoreDoc(doc, queryTokens) }))
    .filter((doc) => doc.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 4);
}

function buildFallbackAnswer(question, matches) {
  const currentTitle = currentPageTitle();
  const currentExcerptText = currentPageExcerpt();

  if (!matches.length) {
    return {
      answer: `I could not find a strong match for "${question}" in the indexed docs yet. Try asking with a guide name, component name, or engine name.`,
      links: [],
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
      href: new URL(match.location, getSiteRoot()).href,
    })),
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
      },
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
    `Current page excerpt: ${currentPageExcerpt() || "No page excerpt available."}`,
  ].join("\n");

  const relatedContext = matches.length
    ? matches.map((match, index) => `Match ${index + 1}: ${match.title}\nPath: ${match.location}\nSnippet: ${(match.text || "").slice(0, 700)}`).join("\n\n")
    : "No related matches were found in the search index.";

  return [
    `User question: ${question}`,
    "",
    "Use the following documentation context to answer.",
    pageContext,
    "",
    relatedContext,
    "",
    "Respond with a done action whose reason is a concise answer followed by relevant page titles if helpful.",
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
        systemPrompt: DOC_ASSISTANT_PROMPT,
      },
    }, {
      onDone(result) {
        resolve(result.message);
      },
      onError(error) {
        reject(error);
      },
      onMaxStepsReached() {
        reject(new Error("Agent reached max steps without answering."));
      },
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
    aiToggle: panel.querySelector(".omni-chat__toggle-ai"),
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
        href: new URL(match.location, getSiteRoot()).href,
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
