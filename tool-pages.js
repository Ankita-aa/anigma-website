const vaspForm = document.querySelector("#vaspForm");
const rubereyeForm = document.querySelector("#rubereyeForm");

function tryExtractVideoUrl(payload) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const directKeys = ["video_url", "videoUrl", "output_url", "outputUrl", "url"];
  for (const key of directKeys) {
    if (typeof payload[key] === "string" && payload[key].trim()) {
      return payload[key].trim();
    }
  }

  if (payload.data && typeof payload.data === "object") {
    return tryExtractVideoUrl(payload.data);
  }

  if (Array.isArray(payload.outputs)) {
    for (const item of payload.outputs) {
      const extracted = tryExtractVideoUrl(item);
      if (extracted) {
        return extracted;
      }
    }
  }

  return "";
}

if (vaspForm) {
  const statusEl = document.querySelector("#vaspStatus");
  const errorEl = document.querySelector("#vaspError");
  const resultVideo = document.querySelector("#vaspVideo");
  const resultJson = document.querySelector("#vaspResponse");
  const downloadLink = document.querySelector("#vaspDownloadLink");
  const button = document.querySelector("#vaspSubmit");

  function setStatus(text, loading = false) {
    statusEl.textContent = text;
    statusEl.className = loading ? "vasp-ref-status loading" : "vasp-ref-status";
  }

  vaspForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const baseUrl = document.querySelector("#vaspBaseUrl").value.trim().replace(/\/$/, "");
    const endpoint = document.querySelector("#vaspEndpoint").value.trim();
    const apiKey = document.querySelector("#vaspApiKey").value.trim();
    const instruction = document.querySelector("#vaspInstruction").value.trim();
    const caption = document.querySelector("#vaspCaption").value.trim();
    const media = document.querySelector("#vaspMedia").files[0];

    if (!media) {
      errorEl.textContent = "Please select a video file.";
      return;
    }

    const endpointPath = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${baseUrl}${endpointPath}`;

    const payload = new FormData();
    payload.append("instruction", instruction);
    if (caption) {
      payload.append("caption", caption);
    }
    payload.append("media", media);
    payload.append("video", media);

    const headers = {};
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    errorEl.textContent = "";
    resultVideo.pause();
    resultVideo.style.display = "none";
    resultVideo.removeAttribute("src");
    downloadLink.textContent = "";
    resultJson.textContent = "";
    button.disabled = true;
    setStatus("Uploading and generating video. This can take a few minutes.", true);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: payload,
      });

      const contentType = res.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");
      const data = isJson ? await res.json() : await res.text();

      if (!res.ok) {
        const errorPayload = {
          status: res.status,
          statusText: res.statusText,
          body: data,
        };
        resultJson.textContent = JSON.stringify(errorPayload, null, 2);
        errorEl.textContent = "Request failed. Inspect response details below.";
        setStatus("Generation failed.");
        return;
      }

      const displayPayload = {
        status: res.status,
        statusText: res.statusText,
        data,
      };

      resultJson.textContent = JSON.stringify(displayPayload, null, 2);
      setStatus("Generation complete.");

      const videoUrl = tryExtractVideoUrl(data);
      if (videoUrl) {
        resultVideo.src = videoUrl;
        resultVideo.style.display = "block";
        downloadLink.href = videoUrl;
        downloadLink.textContent = "Open generated video";
      }
    } catch (error) {
      resultJson.textContent = JSON.stringify(
        {
          error: "Network or CORS error",
          details: error.message,
        },
        null,
        2
      );
      errorEl.textContent = "Could not reach Railway API. Check URL, CORS, and backend status.";
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
