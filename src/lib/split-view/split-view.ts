import EventEmitter from "eventemitter3";
import clamp from "lodash.clamp";
import styles from "../allotment.module.css";
import { pushToEnd, pushToStart, range } from "../helpers/array";
import type { Disposable } from "../helpers/disposable";
import {
  Orientation,
  Sash,
  SashState,
  type SashEvent as BaseSashEvent,
} from "../sash";

interface SashEvent {
  readonly sash: Sash;
  readonly start: number;
  readonly current: number;
}

/**
 * When adding or removing views, distribute the delta space among
 * all other views.
 */
export type DistributeSizing = { type: "distribute" };

/**
 * When adding or removing views, split the delta space with another
 * specific view, indexed by the provided `index`.
 */
export type SplitSizing = { type: "split"; index: number };

/**
 * When adding or removing views, assume the view is invisible.
 */
export type InvisibleSizing = { type: "invisible"; cachedVisibleSize: number };

/**
 * When adding or removing views, the sizing provides fine grained
 * control over how other views get resized.
 */
export type Sizing = DistributeSizing | SplitSizing | InvisibleSizing;

export const Sizing = {
  /**
   * When adding or removing views, distribute the delta space among
   * all other views.
   */
  Distribute: { type: "distribute" } as DistributeSizing,

  /**
   * When adding or removing views, split the delta space with another
   * specific view, indexed by the provided `index`.
   */
  Split: (index: number): SplitSizing => {
    return { type: "split", index };
  },

  /**
   * When adding or removing views, assume the view is invisible.
   */
  Invisible: (cachedVisibleSize: number): InvisibleSizing => {
    return { type: "invisible", cachedVisibleSize };
  },
};

/** A descriptor for a {@link SplitView} instance. */
export interface SplitViewDescriptor {
  /** The layout size of the {@link SplitView}. */
  size: number;

  /**
   * Descriptors for each {@link View view}.
   */
  views: {
    /** Whether the {@link View view} is visible. */
    visible?: boolean;

    /** The size of the {@link View view}. */
    size: number;

    container: HTMLElement;
    view: View;
  }[];
}

export interface SplitViewOptions {
  /** Which axis the views align on. */
  readonly orientation?: Orientation;

  /** Resize each view proportionally when resizing the SplitView. */
  readonly proportionalLayout?: boolean;

  /**
   * An initial description of this {@link SplitView} instance, allowing
   * to initialize all views within the ctor.
   */
  readonly descriptor?: SplitViewDescriptor;

  /** Override the orthogonal size of sashes. */
  readonly getSashOrthogonalSize?: () => number;
}

export const LayoutPriority = {
  Normal: "NORMAL",
  Low: "LOW", 
  High: "HIGH",
} as const;

export type LayoutPriority = typeof LayoutPriority[keyof typeof LayoutPriority];

/**
 * The interface to implement for views within a {@link SplitView}.
 */
export interface View {
  /** The DOM element for this view. */
  readonly element: HTMLElement;

  /**
   * A minimum size for this view.
   *
   * @remarks If none, set it to `0`.
   */
  readonly minimumSize: number;

  /**
   * A minimum size for this view.
   *
   * @remarks If none, set it to `Number.POSITIVE_INFINITY`.
   */
  readonly maximumSize: number;

  /**
   * The priority of the view when the {@link SplitView.resize layout} algorithm
   * runs. Views with higher priority will be resized first.
   *
   * @remarks Only used when `proportionalLayout` is false.
   */
  readonly priority?: LayoutPriority;

  /**
   * Whether the view will snap whenever the user reaches its minimum size or
   * attempts to grow it beyond the minimum size.
   */
  readonly snap?: boolean;

  /**
   * This will be called by the {@link SplitView} during layout. A view meant to
   * pass along the layout information down to its descendants.
   *
   * @param size The size of this view, in pixels.
   * @param offset The offset of this view, relative to the start of the {@link SplitView}.
   */
  layout(size: number, offset: number): void;

