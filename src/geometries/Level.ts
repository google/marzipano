class Level {
  _fallbackOnly: boolean;
  constructor(levelProperties) {
    this._fallbackOnly = !!levelProperties.fallbackOnly;
  }
  numHorizontalTiles() {
    // @ts-ignore
    return Math.ceil(this.width() / this.tileWidth());
  }
  width() {
    throw new Error("Method not implemented.");
  }
  tileWidth() {
    throw new Error("Method not implemented.");
  }
  numVerticalTiles() {
    // @ts-ignore
    return Math.ceil(this.height() / this.tileHeight());
  }
  height() {
    throw new Error("Method not implemented.");
  }
  tileHeight() {
    throw new Error("Method not implemented.");
  }
  fallbackOnly() {
    return this._fallbackOnly;
  }
}

export default Level;