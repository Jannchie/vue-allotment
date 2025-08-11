import type { Disposable } from '../helpers/disposable'
import type { SashEvent as BaseSashEvent } from '../sash'
import EventEmitter from 'eventemitter3'
import clamp from 'lodash.clamp'
import styles from '../allotment.module.css'
import { pushToEnd, pushToStart, range } from '../helpers/array'
import {

  Orientation,
  Sash,
  SashState,
} from '../sash'

interface SashEvent {
  readonly sash: Sash
  readonly start: number
  readonly current: number
}

/**
 * When adding or removing views, distribute the delta space among
 * all other views.
 */
export interface DistributeSizing { type: 'distribute' }

/**
 * When adding or removing views, split the delta space with another
 * specific view, indexed by the provided `index`.
 */
export interface SplitSizing { type: 'split', index: number }

/**
 * When adding or removing views, assume the view is invisible.
 */
export interface InvisibleSizing { type: 'invisible', cachedVisibleSize: number }

/**
 * When adding or removing views, the sizing provides fine grained
 * control over how other views get resized.
 */
export type Sizing = DistributeSizing | SplitSizing | InvisibleSizing

export const SizingUtils = {
  /**
   * When adding or removing views, distribute the delta space among
   * all other views.
   */
  Distribute: { type: 'distribute' } as DistributeSizing,

  /**
   * When adding or removing views, split the delta space with another
   * specific view, indexed by the provided `index`.
   */
  Split: (index: number): SplitSizing => {
    return { type: 'split', index }
  },

  /**
   * When adding or removing views, assume the view is invisible.
   */
  Invisible: (cachedVisibleSize: number): InvisibleSizing => {
    return { type: 'invisible', cachedVisibleSize }
  },
}

/** A descriptor for a {@link SplitView} instance. */
export interface SplitViewDescriptor {
  /** The layout size of the {@link SplitView}. */
  size: number

  /**
   * Descriptors for each {@link View view}.
   */
  views: {
    /** Whether the {@link View view} is visible. */
    visible?: boolean

    /** The size of the {@link View view}. */
    size: number

    container: HTMLElement
    view: View
  }[]
}

export interface SplitViewOptions {
  /** Which axis the views align on. */
  readonly orientation?: Orientation

  /** Resize each view proportionally when resizing the SplitView. */
  readonly proportionalLayout?: boolean

  /**
   * An initial description of this {@link SplitView} instance, allowing
   * to initialize all views within the ctor.
   */
  readonly descriptor?: SplitViewDescriptor

  /** Override the orthogonal size of sashes. */
  readonly getSashOrthogonalSize?: () => number
}

export enum LayoutPriority {
  Normal,
  Low,
  High,
}

/**
 * The interface to implement for views within a {@link SplitView}.
 */
export interface View {
  /** The DOM element for this view. */
  readonly element: HTMLElement

  /**
   * A minimum size for this view.
   *
   * @remarks If none, set it to `0`.
   */
  readonly minimumSize: number

  /**
   * A minimum size for this view.
   *
   * @remarks If none, set it to `Number.POSITIVE_INFINITY`.
   */
  readonly maximumSize: number

  /**
   * The priority of the view when the {@link SplitView.resize layout} algorithm
   * runs. Views with higher priority will be resized first.
   *
   * @remarks Only used when `proportionalLayout` is false.
   */
  readonly priority?: LayoutPriority

  /**
   * Whether the view will snap whenever the user reaches its minimum size or
   * attempts to grow it beyond the minimum size.
   */
  readonly snap?: boolean

  /**
   * This will be called by the {@link SplitView} during layout. A view meant to
   * pass along the layout information down to its descendants.
   *
   * @param size The size of this view, in pixels.
   * @param offset The offset of this view, relative to the start of the {@link SplitView}.
   */
  layout: (size: number, offset: number) => void

  /**
   * This will be called by the {@link SplitView} whenever this view is made
   * visible or hidden.
   *
   * @param visible Whether the view becomes visible.
   */
  setVisible?: (visible: boolean) => void
}

type ViewItemSize = number | { cachedVisibleSize: number }

abstract class ViewItem {
  protected container: HTMLElement
  public view: View
  private _size: number
  private _cachedVisibleSize: number | undefined = undefined

