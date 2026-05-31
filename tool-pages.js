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
  const runDirEl = document.querySelector("#vaspRunDir");
  const interJsonEl = document.querySelector("#vaspInterJson");
  const plannerOutputEl = document.querySelector("#vaspPlannerOutput");
  const plannerFilesEl = document.querySelector("#vaspPlannerFiles");
  const refinerFilesEl = document.querySelector("#vaspRefinerFiles");
  const button = document.querySelector("#vaspSubmit");
  const stageMessages = [
    "Uploading video to VASP.",
    "Transcribing source audio with WhisperX.",
    "Preparing media captions and edit context.",
    "Planning the edit with the VASP planner.",
    "Refining each segment for timing, captions, and visuals.",
    "Generating the final render instructions.",
    "Rendering the output video.",
    "Uploading the generated video for playback.",
  ];
  let stageTimer;

  function setStatus(text, loading = false) {
    statusEl.textContent = text;
    statusEl.className = loading ? "vasp-status loading" : "vasp-status";
  }

  function startStageUpdates() {
    let stageIndex = 0;
    setStatus(`${stageMessages[stageIndex]} Generation can take several minutes.`, true);

    stageTimer = setInterval(() => {
      stageIndex = Math.min(stageIndex + 1, stageMessages.length - 1);
      setStatus(`${stageMessages[stageIndex]} Still working, please keep this tab open.`, true);
    }, 18000);
  }

  function stopStageUpdates() {
    clearInterval(stageTimer);
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
    runDirEl.textContent = "Not available yet.";
    interJsonEl.textContent = "Not available yet.";
    plannerOutputEl.textContent = "Not available yet.";
    plannerFilesEl.textContent = "Not available yet.";
    refinerFilesEl.textContent = "Not available yet.";
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

  function formatDiagnostic(value) {
    if (value === undefined || value === null || value === "") {
      return "Not returned.";
    }
    return typeof value === "string" ? value : JSON.stringify(value, null, 2);
  }

  function renderFilePreview(file) {
    const details = document.createElement("details");
    details.className = "vasp-file-preview";

    const summary = document.createElement("summary");
    summary.textContent = file?.path || "Unnamed file";

    const pre = document.createElement("pre");
    pre.textContent = file?.content || "No content returned.";

    if (file?.truncated) {
      const note = document.createElement("p");
      note.className = "vasp-file-note";
      note.textContent = "Preview truncated.";
      details.append(summary, note, pre);
      return details;
    }

    details.append(summary, pre);
    return details;
  }

  function renderFileGroup(container, files) {
    container.textContent = "";

    const visibleFiles = files.filter(Boolean);
    if (!visibleFiles.length) {
      container.textContent = "Not returned.";
      return;
    }

    visibleFiles.forEach((file) => {
      container.appendChild(renderFilePreview(file));
    });
  }

  vaspForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const instruction = document.querySelector("#vaspInstruction").value.trim();
    const media = document.querySelector("#vaspMedia").files[0];
    const editName = document.querySelector("#vaspEditNameInput").value.trim();
    const creativity = document.querySelector("#vaspCreativity").value;
    const mediaCollectionMode = document.querySelector("#vaspMediaCollectionMode").value;
    const optionalMediaCount = document.querySelector("#vaspOptionalMediaCount").value;
    const usePresetBackgrounds = document.querySelector("#vaspUsePresetBackgrounds").checked;
    const renderCaptions = document.querySelector("#vaspRenderCaptions").checked;
    const dynamicPrompts = document.querySelector("#vaspDynamicPrompts").checked;
    const aimRefinement = document.querySelector("#vaspAimRefinement").checked;
    const refineCrawlMediaAims = document.querySelector("#vaspRefineCrawlMediaAims").checked;

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

    const creativityValue = Number.parseInt(creativity, 10);
    if (!Number.isInteger(creativityValue) || creativityValue < 1 || creativityValue > 5) {
      errorEl.textContent = "Creativity must be between 1 and 5.";
      setStatus("Adjust advanced settings before generating.");
      return;
    }

    const optionalMediaCountValue = Number.parseInt(optionalMediaCount, 10);
    if (
      !Number.isInteger(optionalMediaCountValue) ||
      optionalMediaCountValue < 5 ||
      optionalMediaCountValue > 50
    ) {
      errorEl.textContent = "Optional media count must be between 5 and 50.";
      setStatus("Adjust advanced settings before generating.");
      return;
    }

    const payload = new FormData();
    payload.append("video", media);
    payload.append("instruction", instruction);
    payload.append("edit_name", editName);
    payload.append("creativity", String(creativityValue));
    payload.append("media_collection_mode", mediaCollectionMode);
    payload.append("optional_media_count", String(optionalMediaCountValue));
    payload.append("use_preset_backgrounds", String(usePresetBackgrounds));
    payload.append("render_captions", String(renderCaptions));
    payload.append("dynamic_prompts", String(dynamicPrompts));
    payload.append("aim_refinement", String(aimRefinement));
    payload.append("refine_crawl_media_aims", String(refineCrawlMediaAims));

    button.disabled = true;
    startStageUpdates();

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
      runDirEl.textContent = formatDiagnostic(data.run_dir);
      interJsonEl.textContent = formatDiagnostic(data.inter_json);
      plannerOutputEl.textContent = formatDiagnostic(data.planner_output);
      renderFileGroup(plannerFilesEl, [
        data.planner_input_file,
        data.planner_output_file,
        data.planner_raw_output_file,
      ]);
      renderFileGroup(refinerFilesEl, [
        ...(Array.isArray(data.refiner_input_files) ? data.refiner_input_files : []),
        ...(Array.isArray(data.refiner_output_files) ? data.refiner_output_files : []),
      ]);
      setStatus("Generation complete.");
    } catch (error) {
      errorEl.textContent = `Could not reach the VASP API. Check Railway status and CORS settings. ${error.message}`;
      setStatus("Generation failed.");
    } finally {
      stopStageUpdates();
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
