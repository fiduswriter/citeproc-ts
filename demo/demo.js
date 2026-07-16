// demo.js — citeproc-ts CSL citation formatter
// Original citeproc-js by Michael McMillan & Frank Bennett

(async function () {
    const STYLE_ID = "chicago-notes-bibliography";

    // ---- Load all data files ----
    const [citations, itemsById, styleText] = await Promise.all([
        loadCitations(),
        loadItems(),
        fetchText(STYLE_ID + ".csl"),
    ]);

    // ---- Pre-load locale (engine needs synchronous access) ----
    const localeCache = {};
    localeCache["en-US"] = await fetchText("locales-en-US.xml");

    // ---- Engine setup ----
    const citeprocSys = {
        retrieveLocale(lang) {
            return localeCache[lang] || false;
        },
        retrieveItem(id) {
            return itemsById[id];
        },
    };

    const startTime = performance.now();
    const engine = new CSL.Engine(citeprocSys, styleText);
    const endTime = performance.now();
    console.log("Initialized CSL.Engine in " + (endTime - startTime).toFixed(1) + " ms");

    // ---- Enable button, clear loading indicators ----
    const btn = document.getElementById("start-btn");
    btn.disabled = false;
    btn.textContent = "Render Citations";
    document.getElementById("cite-div").innerHTML = "";
    document.getElementById("bib-div").innerHTML = "";
    btn.addEventListener("click", async function () {
        btn.disabled = true;
        btn.textContent = "Rendering…";
        const t0 = performance.now();
        await runCitations(0, engine, citations);
        const t1 = performance.now();
        document.getElementById("time-badge").textContent = (t1 - t0).toFixed(0) + " ms";
        document.getElementById("time-badge").hidden = false;
        document.getElementById("bib-div").innerHTML = engine.makeBibliography()[1].join("\n");
        btn.textContent = "Done ✓";
    });

    // ---- Helpers ----
    async function fetchText(url) {
        const r = await fetch(url);
        if (!r.ok) throw new Error("Failed to load " + url + ": " + r.status);
        return r.text();
    }

    async function fetchJSON(url) {
        const r = await fetch(url);
        if (!r.ok) throw new Error("Failed to load " + url + ": " + r.status);
        return r.json();
    }

    async function loadCitations() {
        const all = [];
        for (let i = 1; i < 8; i++) {
            const batch = await fetchJSON("citations-" + i + ".json");
            all.push(...batch);
        }
        return all;
    }

    async function loadItems() {
        const byId = {};
        for (let i = 1; i < 8; i++) {
            const batch = await fetchJSON("items-" + i + ".json");
            for (const item of batch) {
                byId[item.id] = item;
            }
        }
        return byId;
    }

    function runCitations(idx, engine, citations) {
        return new Promise((resolve) => {
            function step(i) {
                if (i >= citations.length) return resolve();
                const citeDiv = document.getElementById("cite-div");
                const [citation, pre, post] = citations[i];
                const [, citeStrings] = engine.processCitationCluster(citation, pre, post);
                for (const [, html, id] of citeStrings) {
                    const newNode = document.createElement("div");
                    newNode.id = "node-" + id;
                    newNode.innerHTML = html;
                    const old = document.getElementById("node-" + id);
                    old ? citeDiv.replaceChild(newNode, old) : citeDiv.appendChild(newNode);
                    newNode.scrollIntoView({ behavior: "smooth" });
                }
                setTimeout(() => step(i + 1), 0);
            }
            step(idx);
        });
    }
})().catch(err => {
    const msg = err && err.message ? err.message : String(err);
    const el = document.getElementById("cite-div");
    if (el) el.innerHTML = '<p style="color:red;font-family:monospace">Error: ' + msg + "</p>";
    const btn = document.getElementById("start-btn");
    if (btn) { btn.disabled = false; btn.textContent = "Retry"; }
    console.error(err);
});