  constructor(container: HTMLElement, view: View, size: ViewItemSize) {
    this.container = container
    this.view = view

    this.container.classList.add('split-view-view', styles.splitViewView)
    this.container.dataset.testid = 'split-view-view'

    if (typeof size === 'number') {
      this._size = size
      this._cachedVisibleSize = undefined
      container.classList.add('split-view-view-visible')
    }
    else {
      this._size = 0
      this._cachedVisibleSize = size.cachedVisibleSize
    }
  }

  set size(size: number) {
    this._size = size
  }

  get size(): number {
    return this._size
  }

  get priority(): LayoutPriority | undefined {
    return this.view.priority
  }

  get snap(): boolean {
    return !!this.view.snap
  }

  get visible(): boolean {
    return this._cachedVisibleSize === undefined
  }

  setVisible(visible: boolean, size?: number): void {
    if (visible === this.visible) {
      return
    }

    if (visible) {
      this.size = clamp(
        this._cachedVisibleSize ?? 0,
        this.view.minimumSize,
        this.view.maximumSize,
      )
      this._cachedVisibleSize = undefined
    }
    else {
      this._cachedVisibleSize = typeof size === 'number' ? size : this.size
      this.size = 0
    }

    this.container.classList.toggle('split-view-view-visible', visible)

    if (this.view.setVisible) {
      this.view.setVisible(visible)
    }
  }

  get minimumSize(): number {
    return this.visible ? this.view.minimumSize : 0
  }

  get maximumSize(): number {
    return this.visible ? this.view.maximumSize : 0
  }

  get cachedVisibleSize(): number | undefined {
    return this._cachedVisibleSize
  }

  abstract layout(offset: number, layoutContext?: any): void
}

class VerticalViewItem extends ViewItem {
  layout(offset: number): void {
    if (!this.visible) {
      // Set height to 0 for invisible items
      this.container.style.height = '0px'
      this.container.style.top = `${offset}px`
      this.container.style.left = '0px'
      this.container.style.width = '100%'
      return
    }

    this.container.style.top = `${offset}px`
    this.container.style.height = `${this.size}px`
    this.container.style.left = '0px'
    this.container.style.width = '100%'

    this.view.layout(this.size, offset)
  }
}

class HorizontalViewItem extends ViewItem {
  layout(offset: number): void {
    if (!this.visible) {
      // Set width to 0 for invisible items
      this.container.style.width = '0px'
      this.container.style.left = `${offset}px`
      this.container.style.top = '0px'
      this.container.style.height = '100%'
      return
    }

    this.container.style.left = `${offset}px`
    this.container.style.width = `${this.size}px`
    this.container.style.top = '0px'
    this.container.style.height = '100%'

    this.view.layout(this.size, offset)
  }
}

interface SashItem {
  sash: Sash
}

interface SashDragSnapState {
  readonly index: number
  readonly limitDelta: number
  readonly size: number
}

interface SashDragState {
  index: number
  start: number
  current: number
  sizes: number[]
  minDelta: number
  maxDelta: number
  snapBefore?: SashDragSnapState
  snapAfter?: SashDragSnapState
}

export class SplitView extends EventEmitter implements Disposable {
  public onDidChange: ((sizes: number[]) => void) | undefined
  public onDidDragStart: ((sizes: number[]) => void) | undefined
  public onDidDragEnd: ((sizes: number[]) => void) | undefined

  private _orientation: Orientation
  get orientation(): Orientation {
    return this._orientation
  }

  set orientation(orientation: Orientation) {
    this._orientation = orientation
  }

  private sashContainer: HTMLElement
  private size = 0
  private contentSize = 0
  private proportions: undefined | number[] = undefined
  private viewItems: ViewItem[] = []
  private sashItems: SashItem[] = []
  private sashDragState: SashDragState | undefined
  private _proportionalLayout: boolean

  get proportionalLayout(): boolean {
    return this._proportionalLayout
  }

  set proportionalLayout(value: boolean) {
    this._proportionalLayout = value
  }

  private readonly getSashOrthogonalSize: { (): number } | undefined

