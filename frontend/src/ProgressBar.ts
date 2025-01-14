/**
 * @fileoverview Progress bar component for visualizing completion status
 * @module frontend/ProgressBar
 */

import { Util } from "./util";

/**
 * A class representing a visual progress bar
 * @class ProgressBar
 */
export class ProgressBar {
  /** HTML div element representing the progress bar */
  private bar_element: HTMLDivElement;

  /** Current progress value (0-100) */
  private progress: number = 0;

  /**
   * Creates a new progress bar instance
   * @constructor
   * @param {HTMLDivElement} bar_element - The HTML div element to use as the progress bar
   */
  constructor(bar_element: HTMLDivElement) {
    this.bar_element = bar_element;
  }

  /**
   * Sets the progress value and updates the visual representation
   * @param {number} progress - Progress value between 0 and 100
   * @throws {console.error} If progress value is outside valid range (will clamp value)
   */
  setProgress(progress: number) {
    if (progress < 0 || progress > 100) {
      console.error("Progress must be between 0 and 100. Clamping value.");
      progress = Util.clamp(progress, 0, 100);
    }
    this.progress = progress;
    this.bar_element.style.width = `${progress}%`;
  }
}
