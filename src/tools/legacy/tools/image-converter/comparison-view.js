const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/** One coordinate system for the original, output and divider. */
export class ComparisonView {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.viewportWidth = 0;
    this.viewportHeight = 0;
    this.scale = 1;
    this.x = 0;
    this.y = 0;
    this.split = 50;
    this.fitted = true;
  }
  resize(width, height) {
    if (width <= 0 || height <= 0) return;
    const dx = (width - this.viewportWidth) / 2,
      dy = (height - this.viewportHeight) / 2;
    this.viewportWidth = width;
    this.viewportHeight = height;
    if (this.fitted) this.fit();
    else {
      this.x += dx;
      this.y += dy;
      this.constrain();
    }
  }
  fit() {
    if (!this.viewportWidth || !this.viewportHeight) return;
    this.fitted = true;
    this.scale = Math.min(
      1,
      Math.max(1, this.viewportWidth - 48) / this.width,
      Math.max(1, this.viewportHeight - 48) / this.height
    );
    this.x = (this.viewportWidth - this.width * this.scale) / 2;
    this.y = (this.viewportHeight - this.height * this.scale) / 2;
  }
  zoomTo(scale) {
    const next = clamp(scale, 0.001, 4),
      cx = this.viewportWidth / 2,
      cy = this.viewportHeight / 2;
    this.x = cx - ((cx - this.x) * next) / this.scale;
    this.y = cy - ((cy - this.y) * next) / this.scale;
    this.scale = next;
    this.fitted = false;
    this.constrain();
  }
  pan(dx, dy) {
    this.x += dx;
    this.y += dy;
    this.constrain();
  }
  constrain() {
    const w = this.width * this.scale,
      h = this.height * this.scale;
    this.x =
      w <= this.viewportWidth ? (this.viewportWidth - w) / 2 : clamp(this.x, this.viewportWidth - w, 0);
    this.y =
      h <= this.viewportHeight ? (this.viewportHeight - h) / 2 : clamp(this.y, this.viewportHeight - h, 0);
  }
  splitAt(clientX, left) {
    if (this.viewportWidth > 0) this.split = clamp(((clientX - left) / this.viewportWidth) * 100, 0, 100);
  }
  moveSplit(delta) {
    this.split = clamp(this.split + delta, 0, 100);
  }
}