  private _startSnappingEnabled = true
  get startSnappingEnabled(): boolean {
    return this._startSnappingEnabled
  }

  set startSnappingEnabled(startSnappingEnabled: boolean) {
    if (this._startSnappingEnabled === startSnappingEnabled) {
      return
    }

    this._startSnappingEnabled = startSnappingEnabled
    this.updateSashEnablement()
  }

  private _endSnappingEnabled = true
  get endSnappingEnabled(): boolean {
    return this._endSnappingEnabled
  }

  set endSnappingEnabled(endSnappingEnabled: boolean) {
    if (this._endSnappingEnabled === endSnappingEnabled) {
      return
    }

    this._endSnappingEnabled = endSnappingEnabled
    this.updateSashEnablement()
  }

  /** Create a new {@link SplitView} instance. */
  constructor(
    container: HTMLElement,
    options: SplitViewOptions = {},
    onDidChange?: (sizes: number[]) => void,
    onDidDragStart?: (sizes: number[]) => void,
    onDidDragEnd?: (sizes: number[]) => void,
  ) {
    super()

    this._orientation = options.orientation ?? Orientation.Vertical
    this._proportionalLayout = options.proportionalLayout ?? true
    this.getSashOrthogonalSize = options.getSashOrthogonalSize

    if (onDidChange) {
      this.onDidChange = onDidChange
    }

    if (onDidDragStart) {
      this.onDidDragStart = onDidDragStart
    }

    if (onDidDragEnd) {
      this.onDidDragEnd = onDidDragEnd
    }

    this.sashContainer = document.createElement('div')
    this.sashContainer.classList.add('sash-container', styles.sashContainer)
    container.prepend(this.sashContainer)

    // We have an existing set of view, add them now
    if (options.descriptor) {
      this.size = options.descriptor.size

      for (const [index, viewDescriptor] of options.descriptor.views.entries()) {
        const size = viewDescriptor.size
        const container = viewDescriptor.container
        const view = viewDescriptor.view

        this.addView(container, view, size, index, true)
      }

      // Initialize content size and proportions for first layout
      this.contentSize = this.viewItems.reduce((r, i) => r + i.size, 0)
      this.saveProportions()
    }
  }

  public addView(
    container: HTMLElement,
    view: View,
    size: number | Sizing,
    index = this.viewItems.length,
    skipLayout?: boolean,
  ): void {
    let viewSize: ViewItemSize

    if (typeof size === 'number') {
      viewSize = size
    }
    else if (size.type === 'split') {
      viewSize = this.getViewSize(size.index) / 2
    }
    else if (size.type === 'invisible') {
      viewSize = { cachedVisibleSize: size.cachedVisibleSize }
    }
    else {
      viewSize = view.minimumSize
    }

    const item
      = this.orientation === Orientation.Vertical
        ? new VerticalViewItem(container, view, viewSize)
        : new HorizontalViewItem(container, view, viewSize)

    this.viewItems.splice(index, 0, item)

    if (this.viewItems.length > 1) {
      const sash
        = this.orientation === Orientation.Vertical
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
          )

      const sashEventMapper
        = this.orientation === Orientation.Vertical
          ? (e: BaseSashEvent) => ({
              sash,
              start: e.startY,
              current: e.currentY,
            })
          : (e: BaseSashEvent) => ({
              sash,
              start: e.startX,
              current: e.currentX,
            })

      sash.on('start', (event: BaseSashEvent) => {
        this.emit('sashDragStart')
        this.onSashStart(sashEventMapper(event))
        const sizes = this.viewItems.map(i => i.size)
        this.onDidDragStart?.(sizes)
      })

      sash.on('change', (event: BaseSashEvent) =>
        this.onSashChange(sashEventMapper(event)))

      sash.on('end', () => {
        this.emit('sashDragEnd')
        // Find index handling potential Proxy wrapping
        let index = this.sashItems.findIndex(item => item.sash === sash)
        if (index === -1) {
          const sashEl = (sash as any).el
          if (sashEl) {
            index = this.sashItems.findIndex((item) => {
              const itemSashEl = (item.sash as any).el
              return itemSashEl === sashEl
            })
          }
        }
        this.onSashEnd(index)
        const sizes = this.viewItems.map(i => i.size)
        this.onDidDragEnd?.(sizes)
      })

      sash.on('reset', () => {
        // Find index handling potential Proxy wrapping
        let index = this.sashItems.findIndex(item => item.sash === sash)
        if (index === -1) {
          const sashEl = (sash as any).el
          if (sashEl) {
            index = this.sashItems.findIndex((item) => {
              const itemSashEl = (item.sash as any).el
              return itemSashEl === sashEl
            })
          }
        }
        const upIndexes = range(index, -1, -1)
        const downIndexes = range(index + 1, this.viewItems.length)
        const snapBeforeIndex = this.findFirstSnapIndex(upIndexes)
        const snapAfterIndex = this.findFirstSnapIndex(downIndexes)

        if (
          typeof snapBeforeIndex === 'number'
          && !this.viewItems[snapBeforeIndex].visible
        ) {
          return
        }

        if (
          typeof snapAfterIndex === 'number'
          && !this.viewItems[snapAfterIndex].visible
        ) {
          return
        }

        this.emit('sashreset', index)
      })

      const sashItem: SashItem = { sash }

      this.sashItems.splice(index - 1, 0, sashItem)
    }