  /**
   * This will be called by the {@link SplitView} whenever this view is made
   * visible or hidden.
   *
   * @param visible Whether the view becomes visible.
   */
  setVisible?(visible: boolean): void;
}

type ViewItemSize = number | { cachedVisibleSize: number };

abstract class ViewItem {
  protected container: HTMLElement;
  public view: View;
  private _size: number;
  private _cachedVisibleSize: number | undefined = undefined;

  constructor(container: HTMLElement, view: View, size: ViewItemSize) {
    this.container = container;
    this.view = view;

    this.container.classList.add("split-view-view", styles.splitViewView);
    this.container.dataset.testid = "split-view-view";

    if (typeof size === "number") {
      this._size = size;
      this._cachedVisibleSize = undefined;
      container.classList.add("split-view-view-visible");
    } else {
      this._size = 0;
      this._cachedVisibleSize = size.cachedVisibleSize;
    }
  }

  set size(size: number) {
    this._size = size;
  }

  get size(): number {
    return this._size;
  }

  get priority(): LayoutPriority | undefined {
    return this.view.priority;
  }

  get snap(): boolean {
    return !!this.view.snap;
  }

  get visible(): boolean {
    return typeof this._cachedVisibleSize === "undefined";
  }

  setVisible(visible: boolean, size?: number): void {
    if (visible === this.visible) {
      return;
    }

    if (visible) {
      this.size = clamp(
        this._cachedVisibleSize ?? 0,
        this.view.minimumSize,
        this.view.maximumSize,
      );
      this._cachedVisibleSize = undefined;
    } else {
      this._cachedVisibleSize = typeof size === "number" ? size : this.size;
      this.size = 0;
    }

    this.container.classList.toggle("split-view-view-visible", visible);

    if (this.view.setVisible) {
      this.view.setVisible(visible);
    }
  }

  get minimumSize(): number {
    return this.visible ? this.view.minimumSize : 0;
  }

  get maximumSize(): number {
    return this.visible ? this.view.maximumSize : 0;
  }

  get cachedVisibleSize(): number | undefined {
    return this._cachedVisibleSize;
  }

  abstract layout(offset: number, layoutContext?: any): void;
}

class VerticalViewItem extends ViewItem {
  layout(offset: number): void {
    if (!this.visible) {
      return;
    }

    this.container.style.top = offset + "px";
    this.container.style.height = this.size + "px";
    this.container.style.left = "0px";
    this.container.style.width = "100%";

    this.view.layout(this.size, offset);
  }
}

class HorizontalViewItem extends ViewItem {
  layout(offset: number): void {
    if (!this.visible) {
      return;
    }

    this.container.style.left = offset + "px";
    this.container.style.width = this.size + "px";
    this.container.style.top = "0px";
    this.container.style.height = "100%";

    this.view.layout(this.size, offset);
  }
}

interface SashItem {
  sash: Sash;
}

interface SashDragState {
  index: number;
  start: number;
  current: number;
  sizes: number[];
  minDelta: number;
  maxDelta: number;
}

export class SplitView extends EventEmitter implements Disposable {
  public onDidChange: ((sizes: number[]) => void) | undefined;
  public onDidDragStart: ((sizes: number[]) => void) | undefined;
  public onDidDragEnd: ((sizes: number[]) => void) | undefined;

  private _orientation: Orientation;
  get orientation(): Orientation {
    return this._orientation;
  }
  set orientation(orientation: Orientation) {
    this._orientation = orientation;
  }

  private sashContainer: HTMLElement;
  private size = 0;
  private contentSize = 0;
  private proportions: undefined | number[] = undefined;
  private viewItems: ViewItem[] = [];
  private sashItems: SashItem[] = [];
  private sashDragState: SashDragState | undefined;
  private _proportionalLayout: boolean;
  
  get proportionalLayout(): boolean {
    return this._proportionalLayout;
  }
  
  set proportionalLayout(value: boolean) {
    this._proportionalLayout = value;
  }
  
  private readonly getSashOrthogonalSize: { (): number } | undefined;

  private _startSnappingEnabled = true;
  get startSnappingEnabled(): boolean {
    return this._startSnappingEnabled;
  }

