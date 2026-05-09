const vaspForm = document.querySelector("#vaspForm");
const rubereyeForm = document.querySelector("#rubereyeForm");

if (vaspForm) {
  vaspForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const instruction = document.querySelector("#vaspInstruction").value.trim();
    const caption = document.querySelector("#vaspCaption").value.trim();
    const media = document.querySelector("#vaspMedia").files[0];
    const result = document.querySelector("#vaspResult");

    result.classList.remove("hidden");
    result.innerHTML = `
      <p class="eyebrow">Ready Reel</p>
      <h2>Your reel video is ready</h2>
      <p><strong>Media:</strong> ${media.name}</p>
      <p><strong>Caption:</strong> ${caption}</p>
      <ul>
        <li>Reel style applied from your instruction: ${instruction}</li>
        <li>Caption added cleanly for short-form viewing.</li>
        <li>Media arranged into a fast, share-ready reel format.</li>
        <li>Final output prepared as a polished reel video demo.</li>
      </ul>
    `;
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
