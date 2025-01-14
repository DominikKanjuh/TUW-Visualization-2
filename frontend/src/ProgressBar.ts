import { Util } from "./util";

export class ProgressBar {
  private bar_element: HTMLDivElement;
  private progress: number = 0;

  constructor(bar_element: HTMLDivElement) {
    this.bar_element = bar_element;
  }

  /**
   * Set the progress of the progress bar from 0 to 100
   * @param progress
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
