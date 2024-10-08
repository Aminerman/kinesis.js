import { KinesisDepthOptions } from "./types";
import KinesisDepthElement from "./kinesisDepthElement";
import { getMousePosition, throttle } from "./utils";

class KinesisDepth {
  container: HTMLElement;
  elements: KinesisDepthElement[] = [];
  options: Required<KinesisDepthOptions>;
  isActive: boolean;
  initialTransform: string;
  perspective: number;
  sensitivity: number;
  inverted: boolean;
  observer: IntersectionObserver | null = null;
  throttleDuration: number;
  isMouseInside: boolean = false;

  constructor(container: HTMLElement, options: KinesisDepthOptions = {}) {
    if (!container.hasAttribute("data-kinesisdepth")) {
      throw new Error(
        "Container does not have the 'data-kinesisdepth' attribute."
      );
    }

    this.container = container;

    this.options = {
      active: options.active !== undefined ? options.active : true,
      duration: options.duration !== undefined ? options.duration : 1000,
      easing:
        options.easing !== undefined
          ? options.easing
          : "cubic-bezier(0.23, 1, 0.32, 1)",
      perspective:
        options.perspective !== undefined ? options.perspective : 1000,
      sensitivity: options.sensitivity !== undefined ? options.sensitivity : 40,
      inverted: options.inverted !== undefined ? options.inverted : false,
    } as Required<KinesisDepthOptions>;

    this.throttleDuration = parseInt(
      container.getAttribute("data-ks-throttle") || "100",
      10
    );

    this.isActive = this.options.active;
    this.perspective = this.options.perspective;
    this.sensitivity = this.options.sensitivity;
    this.inverted = this.options.inverted;

    const computedStyle = window.getComputedStyle(this.container);
    this.initialTransform =
      computedStyle.transform === "none" ? "" : computedStyle.transform;
    this.init();
  }

  init() {
    const children = this.container.querySelectorAll(
      "[data-kinesisdepth-element]"
    ) as NodeListOf<HTMLElement>;

    children.forEach((child) => {
      const depthElement = new KinesisDepthElement(child);
      this.elements.push(depthElement);
    });

    this.container.style.perspective = `${this.perspective}px`;
    this.container.style.transformStyle = "preserve-3d";
    this.container.style.position = "relative";
    this.container.style.transition = `transform ${this.options.duration}ms ${this.options.easing}`;

    if (this.isActive) {
      this.bindHoverEvents();
    }
  }

  bindHoverEvents() {
    this.container.addEventListener("mouseenter", this.onMouseEnter);
    this.container.addEventListener("mousemove", throttle(this.onMouseMove));
    this.container.addEventListener("mouseleave", this.onMouseLeave);
  }

  onMouseEnter = () => {
    this.isMouseInside = true;
    this.elements.forEach((element) => {
      element.applyDepth(element.depth);
    });
  };

  onMouseMove = (event: MouseEvent) => {
    if (!this.isMouseInside) return;

    const pos = getMousePosition(event, this.container);
    const rotateX = pos.y * this.sensitivity * (this.inverted ? -1 : 1);
    const rotateY = pos.x * this.sensitivity * (this.inverted ? -1 : 1);

    this.container.style.transform = `${this.initialTransform} rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  onMouseLeave = () => {
    this.isMouseInside = false;

    this.container.style.transform = this.initialTransform;

    this.elements.forEach((element) => {
      element.resetDepth();
    });

    this.container.removeEventListener("mousemove", this.onMouseMove);
  };
}

export default KinesisDepth;