  set startSnappingEnabled(startSnappingEnabled: boolean) {
    if (this._startSnappingEnabled === startSnappingEnabled) {
      return;
    }

    this._startSnappingEnabled = startSnappingEnabled;
    this.updateSashEnablement();
  }

  private _endSnappingEnabled = true;
  get endSnappingEnabled(): boolean {
    return this._endSnappingEnabled;
  }

  set endSnappingEnabled(endSnappingEnabled: boolean) {
    if (this._endSnappingEnabled === endSnappingEnabled) {
      return;
    }

    this._endSnappingEnabled = endSnappingEnabled;
    this.updateSashEnablement();
  }

  /** Create a new {@link SplitView} instance. */
  constructor(
    container: HTMLElement,
    options: SplitViewOptions = {},
    onDidChange?: (sizes: number[]) => void,
    onDidDragStart?: (sizes: number[]) => void,
    onDidDragEnd?: (sizes: number[]) => void,
  ) {
    super();

    this._orientation = options.orientation ?? Orientation.Vertical;
    this._proportionalLayout = options.proportionalLayout ?? true;
    this.getSashOrthogonalSize = options.getSashOrthogonalSize;

    if (onDidChange) {
      this.onDidChange = onDidChange;
    }

    if (onDidDragStart) {
      this.onDidDragStart = onDidDragStart;
    }

    if (onDidDragEnd) {
      this.onDidDragEnd = onDidDragEnd;
    }

    this.sashContainer = document.createElement("div");
    this.sashContainer.classList.add("sash-container", styles.sashContainer);
    container.prepend(this.sashContainer);

    // We have an existing set of view, add them now
    if (options.descriptor) {
      this.size = options.descriptor.size;

      for (const [
        index,
        viewDescriptor,
      ] of options.descriptor.views.entries()) {
        const size = viewDescriptor.size;
        const container = viewDescriptor.container;
        const view = viewDescriptor.view;

        this.addView(container, view, size, index, true);
      }

      // Initialize content size and proportions for first layout
      this.contentSize = this.viewItems.reduce((r, i) => r + i.size, 0);
      this.saveProportions();
    }
  }

  public addView(
    container: HTMLElement,
    view: View,
    size: number | Sizing,
    index = this.viewItems.length,
    skipLayout?: boolean,
  ): void {
    let viewSize: ViewItemSize;

    if (typeof size === "number") {
      viewSize = size;
    } else if (size.type === "split") {
      viewSize = this.getViewSize(size.index) / 2;
    } else if (size.type === "invisible") {
      viewSize = { cachedVisibleSize: size.cachedVisibleSize };
    } else {
      viewSize = view.minimumSize;
    }

    const item =
      this.orientation === Orientation.Vertical
        ? new VerticalViewItem(container, view, viewSize)
        : new HorizontalViewItem(container, view, viewSize);

    this.viewItems.splice(index, 0, item);

    if (this.viewItems.length > 1) {
      const sash =
        this.orientation === Orientation.Vertical
          ? new Sash(
              this.sashContainer,
              {
                getHorizontalSashTop: (s: Sash) => this.getSashPosition(s),
                getHorizontalSashWidth: this.getSashOrthogonalSize,
              },
              { orientation: Orientation.Horizontal },
            )
          : new Sash(
              this.sashContainer,
              {
                getVerticalSashLeft: (s: Sash) => this.getSashPosition(s),
                getVerticalSashHeight: this.getSashOrthogonalSize,
              },
              { orientation: Orientation.Vertical },
            );

      const sashEventMapper =
        this.orientation === Orientation.Vertical
          ? (e: BaseSashEvent) => ({
              sash,
              start: e.startY,
              current: e.currentY,
            })
          : (e: BaseSashEvent) => ({
              sash,
              start: e.startX,
              current: e.currentX,
            });

      sash.on("start", (event: BaseSashEvent) => {
        this.emit("sashDragStart");
        this.onSashStart(sashEventMapper(event));
        const sizes = this.viewItems.map((i) => i.size);
        this.onDidDragStart?.(sizes);
      });

      sash.on("change", (event: BaseSashEvent) =>
        this.onSashChange(sashEventMapper(event)),
      );

      sash.on("end", () => {
        this.emit("sashDragEnd");
        this.onSashEnd(this.sashItems.findIndex((item) => item.sash === sash));
        const sizes = this.viewItems.map((i) => i.size);
        this.onDidDragEnd?.(sizes);
      });

      sash.on("reset", () => {
        const index = this.sashItems.findIndex((item) => item.sash === sash);
        const upIndexes = range(index, -1, -1);
        const downIndexes = range(index + 1, this.viewItems.length);
        const snapBeforeIndex = this.findFirstSnapIndex(upIndexes);
        const snapAfterIndex = this.findFirstSnapIndex(downIndexes);

        if (
          typeof snapBeforeIndex === "number" &&
          !this.viewItems[snapBeforeIndex].visible
        ) {
          return;
        }

        if (
          typeof snapAfterIndex === "number" &&
          !this.viewItems[snapAfterIndex].visible
        ) {
          return;
        }

        this.emit("sashreset", index);
      });

      const sashItem: SashItem = { sash };

      this.sashItems.splice(index - 1, 0, sashItem);
      
      // 在添加到数组后再进行布局
      sash.layout();
    }

    if (!skipLayout) {
      this.relayout();
    }

    if (!skipLayout && typeof size !== "number" && size.type === "distribute") {
      this.distributeViewSizes();
    }
  }

