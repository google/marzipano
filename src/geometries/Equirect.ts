import hash from "../util/hash";
import cmp from "../util/cmp";
import common from "./common";
import Level from "./Level";
import type from "../util/type";


/**
 * @class EquirectTile
 * @implements Tile
 * @classdesc
 *
 * A tile in an @{EquirectGeometry}.
 */
class EquirectTile {
  z: any;
  _geometry: any;
  _level: any;
  static type: string;

  constructor(z, geometry) {
    this.z = z;
    this._geometry = geometry;
    this._level = geometry.levelList[z];
  }
  rotX() {
    return 0;
  }
  rotY() {
    return 0;
  }
  centerX() {
    return 0.5;
  }
  centerY() {
    return 0.5;
  }
  scaleX() {
    return 1;
  }
  scaleY() {
    return 1;
  }
  parent() {
    if (this.z === 0) {
      return null;
    }
    return new EquirectTile(this.z - 1, this._geometry);
  }
  children(result) {
    if (this.z === this._geometry.levelList.length - 1) {
      return null;
    }
    result = result || [];
    result.push(new EquirectTile(this.z + 1, this._geometry));
    return result;
  }
  neighbors() {
    return [];
  }
  hash() {
    return hash(this.z);
  }
  equals(that) {
    return this._geometry === that._geometry && this.z === that.z;
  }
  cmp(that) {
    return cmp(this.z, that.z);
  }
  str() {
    // @ts-ignore
    return 'EquirectTile(' + tile.z + ')';
  }
}

class EquirectLevel extends Level {
  _width: any;
  constructor(levelProperties) {
    super(levelProperties);
    this._width = levelProperties.width;
  }
  width() {
    return this._width;
  }
  height() {
    return this._width / 2;
  }
  tileWidth() {
    return this._width;
  }
  tileHeight() {
    return this._width / 2;
  }
}

/**
 * @class EquirectGeometry
 * @implements Geometry
 * @classdesc
 *
 * A {@link Geometry} implementation suitable for equirectangular images with a
 * 2:1 aspect ratio.
 *
 * @param {Object[]} levelPropertiesList Level description
 * @param {number} levelPropertiesList[].width Level width in pixels
*/
class EquirectGeometry {
  levelList: any[];
  selectableLevelList: any[];
  static Tile: typeof EquirectTile;
  static type: string;
  constructor(levelPropertiesList) {
    if (type(levelPropertiesList) !== 'array') {
      throw new Error('Level list must be an array');
    }

    this.levelList = common.makeLevelList(levelPropertiesList, EquirectLevel);
    this.selectableLevelList = common.makeSelectableLevelList(this.levelList);
  }
  maxTileSize() {
    var maxTileSize = 0;
    for (var i = 0; i < this.levelList.length; i++) {
      var level = this.levelList[i];
      maxTileSize = Math.max(maxTileSize, level.tileWidth, level.tileHeight);
    }
    return maxTileSize;
  }
  levelTiles(level, result) {
    var levelIndex = this.levelList.indexOf(level);
    result = result || [];
    result.push(new EquirectTile(levelIndex, this));
    return result;
  }
  visibleTiles(_view, level, result) {
    var tile = new EquirectTile(this.levelList.indexOf(level), this);
    result = result || [];
    result.length = 0;
    result.push(tile);
  }
}

// @ts-ignore
EquirectGeometry.Tile = EquirectGeometry.prototype.Tile = EquirectTile;
// @ts-ignore
EquirectGeometry.type = EquirectGeometry.prototype.type = 'equirect';
// @ts-ignore
EquirectTile.type = EquirectTile.prototype.type = 'equirect';


export default EquirectGeometry;
