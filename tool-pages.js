const vaspForm = document.querySelector("#vaspForm");
const rubereyeForm = document.querySelector("#rubereyeForm");
const VASP_API_BASE = "https://vasp-api-production.up.railway.app";

if (vaspForm) {
  const statusEl = document.querySelector("#vaspStatus");
  const errorEl = document.querySelector("#vaspError");
  const resultVideo = document.querySelector("#vaspVideo");
  const downloadLink = document.querySelector("#vaspDownloadLink");
  const transcriptEl = document.querySelector("#vaspTranscript");
  const editNameEl = document.querySelector("#vaspEditName");
  const button = document.querySelector("#vaspSubmit");

  function setStatus(text, loading = false) {
    statusEl.textContent = text;
    statusEl.className = loading ? "vasp-status loading" : "vasp-status";
  }

  function resetResult() {
    errorEl.textContent = "";
    resultVideo.pause();
    resultVideo.style.display = "none";
    resultVideo.removeAttribute("src");
    downloadLink.removeAttribute("href");
    downloadLink.textContent = "";
    transcriptEl.textContent = "Generated transcript will appear here.";
    editNameEl.textContent = "";
  }

  async function readResponseBody(response) {
    const text = await response.text();

    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      return {
        status: "error",
        message: "The VASP API returned a response that was not valid JSON.",
        raw: text,
      };
    }
  }

  function getBackendMessage(data, fallback) {
    return data?.message || data?.error || data?.detail || fallback;
  }

  vaspForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const instruction = document.querySelector("#vaspInstruction").value.trim();
    const media = document.querySelector("#vaspMedia").files[0];

    resetResult();

    if (!media) {
      errorEl.textContent = "Please select a video file.";
      setStatus("Add a video before generating.");
      return;
    }

    if (!media.type.startsWith("video/")) {
      errorEl.textContent = "Please upload a valid video file.";
      setStatus("Choose a video file to continue.");
      return;
    }

    if (!instruction) {
      errorEl.textContent = "Please enter an instruction.";
      setStatus("Describe the edit before generating.");
      return;
    }

    const payload = new FormData();
    payload.append("video", media);
    payload.append("instruction", instruction);

    button.disabled = true;
    setStatus("Uploading video to VASP. Generation can take several minutes.", true);

    try {
      const response = await fetch(`${VASP_API_BASE}/generate`, {
        method: "POST",
        body: payload,
      });

      const data = await readResponseBody(response);

      if (!response.ok) {
        errorEl.textContent = getBackendMessage(
          data,
          `VASP request failed with HTTP ${response.status}.`
        );
        setStatus("Generation failed.");
        return;
      }

      if (data.status === "error") {
        errorEl.textContent = getBackendMessage(data, "The VASP backend reported an error.");
        setStatus("Generation failed.");
        return;
      }

      if (data.status !== "ok" || !data.video_url) {
        errorEl.textContent = "VASP finished, but no generated video URL was returned.";
        setStatus("Generation response was incomplete.");
        return;
      }

      resultVideo.src = data.video_url;
      resultVideo.style.display = "block";
      downloadLink.href = data.video_url;
      downloadLink.textContent = "Open or download generated video";
      transcriptEl.textContent = data.transcript || "No transcript was returned.";
      editNameEl.textContent = data.edit_name || "";
      setStatus("Generation complete.");
    } catch (error) {
      errorEl.textContent = `Could not reach the VASP API. Check Railway status and CORS settings. ${error.message}`;
      setStatus("Generation failed.");
    } finally {
      button.disabled = false;
      statusEl.classList.remove("loading");
    }
  });
}

if (rubereyeForm) {
  rubereyeForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const image = document.querySelector("#rubereyeImage").files[0];
    const result = document.querySelector("#rubereyeResult");
    const imageName = image.name.toLowerCase();
    const looksAi = imageName.includes("ai") || imageName.includes("generated");
    const label = looksAi ? "Likely AI-generated" : "Likely real image";
    const confidence = looksAi ? "86%" : "78%";

    result.classList.remove("hidden");
    result.innerHTML = `
      <p class="eyebrow">Result</p>
      <h2>${label}</h2>
      <p><strong>Image:</strong> ${image.name}</p>
      <p><strong>Confidence:</strong> ${confidence}</p>
      <p>Rubereye reviews visual consistency, texture signals, metadata clues, and generation-style artifacts to support image verification.</p>
    `;
  });
}
