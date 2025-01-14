/**
 * @fileoverview Drawer component for settings panel with toggle functionality
 * @module frontend/components/drawer
 */

import "./drawer.styles.css";

/**
 * Initializes the drawer component with toggle functionality
 * Sets up event listeners and initial state for the settings panel
 * @throws {console.error} If required DOM elements are not found
 */
export default function initializeDrawer(): void {
  const drawer = document.getElementById("drawer");
  const drawerToggleButton = document.getElementById("drawer-toggle");

  if (!drawer || !drawerToggleButton) {
    console.error("Drawer elements are missing in the DOM.");
    return;
  }

  // Set initial button text
  drawerToggleButton.textContent = "Open settings";

  /**
   * Toggle drawer visibility and update button text
   * @param {MouseEvent} _event - Click event object (unused)
   */
  drawerToggleButton.addEventListener("click", () => {
    const isOpen = drawer.classList.toggle("open");
    drawerToggleButton.textContent = isOpen ? "X" : "Open settings";
  });
}