  public removeView(index: number, sizing?: Sizing): View {
    if (index < 0 || index >= this.viewItems.length) {
      throw new Error("Index out of bounds");
    }

    // Remove view
    const viewItem = this.viewItems.splice(index, 1)[0];
    const view = viewItem.view;

    // Remove sash
    if (this.viewItems.length >= 1) {
      const sashIndex = Math.max(index - 1, 0);
      const sashItem = this.sashItems.splice(sashIndex, 1)[0];
      sashItem.sash.dispose();
    }

    this.relayout();

    if (sizing && sizing.type === "distribute") {
      this.distributeViewSizes();
    }

    return view;
  }

  public moveView(container: HTMLElement, from: number, to: number): void {
    const cachedVisibleSize = this.getViewCachedVisibleSize(from);

    const sizing =
      typeof cachedVisibleSize === "undefined"
        ? this.getViewSize(from)
        : Sizing.Invisible(cachedVisibleSize);

    const view = this.removeView(from);
    this.addView(container, view, sizing, to);
  }

  private getViewCachedVisibleSize(index: number): number | undefined {
    if (index < 0 || index >= this.viewItems.length) {
      throw new Error("Index out of bounds");
    }

    const viewItem = this.viewItems[index];
    return viewItem.cachedVisibleSize;
  }

  public layout(size: number = this.size): void {
    if (this.viewItems.length === 0) {
      return;
    }
    
    const previousSize = Math.max(this.size, this.contentSize);
    this.size = size;

    if (!this.proportions) {
      const indexes = range(0, this.viewItems.length);

      const lowPriorityIndexes = indexes.filter(
        (i) => this.viewItems[i] && this.viewItems[i].priority === LayoutPriority.Low,
      );

      const highPriorityIndexes = indexes.filter(
        (i) => this.viewItems[i] && this.viewItems[i].priority === LayoutPriority.High,
      );

      this.resize(
        this.viewItems.length - 1,
        size - previousSize,
        undefined,
        lowPriorityIndexes,
        highPriorityIndexes,
      );
    } else {
      for (let i = 0; i < this.viewItems.length; i++) {
        const item = this.viewItems[i];
        
        if (item && this.proportions[i] !== undefined) {
          item.size = clamp(
            Math.round(this.proportions[i] * size),
            item.minimumSize,
            item.maximumSize,
          );
        }
      }
    }

    this.distributeEmptySpace();
    this.layoutViews();
  }

