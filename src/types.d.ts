declare module 'marzipano' {
  /*****************
   **** Classes ***
   *****************/

  /**
   * ControlComposer
   */
  export class ControlComposer {}

  /**
   * ControlCursor
   */
  export class ControlCursor {
    constructor(
      controls: Controls,
      id: string,
      element: HTMLElement,
      opts?: ControlCursorOptions
    )
  }

  export interface ControlCursorOptions {
    /**
     * @default 'move'
     */
    active?: string
    /**
     * @default 'default'
     */
    inactive?: string
    /**
     * @default 'default'
     */
    disabled?: string
  }

  /**
   * Controls
   */
  export class Controls {
    addMethodGroup(groupId: string, methodIds: string): void

    attach(renderLoop: RenderLoop): void

    attached(): boolean

    destroy(): void

    detach(): void

    disable(): void

    disableMethod(id: string): void

    disableMethodGroup(groupId: string): void

    enable(): void

    enabled(): boolean

    enableMethod(id: string): void

    enableMethodGroup(groupId: string): void

    method(id: string): ControlMethod

    methodGroups(): ControlMethod[]

    methods(): ControlMethod[]

    registerMethod(id: string, instance: ControlMethod, enable?: boolean): void

    removeMethodGroup(groupId: string): void

    unregisterMethod(id: string): void
  }

  /**
   * CubeGeometry
   */
  export class CubeGeometry extends Geometry {
    constructor(levelPropertiesList: { size: number; tileSize: number }[])
  }

  /**
   * CubeTile
   */
  export class CubeTile implements Tile {
    cmp(that: Tile): number

    equals(that: Tile): boolean

    hash(): number
  }

  /**
   * DragControlMethod
   */
  export class DragControlMethod {
    constructor(
      element: HTMLElement,
      pointerType: string,
      opts?: { friction?: number; maxFrictionTime?: number }
    )
  }

  /**
   * DynamicAsset
   */
  export class DynamicAsset extends StaticAsset {}

  /**
   * Dynamics
   */
  export class Dynamics {
    offset: number
    velocity: number
    friction: number
  }

  /**
   * ElementPressControlMethod
   */
  export class ElementPressControlMethod {
    constructor(
      element: HTMLElement,
      parameter: string,
      velocity: number,
      friction: number
    )

    destroy(): void
  }

  export interface ElementPressControlMethodInterface
    extends ElementPressControlMethod {}

  /**
   * EquirectGeometry
   */
  export class EquirectGeometry extends Geometry {
    constructor(levelPropertiesList: { width: number }[])

    type: 'equirect'
  }

  /**
   * EquirectTile
   */
  export class EquirectTile implements Tile {
    cmp(that: Tile): number

    equals(that: Tile): boolean

    hash(): number
  }

  /**
   * FlatGeometry
   */
  export class FlatGeometry extends Geometry {
    constructor(
      levelPropertiesList: {
        width: number
        tileWidth: number
        height: number
        tileHeight: number
      }[]
    )

    type: 'flat'
  }

  /**
   * FlatTile
   */
  export abstract class FlatTile implements Tile {
    cmp(that: Tile): number

    equals(that: Tile): boolean

    hash(): number
  }

  /**
   * FlatView
   */
  export abstract class FlatView implements View {
    constructor(params: FlatViewParams, limiter?: FlatViewLimiter)

    type: 'flat'

    coordinatesToScreen(coords: Coords, result?: Coords): Coords

    limiter(): null | FlatViewLimiter

    mediaAspectRatio(): number

    offsetX(xOffset: number): void

    offsetY(xOffset: number): void

    offsetZoom(zoomOffset: number): void

    parameters(opts?: FlatViewParams): FlatViewParams

    screenToCoordinates(coords: Coords, result?: Coords): Coords

    setLimiter(limiter: FlatViewLimiter): void

    setMediaAspectRatio(mediaAspectRatio: number): void

    setParameters(params: FlatViewParams): void

    setX(x: number): void

    setY(y: number): void

    setZoom(zoom: number): void

    x(): number

    y(): number

    zoom(): number

    destroy(): void

    height(): number

    intersects(rectangle: [number, number][]): boolean

    inverseProjection(): Array<number>

    projection(): [number, number, number, number]

    selectLevel(levelList: number[]): number

    setSize(size: Size): void

    size(size?: Size): Size

    width(): number

    pitch(): number

    yaw(): number
  }

  interface FlatViewParams extends Coords {
    zoom?: number
    mediaAspectRation: number
  }

  type FlatViewLimiter = (params: FlatViewParams) => FlatViewParams

  /**
   * HammerGestures
   */
  export abstract class HammerGestures {}

  /**
   * Hotspot
   */
  export abstract class Hotspot {
    constructor(
      domElement: HTMLElement,
      view: View,
      coords: RectilinearCoords,
      opts: HotspotOptions
    )

    destroy(): void

    domElement(): HTMLElement

    perspective(): Perspective

    position(): RectilinearCoords

    setPerspective(perspective: Perspective): void

    setPosition(coords: RectilinearCoords): void

    show(): void
  }

  export interface HotspotOptions {
    perspective?: Perspective
  }

  /**
   * HotspotContainer
   */
  export class HotspotContainer {
    constructor(
      parentDomElement: HTMLElement,
      stage: Stage,
      view: View,
      renderLoop: RenderLoop,
      opts?: { rect?: RectSpec }
    )

    createHotspot(
      domElement: HTMLElement,
      coords?: RectilinearCoords,
      opts?: HotspotOptions
    ): Hotspot

    destroy(): void

    destroyHotspot(hotspot: Hotspot): void

    domElement(): HTMLElement

    hasHotspot(hotspot: Hotspot): boolean

    hide(): void

    listHotspots(): Hotspot[]

    rect(): Rect

    setRect(rect: Rect): void

    show(): void
  }

  /**
   * HtmlImageLoader
   */
  export class HtmlImageLoader {
    constructor(stage: Stage)

    loadImage(url: string, rect?: Rect, done?: Function)
  }

  export interface HtmlImageLoaderInteface extends HtmlImageLoader {}

  /**
   * ImageUrlSource
   */
  export class ImageUrlSource implements Source {
    constructor(
      sourceFromTile: (tile: Tile) => { url: string; rect?: Rect },
      opts?: { concurrency?: number; retryDelay?: number }
    )

    static fromString: (
      url: string,
      options?: {
        cubeMapPreviewFaceOrder?: string
        cubeMapPreviewUrl?: string
        retryDelay?: number
      }
    ) => ImageUrlSource

    loadAsset(stage: Stage, tile: Tile, done: Function): Function

    addEventListener(event: Event, callback: Function)

    removeEventListener(event: Event, callback: Function)
  }

  /**
   * KeyControlMethod
   */
  export class KeyControlMethod {
    constructor(
      keyCode: number,
      parameter: string,
      velocity: number,
      friction: number,
      element?: HTMLElement
    )

    destroy(): void
  }

  /**
   * Layer
   */
  export class Layer {
    constructor(
      source: Source,
      geometry: Geometry,
      view: View,
      textureStore: TextureStore,
      opts?: LayerOptions
    )

    destroy(): void

    effects(): Effects

    fixedLevel(): number | null

    geometry(): Geometry

    mergeEffects(effects: Effects): void

    pinFirstLevel(): void

    setEffects(effects: Effects): void

    setFixedLevel(levelIndex: number | null): void

    source(): Source

    textureStore(): TextureStore

    unpinFirstLevel(): void

    unpinLevel(levelIndex: number | null): void

    view(): View

    addEventListener(event: Event, callback: Function)

    removeEventListener(event: Event, callback: Function)
  }

  export interface LayerInteface extends Layer {}

  interface LayerOptions {
    effects?: Effects
  }

  /**
   * NetworkError
   */
  export class NetworkError {}

  /**
   * PinchZoomControlMethod
   */
  export class PinchZoomControlMethod {
    constructor(element: HTMLElement, pointerType: string, opts: any)
  }

  export interface PinchZoomControlMethodInterface
    extends PinchZoomControlMethod {}

  /**
   * PinchZoomControlMethod
   */
  export class QtvrControlMethod {
    constructor(
      element: HTMLElement,
      pointerType: string,
      opts: { speed?: number; friction?: number; maxFrictionTime?: number }
    )

    destroy(): void
  }

  /**
   * RectilinearView
   */
  export class RectilinearView implements View {
    constructor(
      params?: RectilinearViewParams,
      limiter?: RectilinearViewLimiter
    )

    destroy(): void

    height(): number

    intersects(rectangle: [number, number][]): boolean

    inverseProjection(): number[]

    projection(): [number, number, number, number]

    selectLevel(levelList: number[]): number

    size(size?: Size): Size

    setSize(size: Size): void

    width(): number

    type: 'rectilinear'

    coordinatesToPerspectiveTransform(
      coords: RectilinearViewCoords,
      radius: number,
      extraTransforms: string
    ): string

    coordinatesToScreen(coords: Coords, result?: Coords): Coords

    fov(): number

    limiter(): null | RectilinearViewLimiter

    normalizeToClosest(
      coords: RectilinearCoords,
      result?: RectilinearCoords
    ): void

    offsetFov(fovOffset: number): void

    offsetPitch(pitchOffset: number): void

    offsetRoll(rollOffset: number): void

    offsetYaw(yawOffset: number): void

    parameters(opts?: RectilinearViewParams): RectilinearViewParams

    pitch(): number

    screenToCoordinates(
      coords: Coords,
      opts?: RectilinearCoords
    ): RectilinearCoords

    setFov(fov: number): void

    setLimiter(limiter: RectilinearViewLimiter): void

    setYaw(yaw: number): void

    yaw(): number

    setParameters(params: RectilinearViewParams): void

    static limit: Limit
  }

  class Limit {
    hfov(min: number, max: number): RectilinearViewLimiter

    pitch(min: number, max: number): RectilinearViewLimiter

    resolution(size: number): RectilinearViewLimiter

    roll(min: number, max: number): RectilinearViewLimiter

    traditional(
      maxResolution: number,
      maxVFov: number,
      maxHFov?: number
    ): RectilinearViewLimiter

    vfov(min: number, max: number): RectilinearViewLimiter

    yaw(min: number, max: number): RectilinearViewLimiter
  }

  export interface RectilinearViewParams extends RectilinearCoords {
    roll?: number
    fov?: number
  }

  export type RectilinearViewLimiter = (
    params: RectilinearViewParams
  ) => RectilinearViewParams

  /**
   * RendererRegistry
   */
  export class RendererRegistry {
    get(geometryType: string, viewType: String, renderer: Renderer): void

    set(geometryType: string, viewType: String, renderer: Renderer): void
  }

  /**
   * RenderLoop
   */
  export class RenderLoop {
    constructor(stage: Stage)

    destroy(): void

    renderOnNextFrame(): void

    stage(): Stage

    start(): void

    stop(): void
  }

  /**
   * Scene
   */
  export class Scene {
    constructor(viewer: Viewer, view: View)

    createLayer(opts?: {
      source: Source
      geometry: Geometry
      pinFirstLevel?: boolean
      textureStoreOpts?: TextureStoreOptions
      layerOpts?: LayerOptions
    }): Layer

    destroy(): void

    destroyAllLayers(): void

    destroyLayer(layer: Layer): void

    hotspotContainer(): HotspotContainer

    layer(): Layer

    viewer(): Viewer

    listLayers(): Layer[]

    lookTo(params: LookToParams, opts?: LookToOptions, done?: Function): void

    movement(): Function

    startMovement(fn: Function, done?: Function): void

    stopMovement(): void

    switchTo(opts?: SwitchSceneOptions, done?: Function): void

    view(): View

    viewer(): Viewer

    visibled(): boolean

    addEventListener(event: Event, callback: Function)
    removeEventListener(event: Event, callback: Function)
  }

  /**
   * ScrollZoomControlMethod
   */
  export class ScrollZoomControlMethod {
    constructor(
      element?: HTMLElement,
      opts?: { fictionTime?: number; zoomDelta?: number }
    )

    destroy(): void
  }

  export interface ScrollZoomControlMethodInterface
    extends ScrollZoomControlMethod {}

  /**
   * SingleAssetSource
   */
  export class SingleAssetSource {
    constructor(asset: Asset)

    loadAsset(stage: Stage, tile: Tile, done?: Function): void
  }

  /**
   * StaticAsset
   */
  export class StaticAsset implements Asset {
    constructor(element: HTMLElement)

    element(): HTMLElement

    height(): number

    isDynamic(): false

    timestamp(): number

    width(): number
  }

  /**
   * TextureStore
   */
  export class TextureStore {
    constructor(source: Source, stage: Stage, opts?: TextureStoreOptions)

    clear(): void

    clearNotPinned(): void

    destroy(): void

    endFrame(): void

    markTile(tile: Tile): void

    pin(tile: Tile): number

    query(tile: Tile): any

    source(): Source

    stage(): Stage

    startFrame(): void

    unpin(tile: Tile): number
  }

  export interface TextureStoreOptions {
    previouslyVisibleCacheSize?: number
  }

  /**
   * TextureStore
   */
  export class TextureStoreItem {
    constructor(store: TextureStore, tile: Tile)
  }

  /**
   * TileSearcher
   */
  export class TileSearcher {
    search(view: View, tile: Tile, result: Tile[]): number
  }

  /**
   * Timer
   */
  export class Timer {
    constructor(opts?: { duration?: number })

    duration(): number

    start(): number

    started(): boolean

    stop(): boolean
  }

  /**
   * VelocityControlMethod
   */
  export class VelocityControlMethod {
    constructor(parameter: string)

    destroy(): boolean

    setFriction(friction: number): void

    setVelocity(velocity: number): void
  }

  export interface VelocityControlMethodInterface
    extends VelocityControlMethod {}

  /**
   * VelocityControlMethod
   */
  export class Viewer {
    constructor(domElement: HTMLElement, opts?: ViewerOptions)

    breakIdleMovement(): void

    controls(): Controls

    createEmptyScene(opts: { view: View }): Scene

    createScene(opts: CreateSceneOptions): Scene

    destroy(): void

    destroyAllScenes(): void

    destroyScene(scene: Scene): void

    domElement(): HTMLElement

    hasScene(scene: Scene): boolean

    listScenes(): Scene[]

    lookTo(opts?: LookToOptions, done?: Function): void

    movement(): Function

    renderLoop(): RenderLoop

    scene(): Scene
    stage(): Stage

    setIdleMovement(timeout: number, movement?: Function): void

    startMovement(fn: Function, done?: Function): void

    stopMovement(): void

    switchScene(
      newScene: Scene,
      opts?: { transitionDuration?: number; transitionUpdate?: number },
      done?: Function
    ): void

    updateSize(): void

    view(): View
  }

  export interface VelocityControlMethodInterface
    extends VelocityControlMethod {}

  export interface ViewerOptions {
    controls?: any
    stage?: Stage
    cursors?: {
      drag?: ControlCursorOptions
    }
  }

  export interface CreateSceneOptions {
    view: View
    source: Source
    geometry: Geometry
    pinFirstLevel?: boolean
    textureStoreOpts?: TextureStoreOptions
    layerOpts?: LayerOptions
  }

  /**
   * WebGlCubeRenderer
   */
  export class WebGlCubeRenderer implements Renderer {}

  /**
   * WebGlEquirectRenderer
   */
  export class WebGlEquirectRenderer implements Renderer {
    endLayer(layer: Layer, rect: Rect): void

    renderTile(tile: Tile, texture: any, layer: Layer, layerZ: number): void

    startLayer(layer: Layer, rect: Rect): void
  }

  export interface WebGlEquirectRendererInterface
    extends WebGlEquirectRenderer {}

  /**
   * WebGlFlatRenderer
   */
  export class WebGlFlatRenderer implements Renderer {}

  /**
   * WebGlStage
   */
  export class WebGlStage implements Stage {
    constructor(opts: {
      antialias?: boolean
      preserveDrawingBuffer?: boolean
      generateMipmaps?: boolean
      wrapContext?: boolean
    })

    addLayer(layer: Layer, i?: number): void

    createTexture(tile: Tile, asset: Asset, done?: Function): void

    destroy(): void

    domElement(): HTMLElement

    endFrame(): void

    hasLayer(layer: Layer): boolean

    height(): number

    listLayers(): Layer[]

    loadImage(url: string, rect?: Rect, done?: Function): void

    moveLayer(layer: Layer, i: number)

    registerRenderer(geometryType: string, viewType: string, Renderer: any)

    removeAllLayers(): void

    removeLayer(layer: Layer): void

    render(): void

    setSize(size: Size): void

    setSizeForType(size): void

    size(size?: Size): Size

    startFrame(): void

    validateLayer(layer: Layer): void

    width(): number

    addEventListener(event: Event, callback: Function)

    removeEventListener(event: Event, callback: Function)
  }

  export interface WebGlStageStage extends WebGlStage {}

  /***************************
   **** Generic Interfaces ***
   ***************************/

  /**
   * Renderer
   */
  export type Renderer = any

  /**
   * ControlMethod
   */
  export type ControlMethod = any

  /**
   * Coords
   */
  export interface Coords {
    x: number
    y: number
  }

  /**
   * Geometry
   */
  export abstract class Geometry {
    type: 'cube' | 'equirect' | 'flat'

    visibleTiles(view: View, level: any): Tile[]
  }

  /**
   * Perspective
   */
  export interface Perspective {
    radius?: number
    extraTransforms: string
  }

  /**
   * Rect
   */
  export interface Rect extends Coords, Size {}

  /**
   * Source
   */
  export interface Source {
    loadAsset(stage: Stage, tile: Tile, done: Function): Function
    addEventListener(event: Event, callback: Function)
    removeEventListener(event: Event, callback: Function)
  }

  /**
   * Effects
   */
  export interface Effects {
    opacity?: number
    rect?: RectSpec
    colorOffset?: any
    colorMatrix?: any
    textureCrop?: Rect
  }

  /**
   * RectSpec
   */
  interface RectSpec {
    relativeX: number
    relativeY: number
    relativeWidth: number
    relativeHeight: number
    absoluteX: number
    absoluteY: number
    absoluteWidth: number
    absoluteHeight: number
  }

  /**
   * LookTo
   */
  type LookToParams = RectilinearCoords | RectilinearCoords

  interface LookToOptions {
    ease?: Function
    controlsInterrups?: number
    transitionDuration?: number
    closest?: number
  }

  /**
   * Switch Scene
   */
  interface SwitchSceneOptions {
    transitionDuration?: number
    transitionUpdate?: number
  }

  /**
   * RectilinearCoords
   */
  interface RectilinearCoords {
    yaw: number
    pitch: number
  }

  /**
   * Size
   */
  interface Size {
    width: number
    height: number
  }

  /**
   * View
   */
  export interface View {
    type: 'rectilinear' | 'flat'

    destroy(): void

    height(): number

    intersects(rectangle: [number, number][]): boolean

    inverseProjection(): Array<number>

    projection(): [number, number, number, number]

    selectLevel(levelList: number[]): number

    size(size?: Size): Size

    setSize(size: Size): void

    width(): number

    pitch(): number

    yaw(): number
  }

  /**
   * Tile
   */
  interface Tile {
    cmp(that): number

    equals(that): boolean

    hash(): number
  }

  /**
   * Stage
   */
  export interface Stage {
    addLayer(layer: Layer, i?: number): void

    createTexture(tile: Tile, asset: Asset, done?: Function): void

    destroy(): void

    domElement(): HTMLElement

    endFrame(): void

    hasLayer(layer: Layer): boolean

    height(): number

    listLayers(): Layer[]

    loadImage(url: string, rect?: Rect, done?: Function): void

    moveLayer(layer: Layer, i: number)

    registerRenderer(geometryType: string, viewType: string, Renderer: any)

    removeAllLayers(): void

    removeLayer(layer: Layer): void

    render(): void

    setSize(size: Size): void

    /**
     *
     * @deprecated Call Stage#setSize instead
     */
    setSizeForType(size): void

    size(size?: Size): Size

    startFrame(): void

    validateLayer(layer: Layer): void

    width(): number

    addEventListener(event: Event, callback: Function)
    removeEventListener(event: Event, callback: Function)
  }

  /**
   * Asset
   */
  export interface Asset {
    element(): any

    height(): number

    isDynamic(): boolean

    timestamp(): number

    width(): number
  }

  /**
   * Events
   */
  type Event =
    | 'active'
    | 'inactive'
    | 'parameterDynamics'
    | 'hotspotsChange'
    | 'afterRender'
    | 'beforeRender'
    | 'layerChange'
    | 'networkError'
    | 'textureCancel'
    | 'textureError'
    | 'textureInvalid'
    | 'textureLoad'
    | 'textureStartLoad'
    | 'textureUnload'
    | 'timeout'
    | 'change'
    | 'resize'
    | 'sceneChange'
    | 'viewChange'
    | 'renderComplete'
    | 'renderInvalid'

  /**
   * Global
   */
  export interface autorotateOptions {
    /**
     * @default 0.1
     */
    yawSpeed?: number
    /**
     * @default 0.1
     */
    pitchSpeed?: number
    /**
     * @default 0.1
     */
    fovSpeed?: number
    /**
     * @default 0.01
     */
    yawAccel?: number
    /**
     * @default 0.01
     */
    pitchAccel?: number
    /**
     * @default 0.01
     */
    fovAccel?: number
    /**
     * @default 0
     */
    targetPitch?: number
    targetFov?: number
  }

  export function autorotate(options: autorotateOptions): Function

  export type Dependencies = {
    eventEmitter: (method: Function) => {}
  }
  export const dependencies: Dependencies
}