    if (!skipLayout) {
      this.relayout()
    }

    if (!skipLayout && typeof size !== 'number' && size.type === 'distribute') {
      this.distributeViewSizes()
    }
  }

  public removeView(index: number, sizing?: Sizing): View {
    if (index < 0 || index >= this.viewItems.length) {
      throw new Error('Index out of bounds')
    }

    // Remove view
    const viewItem = this.viewItems.splice(index, 1)[0]
    const view = viewItem.view

    // Remove sash
    if (this.viewItems.length > 0) {
      const sashIndex = Math.max(index - 1, 0)
      const sashItem = this.sashItems.splice(sashIndex, 1)[0]
      sashItem.sash.dispose()
    }

    this.relayout()

    if (sizing && sizing.type === 'distribute') {
      this.distributeViewSizes()
    }

    return view
  }

  public moveView(container: HTMLElement, from: number, to: number): void {
    const cachedVisibleSize = this.getViewCachedVisibleSize(from)

    const sizing
      = cachedVisibleSize === undefined
        ? this.getViewSize(from)
        : SizingUtils.Invisible(cachedVisibleSize)

    const view = this.removeView(from)
    this.addView(container, view, sizing, to)
  }

  private getViewCachedVisibleSize(index: number): number | undefined {
    if (index < 0 || index >= this.viewItems.length) {
      throw new Error('Index out of bounds')
    }

    const viewItem = this.viewItems[index]
    return viewItem.cachedVisibleSize
  }

  public layout(size: number = this.size): void {
    if (this.viewItems.length === 0) {
      return
    }

    const previousSize = Math.max(this.size, this.contentSize)
    this.size = size

    if (this.proportions) {
      for (let i = 0; i < this.viewItems.length; i++) {
        const item = this.viewItems[i]

        if (item && this.proportions[i] !== undefined) {
          item.size = clamp(
            Math.round(this.proportions[i] * size),
            item.minimumSize,
            item.maximumSize,
          )
        }
      }
    }
    else {
      const indexes = range(0, this.viewItems.length)

      const lowPriorityIndexes = indexes.filter(
        i => this.viewItems[i] && this.viewItems[i].priority === LayoutPriority.Low,
      )

      const highPriorityIndexes = indexes.filter(
        i => this.viewItems[i] && this.viewItems[i].priority === LayoutPriority.High,
      )

      this.resize(
        this.viewItems.length - 1,
        size - previousSize,
        undefined,
        lowPriorityIndexes,
        highPriorityIndexes,
      )
    }

    this.distributeEmptySpace()
    this.layoutViews()
  }

  public resizeView(index: number, size: number): void {
    if (index < 0 || index >= this.viewItems.length) {
      return
    }

    const indexes = range(0, this.viewItems.length).filter(i => i !== index)

    const lowPriorityIndexes = [
      ...indexes.filter(
        i => this.viewItems[i].priority === LayoutPriority.Low,
      ),
      index,
    ]

    const highPriorityIndexes = indexes.filter(
      i => this.viewItems[i].priority === LayoutPriority.High,
    )

    const item = this.viewItems[index]
    size = Math.round(size)
    size = clamp(size, item.minimumSize, Math.min(item.maximumSize, this.size))

    item.size = size
    this.relayout(lowPriorityIndexes, highPriorityIndexes)
  }

  public resizeViews(sizes: number[]): void {
    for (let [index, size] of sizes.entries()) {
      const item = this.viewItems[index]

      size = Math.round(size)

      size = clamp(
        size,
        item.minimumSize,
        Math.min(item.maximumSize, this.size),
      )

      item.size = size
    }

    this.contentSize = this.viewItems.reduce((r, i) => r + i.size, 0)
    this.saveProportions()
    this.layout(this.size)
  }

  public getViewSize(index: number): number {
    if (index < 0 || index >= this.viewItems.length) {
      return -1
    }

    return this.viewItems[index].size
  }

  public isViewVisible(index: number): boolean {
    if (index < 0 || index >= this.viewItems.length) {
      throw new Error('Index out of bounds')
    }

    const viewItem = this.viewItems[index]
    return viewItem.visible
  }

  public setViewVisible(index: number, visible: boolean): void {
    if (index < 0 || index >= this.viewItems.length) {
      throw new Error('Index out of bounds')
    }

    const viewItem = this.viewItems[index]
    viewItem.setVisible(visible)

    this.emit('sashchange', index)
    this.distributeEmptySpace()
    this.layoutViews()
    this.saveProportions()
  }

  public distributeViewSizes(): void {
    const flexibleViewItems: ViewItem[] = []
    let flexibleSize = 0

    for (const item of this.viewItems) {
      if (item.maximumSize - item.minimumSize > 0) {
        flexibleViewItems.push(item)
        flexibleSize += item.size
      }
    }

    const size = Math.floor(flexibleSize / flexibleViewItems.length)

    for (const item of flexibleViewItems) {
      item.size = clamp(size, item.minimumSize, item.maximumSize)
    }

    const indexes = range(0, this.viewItems.length)

    const lowPriorityIndexes = indexes.filter(
      i => this.viewItems[i].priority === LayoutPriority.Low,
    )

    const highPriorityIndexes = indexes.filter(
      i => this.viewItems[i].priority === LayoutPriority.High,
    )

    this.relayout(lowPriorityIndexes, highPriorityIndexes)
  }

  public dispose(): void {
    for (const item of this.sashItems) item.sash.dispose()
    this.sashItems = []
    this.viewItems = []

    if (this.sashContainer && this.sashContainer.parentElement) {
      this.sashContainer.remove()
    }
  }

  private onSashStart({ sash, start, current }: SashEvent): void {
    // Find sash index, handling potential Proxy wrapping
    let index = this.sashItems.findIndex(item => item.sash === sash)

    // If direct comparison fails (due to Proxy wrapping), try comparing DOM elements
    if (index === -1) {
      const sashEl = (sash as any).el
      if (sashEl) {
        index = this.sashItems.findIndex((item) => {
          const itemSashEl = (item.sash as any).el
          return itemSashEl === sashEl
        })
      }
    }

    const sizes = this.viewItems.map(i => i.size)

    const upIndexes = range(index, -1, -1)
    const downIndexes = range(index + 1, this.viewItems.length)

    const minDelta = this.getMinDelta(upIndexes, downIndexes, sizes)
    const maxDelta = this.getMaxDelta(upIndexes, downIndexes, sizes)

    let snapBefore: SashDragSnapState | undefined
    let snapAfter: SashDragSnapState | undefined

    const snapBeforeIndex = this.findFirstSnapIndex(upIndexes)
    const snapAfterIndex = this.findFirstSnapIndex(downIndexes)

    if (typeof snapBeforeIndex === 'number') {
      const viewItem = this.viewItems[snapBeforeIndex]
      const halfSize = Math.floor(viewItem.minimumSize / 2)
      snapBefore = {
        index: snapBeforeIndex,
        limitDelta: viewItem.visible
          ? minDelta - halfSize
          : minDelta + halfSize,
        size: viewItem.size,
      }
    }

    if (typeof snapAfterIndex === 'number') {
      const viewItem = this.viewItems[snapAfterIndex]
      const halfSize = Math.floor(viewItem.minimumSize / 2)
      snapAfter = {
        index: snapAfterIndex,
        limitDelta: viewItem.visible
          ? maxDelta + halfSize
          : maxDelta - halfSize,
        size: viewItem.size,
      }
    }

    this.sashDragState = {
      index,
      start,
      current,
      sizes,
      minDelta,
      maxDelta,
      snapBefore,
      snapAfter,
    }
  }

  private onSashChange({ current }: SashEvent): void {
    const { index, start, sizes, minDelta, maxDelta, snapBefore, snapAfter } = this.sashDragState!
    const delta = current - start

    this.resize(index, delta, sizes, undefined, undefined, minDelta, maxDelta, snapBefore, snapAfter)
    this.distributeEmptySpace()
    this.layoutViews()
  }

  private onSashEnd(index: number): void {
    this.emit('sashchange', index)
    this.sashDragState = undefined
    this.saveProportions()
    const sizes = this.viewItems.map(i => i.size)
    this.onDidChange?.(sizes)
  }

  private getMinDelta(upIndexes: number[], downIndexes: number[], sizes: number[]): number {
    const upMinDelta = upIndexes.reduce(
      (r, i) => r + (this.viewItems[i].minimumSize - sizes[i]),
      0,
    )

    const downMaxDelta = downIndexes.reduce(
      (r, i) => r + (sizes[i] - this.viewItems[i].maximumSize),
      0,
    )

    return Math.max(upMinDelta, downMaxDelta)
  }

  private getMaxDelta(upIndexes: number[], downIndexes: number[], sizes: number[]): number {
    const upMaxDelta = upIndexes.reduce(
      (r, i) => r + (this.viewItems[i].maximumSize - sizes[i]),
      0,
    )

    const downMinDelta = downIndexes.reduce(
      (r, i) => r + (sizes[i] - this.viewItems[i].minimumSize),
      0,
    )

    return Math.min(downMinDelta, upMaxDelta)
  }

  private resize(
    index: number,
    delta: number,
    sizes?: number[],
    lowPriorityIndexes?: number[],
    highPriorityIndexes?: number[],
    overloadMinDelta: number = Number.NEGATIVE_INFINITY,
    overloadMaxDelta: number = Number.POSITIVE_INFINITY,
    snapBefore?: SashDragSnapState,
    snapAfter?: SashDragSnapState,
  ): number {
    if (index < 0 || index >= this.viewItems.length || this.viewItems.length === 0) {
      return 0
    }

    const upIndexes = range(index, -1, -1)
    const downIndexes = range(index + 1, this.viewItems.length)

    if (highPriorityIndexes) {
      for (const priorityIndex of highPriorityIndexes) {
        pushToStart(upIndexes, priorityIndex)
        pushToStart(downIndexes, priorityIndex)
      }
    }

    if (lowPriorityIndexes) {
      for (const priorityIndex of lowPriorityIndexes) {
        pushToEnd(upIndexes, priorityIndex)
        pushToEnd(downIndexes, priorityIndex)
      }
    }

    const currentSizes = sizes ?? this.viewItems.map(i => i?.size || 0)

    const upItems = upIndexes.map(i => this.viewItems[i])
    const upSizes = upIndexes.map(i => currentSizes[i])
    const downItems = downIndexes.map(i => this.viewItems[i])
    const downSizes = downIndexes.map(i => currentSizes[i])

    const minDeltaUp = upIndexes.reduce(
      (r, i) => r + (this.viewItems[i].minimumSize - currentSizes[i]),
      0,
    )
    const maxDeltaUp = upIndexes.reduce(
      (r, i) => r + (this.viewItems[i].maximumSize - currentSizes[i]),
      0,
    )
    const maxDeltaDown
      = downIndexes.length === 0
        ? Number.POSITIVE_INFINITY
        : downIndexes.reduce(
            (r, i) => r + (currentSizes[i] - this.viewItems[i].minimumSize),
            0,
          )
    const minDeltaDown
      = downIndexes.length === 0
        ? Number.NEGATIVE_INFINITY
        : downIndexes.reduce(
            (r, i) => r + (currentSizes[i] - this.viewItems[i].maximumSize),
            0,
          )

    const minDelta = Math.max(minDeltaUp, minDeltaDown, overloadMinDelta)
    const maxDelta = Math.min(maxDeltaDown, maxDeltaUp, overloadMaxDelta)

    let snapped = false

    if (snapBefore) {
      const snapView = this.viewItems[snapBefore.index]
      const visible = delta >= snapBefore.limitDelta
      snapped = visible !== snapView.visible
      snapView.setVisible(visible, snapBefore.size)
    }

    if (!snapped && snapAfter) {
      const snapView = this.viewItems[snapAfter.index]
      const visible = delta < snapAfter.limitDelta
      snapped = visible !== snapView.visible
      snapView.setVisible(visible, snapAfter.size)
    }

    if (snapped) {
      return this.resize(
        index,
        delta,
        sizes,
        lowPriorityIndexes,
        highPriorityIndexes,
        overloadMinDelta,
        overloadMaxDelta,
      )
    }

    delta = clamp(delta, minDelta, maxDelta)

    // Resize up items (they should increase when delta is positive)
    for (let i = 0, deltaUp = delta; i < upItems.length; i++) {
      const item = upItems[i]
      if (!item) {
        continue
      }

      const size = clamp(
        upSizes[i] + deltaUp,
        item.minimumSize,
        item.maximumSize,
      )

      const viewDelta = size - upSizes[i]
      deltaUp -= viewDelta
      item.size = size
    }

    // Resize down items (they should decrease when delta is positive)
    for (let i = 0, deltaDown = delta; i < downItems.length; i++) {
      const item = downItems[i]
      if (!item) {
        continue
      }

      const size = clamp(
        downSizes[i] - deltaDown,
        item.minimumSize,
        item.maximumSize,
      )

      const viewDelta = size - downSizes[i]
      deltaDown += viewDelta
      item.size = size
    }

    return delta
  }

  private distributeEmptySpace(lowPriorityIndex?: number): void {
    if (this.viewItems.length === 0) {
      return
    }

    const contentSize = this.viewItems.reduce((r, i) => r + i.size, 0)
    let emptyDelta = this.size - contentSize

    const indexes = range(0, this.viewItems.length)
    const sortedIndexes: number[] = []

    const lowPriorityIndexes = indexes.filter(
      i => this.viewItems[i].priority === LayoutPriority.Low,
    )

    const normalPriorityIndexes = indexes.filter(
      i => this.viewItems[i].priority === LayoutPriority.Normal,
    )

    const highPriorityIndexes = indexes.filter(
      i => this.viewItems[i].priority === LayoutPriority.High,
    )

    sortedIndexes.push(
      ...highPriorityIndexes,
      ...normalPriorityIndexes,
      ...lowPriorityIndexes,
    )

    if (typeof lowPriorityIndex === 'number') {
      pushToEnd(sortedIndexes, lowPriorityIndex)
    }

    for (let i = 0; emptyDelta !== 0 && i < sortedIndexes.length; i++) {
      const item = this.viewItems[sortedIndexes[i]]

      if (!item) {
        continue
      }

      const size = clamp(
        item.size + emptyDelta,
        item.minimumSize,
        item.maximumSize,
      )

      const viewDelta = size - item.size

      emptyDelta -= viewDelta
      item.size = size
    }

    this.contentSize = this.viewItems.reduce((r, i) => r + i.size, 0)
  }

  private layoutViews(): void {
    // Save new content size
    this.contentSize = this.viewItems.reduce((r, i) => r + i.size, 0)

    // Layout views
    let offset = 0

    for (const item of this.viewItems) {
      if (item) {
        item.layout(offset)
        offset += item.size
      }
    }

    // Layout sashes
    for (const item of this.sashItems) item.sash.layout()
    this.updateSashEnablement()
  }

  private saveProportions(): void {
    if (this.proportionalLayout && this.contentSize > 0) {
      this.proportions = this.viewItems.map(i => i.size / this.contentSize)
    }
  }

  private relayout(lowPriorityIndexes?: number[], highPriorityIndexes?: number[]): void {
    const contentSize = this.viewItems.reduce((r, i) => r + i.size, 0)

    this.resize(
      this.viewItems.length - 1,
      this.size - contentSize,
      undefined,
      lowPriorityIndexes,
      highPriorityIndexes,
      Number.NEGATIVE_INFINITY,
      Number.POSITIVE_INFINITY,
    )

    this.distributeEmptySpace()
    this.layoutViews()
    this.saveProportions()
  }

  private getSashPosition(sash: Sash): number {
    // 首先尝试找到sash在数组中的位置
    let sashIndex = -1
    for (let i = 0; i < this.sashItems.length; i++) {
      if (this.sashItems[i].sash === sash) {
        sashIndex = i
        break
      }
    }

    // 如果找不到，可能是因为Proxy包装，尝试通过DOM元素查找
    if (sashIndex === -1) {
      const sashEl = (sash as any).el || sash
      if (sashEl) {
        for (let i = 0; i < this.sashItems.length; i++) {
          const itemSashEl = (this.sashItems[i].sash as any).el || this.sashItems[i].sash
          if (itemSashEl === sashEl) {
            sashIndex = i
            break
          }
        }
      }
    }

    if (sashIndex === -1) {
      return 0
    }

    // 计算位置：前面所有view的size之和
    let position = 0
    for (let i = 0; i <= sashIndex; i++) {
      if (this.viewItems[i]) {
        position += this.viewItems[i].size
      }
    }

    return position
  }

  private findFirstSnapIndex(indexes: number[]): number | undefined {
    for (const index of indexes) {
      const viewItem = this.viewItems[index]

      if (!viewItem.visible) {
        continue
      }

      if (viewItem.snap) {
        return index
      }
    }

    for (const index of indexes) {
      const viewItem = this.viewItems[index]

      if (viewItem.visible && viewItem.maximumSize - viewItem.minimumSize > 0) {
        return undefined
      }

      if (!viewItem.visible && viewItem.snap) {
        return index
      }
    }

    return undefined
  }

  private updateSashEnablement(): void {
    let previous = false

    const collapsesDown = this.viewItems.map(
      i => (previous = i.size - i.minimumSize > 0 || previous),
    )

    previous = false

    const expandsDown = this.viewItems.map(
      i => (previous = i.maximumSize - i.size > 0 || previous),
    )

    const reverseViews = [...this.viewItems].toReversed()

    previous = false

    const collapsesUp = reverseViews
      .map((i: any) => (previous = i.size - i.minimumSize > 0 || previous))
      .toReversed()

    previous = false

    const expandsUp = reverseViews
      .map((i: any) => (previous = i.maximumSize - i.size > 0 || previous))
      .toReversed()

    let position = 0

    for (let index = 0; index < this.sashItems.length; index++) {
      const { sash } = this.sashItems[index]
      const viewItem = this.viewItems[index]

      position += viewItem.size

      const min = !(collapsesDown[index] && expandsUp[index + 1])
      const max = !(expandsDown[index] && collapsesUp[index + 1])

      if (min && max) {
        const upIndexes = range(index, -1, -1)
        const downIndexes = range(index + 1, this.viewItems.length)
        const snapBeforeIndex = this.findFirstSnapIndex(upIndexes)
        const snapAfterIndex = this.findFirstSnapIndex(downIndexes)

        const snappedBefore
          = typeof snapBeforeIndex === 'number'
          && !this.viewItems[snapBeforeIndex].visible

        const snappedAfter
          = typeof snapAfterIndex === 'number'
          && !this.viewItems[snapAfterIndex].visible

        if (
          snappedBefore
          && collapsesUp[index]
          && (position > 0 || this.startSnappingEnabled)
        ) {
          sash.state = SashState.Minimum
        }
        else if (
          snappedAfter
          && collapsesDown[index]
          && (position < this.contentSize || this.endSnappingEnabled)
        ) {
          sash.state = SashState.Maximum
        }
        else {
          sash.state = SashState.Disabled
        }
      }
      else if (min && !max) {
        sash.state = SashState.Minimum
      }
      else if (!min && max) {
        sash.state = SashState.Maximum
      }
      else {
        sash.state = SashState.Enabled
      }
    }
  }
}
