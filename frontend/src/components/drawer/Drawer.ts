import initializeDatasetDropdown from "./dataset-dropdown/DatasetDropdown";
import "./drawer.styles.css";

export default function initializeDrawer(): void {
  const drawer = document.getElementById("drawer");
  const drawerToggleButton = document.getElementById("drawer-toggle");

  if (!drawer || !drawerToggleButton) {
    console.error("Drawer elements are missing in the DOM.");
    return;
  }

  drawerToggleButton.textContent = "Open settings";

  drawerToggleButton.addEventListener("click", () => {
    const isOpen = drawer.classList.toggle("open");

    drawerToggleButton.textContent = isOpen ? "X" : "Open settings";
  });

  // Initialize components inside the drawer
  initializeDatasetDropdown();
}
