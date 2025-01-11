export default function initializeDatasetDropdown(): void {
  const datasetDropdown = document.getElementById("dataset_dropdown");

  if (!datasetDropdown) {
    console.error("Dataset dropdown element not found.");
    return;
  }

  datasetDropdown.addEventListener("change", (event) => {
    const target = event.target as HTMLSelectElement;
    console.log(`Selected dataset: ${target.value}`);
  });
}