  public resizeView(index: number, size: number): void {
    if (index < 0 || index >= this.viewItems.length) {
      return;
    }

    const indexes = range(0, this.viewItems.length).filter((i) => i !== index);

    const lowPriorityIndexes = [
      ...indexes.filter(
        (i) => this.viewItems[i].priority === LayoutPriority.Low,
      ),
      index,
    ];

    const highPriorityIndexes = indexes.filter(
      (i) => this.viewItems[i].priority === LayoutPriority.High,
    );

    const item = this.viewItems[index];
    size = Math.round(size);
    size = clamp(size, item.minimumSize, Math.min(item.maximumSize, this.size));

    item.size = size;
    this.relayout(lowPriorityIndexes, highPriorityIndexes);
  }

  public resizeViews(sizes: number[]): void {
    for (let index = 0; index < sizes.length; index++) {
      const item = this.viewItems[index];
      let size = sizes[index];

      size = Math.round(size);

      size = clamp(
        size,
        item.minimumSize,
        Math.min(item.maximumSize, this.size),
      );

      item.size = size;
    }

    this.contentSize = this.viewItems.reduce((r, i) => r + i.size, 0);
    this.saveProportions();
    this.layout(this.size);
  }

  public getViewSize(index: number): number {
    if (index < 0 || index >= this.viewItems.length) {
      return -1;
    }

    return this.viewItems[index].size;
  }

  public isViewVisible(index: number): boolean {
    if (index < 0 || index >= this.viewItems.length) {
      throw new Error("Index out of bounds");
    }

    const viewItem = this.viewItems[index];
    return viewItem.visible;
  }

  public setViewVisible(index: number, visible: boolean): void {
    if (index < 0 || index >= this.viewItems.length) {
      throw new Error("Index out of bounds");
    }

    const viewItem = this.viewItems[index];
    viewItem.setVisible(visible);

    this.emit("sashchange", index);
    this.relayout();
  }

  public distributeViewSizes(): void {
    const flexibleViewItems: ViewItem[] = [];
    let flexibleSize = 0;

    for (const item of this.viewItems) {
      if (item.maximumSize - item.minimumSize > 0) {
        flexibleViewItems.push(item);
        flexibleSize += item.size;
      }
    }

    const size = Math.floor(flexibleSize / flexibleViewItems.length);

    for (const item of flexibleViewItems) {
      item.size = clamp(size, item.minimumSize, item.maximumSize);
    }

    const indexes = range(0, this.viewItems.length);

    const lowPriorityIndexes = indexes.filter(
      (i) => this.viewItems[i].priority === LayoutPriority.Low,
    );

    const highPriorityIndexes = indexes.filter(
      (i) => this.viewItems[i].priority === LayoutPriority.High,
    );

    this.relayout(lowPriorityIndexes, highPriorityIndexes);
  }

  public dispose(): void {
    this.sashItems.forEach((item) => item.sash.dispose());
    this.sashItems = [];
    this.viewItems = [];
    
    if (this.sashContainer && this.sashContainer.parentElement) {
      this.sashContainer.parentElement.removeChild(this.sashContainer);
    }
  }

  private onSashStart({ sash, start, current }: SashEvent): void {
    const index = this.sashItems.findIndex((item) => item.sash === sash);

    const sizes = this.viewItems.map((i) => i.size);

    const upIndexes = range(index, -1, -1);
    const downIndexes = range(index + 1, this.viewItems.length);

    const minDelta = this.getMinDelta(upIndexes, downIndexes, sizes);
    const maxDelta = this.getMaxDelta(upIndexes, downIndexes, sizes);

    this.sashDragState = {
      index,
      start,
      current,
      sizes,
      minDelta,
      maxDelta,
    };
  }

  private onSashChange({ current }: SashEvent): void {
    const { index, start, sizes, minDelta, maxDelta } = this.sashDragState!;
    const delta = clamp(current - start, minDelta, maxDelta);

    this.resize(index, delta, sizes);
    this.distributeEmptySpace();
    this.layoutViews();
  }

  private onSashEnd(index: number): void {
    this.emit("sashchange", index);
    this.sashDragState = undefined;
    this.saveProportions();
    const sizes = this.viewItems.map((i) => i.size);
    this.onDidChange?.(sizes);
  }

