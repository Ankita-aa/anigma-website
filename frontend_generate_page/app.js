const form = document.getElementById("generate-form");
const statusEl = document.getElementById("status");
const errorEl = document.getElementById("error");
const resultVideo = document.getElementById("result-video");
const resultJson = document.getElementById("result-json");
const downloadLink = document.getElementById("download-link");
const button = document.getElementById("generate-btn");

const API_BASE = localStorage.getItem("vasp_api_base") || "http://127.0.0.1:8080";

function setStatus(text, loading = false) {
  statusEl.textContent = text;
  statusEl.className = loading ? "status loading" : "status";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorEl.textContent = "";
  resultVideo.style.display = "none";
  resultVideo.removeAttribute("src");
  downloadLink.textContent = "";
  resultJson.textContent = "";

  const videoInput = document.getElementById("video");
  const instructionInput = document.getElementById("instruction");
  const file = videoInput.files?.[0];
  const instruction = instructionInput.value.trim();

  if (!file) {
    errorEl.textContent = "Please select a video file.";
    return;
  }
  if (!instruction) {
    errorEl.textContent = "Please enter an instruction.";
    return;
  }

  const formData = new FormData();
  formData.append("video", file);
  formData.append("instruction", instruction);

  try {
    button.disabled = true;
    setStatus("Uploading and generating video. This can take a few minutes.", true);

    const resp = await fetch(`${API_BASE}/generate`, {
      method: "POST",
      body: formData,
    });
    const data = await resp.json();
    resultJson.textContent = JSON.stringify(data, null, 2);

    if (!resp.ok || data.status === "error") {
      throw new Error(data.message || `Request failed with status ${resp.status}`);
    }

    if (data.video_url) {
      resultVideo.src = data.video_url;
      resultVideo.style.display = "block";
      downloadLink.href = data.video_url;
      downloadLink.textContent = "Open generated video";
    }
    setStatus("Generation complete.");
  } catch (err) {
    errorEl.textContent = err?.message || "Unknown error";
    setStatus("Generation failed.");
  } finally {
    button.disabled = false;
    statusEl.classList.remove("loading");
  }
});
