declare module 'marzipano' {
  /*****************
   **** Classes ***
   *****************/

  /**
   * ControlComposer
   */
  export class ControlComposer {}
  export interface ControlComposerInterface extends ControlComposer {}

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
  export interface ControlCursorInterface extends ControlCursor {}

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
    enableMethodGroup(groupId): void
    method(id: string): ControlMethod
    methodGroups(): ControlMethod[]
    methods(): ControlMethod[]
    registerMethod(id: string, instance: ControlMethod, enable?: boolean): void
    removeMethodGroup(groupId: string): void
    unregisterMethod(id: string): void
  }
  export interface ControlsInterface extends Controls {}

  /**
   * CubeGeometry
   */
  export class CubeGeometry extends Geometry {
    constructor(levelPropertiesList: { size: number; tileSize: number }[])
  }
  export interface CubeGeometryInterface extends CubeGeometry {}

  /**
   * CubeTile
   */
  export class CubeTile implements Tile {
    cmp(that): number
    equals(that): boolean
    hash(): number
  }
  export interface CubeTileInterface extends CubeTile {}

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
  export interface DragControlMethodInterface extends DragControlMethod {}

  /**
   * DynamicAsset
   */
  export class DynamicAsset extends StaticAsset {}
  export interface DynamicAssetInterface extends DynamicAsset {}

  /**
   * Dynamics
   */
  export class Dynamics {
    offset: number
    velocity: number
    friction: number
  }
  export interface DynamicsInterface extends Dynamics {}

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
  export interface EquirectGeometryInterface extends EquirectGeometry {}

  /**
   * EquirectTile
   */
  export class EquirectTile implements Tile {
    cmp(that): number
    equals(that): boolean
    hash(): number
  }
  export interface EquirectTileInterface extends EquirectTile {}

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
  export interface FlatGeometryInterface extends FlatGeometry {}

  /**
   * FlatTile
   */
  export abstract class FlatTile implements Tile {
    cmp(that): number
    equals(that): boolean
    hash(): number
  }
  export interface FlatTileInterface extends FlatTile {}

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
  }
  export interface FlatViewInterface extends FlatView {}

  interface FlatViewParams extends Coords {
    zoom?: number
    mediaAspectRation: number
  }
  type FlatViewLimiter = (params: FlatViewParams) => FlatViewParams

  /**
   * HammerGestures
   */
  export abstract class HammerGestures {}
  export interface HammerGesturesInterface extends HammerGestures {}

  /**
   * Hotspot
   */
  export abstract class Hotspot {
    constructor(
      domElement: HTMLElement,
      view: View,
      coords: Coords,
      opts: HotspotOptions
    )
    destroy(): void
    domElement(): HTMLElement
    perspective(): Perspective
    position(): Coords
    setPerspective(perspective: Perspective): void
    setPosition(coords: Coords): void
    show(): void
  }
  export interface HotspotInterface extends Hotspot {}

  export interface HotspotOptions {
    perspective?: Perspective
  }

  /**
   * HotspotContainer
   */
  export class HotpsotContainer {
    constructor(
      parentDomElement: HTMLElement,
      stage: Stage,
      view: View,
      renderLoop: RenderLoop,
      opts?: { rect?: RectSpec }
    )
    createHotspot(
      domElement: HTMLElement,
      coords: Coords,
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
  export interface HotpsotContainerInterface extends HotpsotContainer {}

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
  }
  export interface ImageUrlSourceInterface extends ImageUrlSource {}

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
  export interface KeyControlMethodInterface extends KeyControlMethod {}

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
    setEffect(effects: Effects): void
    setFixedLevel(levelIndex: number | null): void
    source(): Source
    textureStore(): TextureStore
    unpinFirstLevel(): void
    unpinLevel(levelIndex: number | null): void
    view(): View
  }
  export interface LayerInteface extends Layer {}

  interface LayerOptions {
    effects?: Effects
  }

  /**
   * NetworkError
   */
  export class NetworkError {}
  export interface NetworkErrorInterface extends NetworkError {}

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
  export interface QtvrControlMethodInterface extends QtvrControlMethod {}

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
    coordinatesToPerspectiveTransform(coords, radius, extraTransforms): string
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
  }
  export interface RectilinearViewInterface extends RectilinearView {}

  export interface RectilinearViewParams extends RectilinearCoords {
    roll: number
    fov: number
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
  export interface RendererRegistryInterface extends RendererRegistry {}

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
  export interface RenderLoopInterface extends RenderLoop {}

  /**
   * Scene
   */
  export class Scene {
    constructor(viewer: Viewer, view: View)
    createLayer(opts?: {
      source: Source
      geometry: Source
      pinFirstLevel?: boolean
      textureStoreOpts?: TextureStoreOptions
      layerOpts?: LayerOptions
    }): Layer
    destroy(): void
    destroyAllLayers(): void
    destroyLayer(layer: Layer): void
    hotspotContainer(): Layer
    layer(): Layer
    listLayers(): Layer[]
    lookTo(params: LookToParams, opts?: LookToOptions, done?: Function): void
    movement(): Function
    startMovement(fn: Function, done?: Function): void
    stopMovement(): void
    switchTo(opts?: SwitchSceneOptions, done?: Function): void
    view(): View
    viewer(): Viewer
    visibled(): boolean
  }
  export interface SceneInterface extends Scene {}

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
  export interface SingleAssetSourceInterface extends SingleAssetSource {}

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
  export interface SingleAssetSourceInterface extends SingleAssetSource {}

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
  export interface TextureStoreInterface extends TextureStore {}

  export interface TextureStoreOptions {
    previouslyVisibleCacheSize?: number
  }

  /**
   * TextureStore
   */
  export class TextureStoreItem {
    constructor(store: TextureStore, tile: Tile)
  }
  export interface TextureStoreItemInterface extends TextureStoreItem {}

  /**
   * TileSearcher
   */
  export class TileSearcher {
    search(view: View, tile: Tile, result: Tile[]): number
  }
  export interface TileSearcherInterface extends TileSearcher {}

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
  export interface TimerInterface extends Timer {}

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
  export interface WebGlCubeRendererInterface extends WebGlCubeRenderer {}

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
  export interface WebGlFlatRendererInterface extends WebGlFlatRenderer {}

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
    visibleTiles(view: View, level: Level): Tile[]
  }
  export interface GeometryInterface extends Geometry {}

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
  }

  /**
   * Effects
   */
  export interface Effects {
    opacity: number
    rect: RectSpec
    colorOffset: any
    colorMatrix: any
    textureCrop: Rect
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
  interface Stage {
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
}