  private getMinDelta(upIndexes: number[], downIndexes: number[], sizes: number[]): number {
    const upMinDelta = upIndexes.reduce(
      (r, i) => r + (this.viewItems[i].minimumSize - sizes[i]),
      0,
    );

    const downMaxDelta = downIndexes.reduce(
      (r, i) => r + (sizes[i] - this.viewItems[i].maximumSize),
      0,
    );

    return Math.min(upMinDelta, downMaxDelta);
  }

  private getMaxDelta(upIndexes: number[], downIndexes: number[], sizes: number[]): number {
    const upMaxDelta = upIndexes.reduce(
      (r, i) => r + (this.viewItems[i].maximumSize - sizes[i]),
      0,
    );

    const downMinDelta = downIndexes.reduce(
      (r, i) => r + (sizes[i] - this.viewItems[i].minimumSize),
      0,
    );

    return Math.min(upMaxDelta, downMinDelta);
  }

  private resize(
    index: number,
    delta: number,
    sizes?: number[],
    lowPriorityIndexes?: number[],
    highPriorityIndexes?: number[],
  ): void {
    if (index < 0 || index >= this.viewItems.length || this.viewItems.length === 0) {
      return;
    }

    if (delta === 0) {
      return;
    }

    const upIndexes = range(index, -1, -1);
    const downIndexes = range(index + 1, this.viewItems.length);

    if (highPriorityIndexes) {
      for (const priorityIndex of highPriorityIndexes) {
        pushToEnd(upIndexes, priorityIndex);
        pushToEnd(downIndexes, priorityIndex);
      }
    }

    if (lowPriorityIndexes) {
      for (const priorityIndex of lowPriorityIndexes) {
        pushToStart(upIndexes, priorityIndex);
        pushToStart(downIndexes, priorityIndex);
      }
    }

    const currentSizes = sizes ?? this.viewItems.map((i) => i?.size || 0);

    delta = this.doResize(upIndexes, downIndexes, delta, currentSizes);
    delta = this.doResize(downIndexes, upIndexes, -delta, currentSizes);

    this.distributeEmptySpace();
    this.layoutViews();
  }

  private doResize(
    indexes: number[],
    _reverseIndexes: number[],
    delta: number,
    currentSizes: number[],
  ): number {
    for (const index of indexes) {
      const item = this.viewItems[index];
      
      if (!item) continue;

      const size = clamp(
        currentSizes[index] + delta,
        item.minimumSize,
        item.maximumSize,
      );

      const sizeDelta = size - currentSizes[index];

      delta -= sizeDelta;
      item.size = size;

      if (delta === 0) {
        break;
      }
    }

    return delta;
  }

  private distributeEmptySpace(lowPriorityIndexes?: number[]): void {
    if (this.viewItems.length === 0) {
      return;
    }
    
    const contentSize = this.viewItems.reduce((r, i) => r + i.size, 0);
    let emptyDelta = this.size - contentSize;

    const indexes = range(0, this.viewItems.length - 1, -1);

    if (lowPriorityIndexes) {
      for (const priorityIndex of lowPriorityIndexes) {
        pushToStart(indexes, priorityIndex);
      }
    }

    for (const index of indexes) {
      const item = this.viewItems[index];
      
      if (!item) continue;

      const size = clamp(
        item.size + emptyDelta,
        item.minimumSize,
        item.maximumSize,
      );

      const sizeDelta = size - item.size;

      emptyDelta -= sizeDelta;
      item.size = size;
    }

    this.contentSize = this.viewItems.reduce((r, i) => r + i.size, 0);
  }

  private layoutViews(): void {
    // Save new content size
    this.contentSize = this.viewItems.reduce((r, i) => r + i.size, 0);

    // Layout views
    let offset = 0;

    for (const item of this.viewItems) {
      if (item) {
        item.layout(offset);
        offset += item.size;
      }
    }

    // Layout sashes
    this.sashItems.forEach((item) => item.sash.layout());
    this.updateSashEnablement();
  }

