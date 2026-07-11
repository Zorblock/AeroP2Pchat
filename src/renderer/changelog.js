import { createPlatformApi } from "./platform.js";
import "./changelog.css";

const feedUrl = "https://zorblock.featurebase.app/api/v1/changelog/feed.rss";
const platformApi = createPlatformApi();
const content = document.querySelector("#content");
const refresh = document.querySelector("#refresh");

function setTheme() {
  const theme = new URLSearchParams(globalThis.location.search).get("theme");
  document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
}

function showState(message, error = false) {
  content.replaceChildren();
  const element = document.createElement("p");
  element.className = `state${error ? " error" : ""}`;
  element.textContent = message;
  content.append(element);
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat(undefined, { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function render(items) {
  content.replaceChildren();
  if (!items.length) return showState("No changelog entries are available yet.");
  for (const item of items) {
    const entry = document.createElement("article");
    entry.className = "entry";
    const meta = document.createElement("div");
    meta.className = "meta";
    const category = document.createElement("span");
    category.textContent = item.category || "Update";
    const date = document.createElement("time");
    date.textContent = formatDate(item.pubDate);
    meta.append(category, date);
    const title = document.createElement("h2");
    title.textContent = item.title || "Untitled update";
    const description = document.createElement("p");
    description.textContent = item.description || "";
    entry.append(meta, title, description);
    if (item.link) {
      const link = document.createElement("a");
      link.href = item.link;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Read more";
      entry.append(link);
    }
    content.append(entry);
  }
}

async function load() {
  showState("Loading updates…");
  refresh.disabled = true;
  try {
    const xml = await platformApi.fetchChangelogFeed(feedUrl);
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    if (doc.querySelector("parsererror")) throw new Error("The changelog response was invalid.");
    render([...doc.querySelectorAll("channel > item")].map((item) => ({
      title: item.querySelector("title")?.textContent?.trim(),
      description: item.querySelector("description")?.textContent?.trim(),
      link: item.querySelector("link")?.textContent?.trim(),
      pubDate: item.querySelector("pubDate")?.textContent?.trim(),
      category: item.querySelector("category")?.textContent?.trim(),
    })));
  } catch (error) {
    showState(error.message || "Could not load the changelog.", true);
  } finally {
    refresh.disabled = false;
  }
}

document.querySelector("#back").addEventListener("click", () => globalThis.location.assign("index.html"));
refresh.addEventListener("click", load);
setTheme();
load();