  private saveProportions(): void {
    if (this.proportionalLayout && this.contentSize > 0) {
      this.proportions = this.viewItems.map((i) => i.size / this.contentSize);
    }
  }

  private relayout(lowPriorityIndexes?: number[], highPriorityIndexes?: number[]): void {
    const previousSize = Math.max(this.size, this.contentSize);

    this.resize(
      this.viewItems.length - 1,
      this.size - previousSize,
      undefined,
      lowPriorityIndexes,
      highPriorityIndexes,
    );
  }

  private getSashPosition(sash: Sash): number {
    // 首先尝试找到sash在数组中的位置
    let sashIndex = -1;
    for (let i = 0; i < this.sashItems.length; i++) {
      if (this.sashItems[i].sash === sash) {
        sashIndex = i;
        break;
      }
    }
    
    // 如果找不到，可能是因为Proxy包装，尝试通过DOM元素查找
    if (sashIndex === -1) {
      const sashEl = (sash as any).el || sash;
      if (sashEl) {
        for (let i = 0; i < this.sashItems.length; i++) {
          const itemSashEl = (this.sashItems[i].sash as any).el || this.sashItems[i].sash;
          if (itemSashEl === sashEl) {
            sashIndex = i;
            break;
          }
        }
      }
    }
    
    if (sashIndex === -1) {
      return 0;
    }

    // 计算位置：前面所有view的size之和
    let position = 0;
    for (let i = 0; i <= sashIndex; i++) {
      if (this.viewItems[i]) {
        position += this.viewItems[i].size;
      }
    }

    return position;
  }

  private findFirstSnapIndex(indexes: number[]): number | undefined {
    for (const index of indexes) {
      const viewItem = this.viewItems[index];

      if (!viewItem.visible) {
        continue;
      }

      if (viewItem.snap) {
        return index;
      }
    }

    return undefined;
  }

  private updateSashEnablement(): void {
    let previous = false;

    const collapsesDown = this.viewItems.map(
      (i) => (previous = i.size - i.minimumSize > 0 || previous)
    );

    previous = false;

    const expandsDown = this.viewItems.map(
      (i) => (previous = i.maximumSize - i.size > 0 || previous)
    );

    const reverseViews = [...this.viewItems].reverse();

    previous = false;

    const collapsesUp = reverseViews
      .map((i) => (previous = i.size - i.minimumSize > 0 || previous))
      .reverse();

    previous = false;

    const expandsUp = reverseViews
      .map((i) => (previous = i.maximumSize - i.size > 0 || previous))
      .reverse();

    let position = 0;

    for (let index = 0; index < this.sashItems.length; index++) {
      const { sash } = this.sashItems[index];
      const viewItem = this.viewItems[index];

      position += viewItem.size;

      const min = !(collapsesDown[index] && expandsUp[index + 1]);
      const max = !(expandsDown[index] && collapsesUp[index + 1]);

      if (min && max) {
        const upIndexes = range(index, -1, -1);
        const downIndexes = range(index + 1, this.viewItems.length);
        const snapBeforeIndex = this.findFirstSnapIndex(upIndexes);
        const snapAfterIndex = this.findFirstSnapIndex(downIndexes);

        const snappedBefore =
          typeof snapBeforeIndex === "number" &&
          !this.viewItems[snapBeforeIndex].visible;

        const snappedAfter =
          typeof snapAfterIndex === "number" &&
          !this.viewItems[snapAfterIndex].visible;

        if (
          snappedBefore &&
          collapsesUp[index] &&
          (position > 0 || this.startSnappingEnabled)
        ) {
          sash.state = SashState.Minimum;
        } else if (
          snappedAfter &&
          collapsesDown[index] &&
          (position < this.contentSize || this.endSnappingEnabled)
        ) {
          sash.state = SashState.Maximum;
        } else {
          sash.state = SashState.Disabled;
        }
      } else if (min && !max) {
        sash.state = SashState.Minimum;
      } else if (!min && max) {
        sash.state = SashState.Maximum;
      } else {
        sash.state = SashState.Enabled;
      }
    }
  }
}