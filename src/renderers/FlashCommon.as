/*
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package {

  import flash.display.Bitmap;
  import flash.display.BitmapData;
  import flash.display.BlendMode;
  import flash.display.Loader;
  import flash.display.Sprite;
  import flash.display.StageAlign;
  import flash.display.StageScaleMode;
  import flash.events.ErrorEvent;
  import flash.events.Event;
  import flash.events.IOErrorEvent;
  import flash.events.UncaughtErrorEvent;
  import flash.external.ExternalInterface;
  import flash.geom.Matrix;
  import flash.geom.Matrix3D;
  import flash.geom.PerspectiveProjection;
  import flash.geom.Point;
  import flash.geom.Rectangle;
  import flash.geom.Vector3D;
  import flash.net.URLRequest;
  import flash.system.LoaderContext;
  import flash.system.Security;
  import flash.utils.Dictionary;
  import mx.graphics.codec.JPEGEncoder;
  import mx.utils.Base64Encoder;

  public class FlashCommon extends Sprite {

    private var initialized:Boolean = false;

    private var imageLoadedCallback:String = null;

    public function FlashCommon() {

      // Install event handler for uncaught errors.
      loaderInfo.uncaughtErrorEvents.addEventListener(
          UncaughtErrorEvent.UNCAUGHT_ERROR, handleError);

      // Declare external interface.
      ExternalInterface.marshallExceptions = true
      ExternalInterface.addCallback('isReady', isReady);
      ExternalInterface.addCallback('createLayer', createLayer);
      ExternalInterface.addCallback('destroyLayer', destroyLayer);
      ExternalInterface.addCallback('loadImage', loadImage);
      ExternalInterface.addCallback('cancelImage', cancelImage);
      ExternalInterface.addCallback('unloadImage', unloadImage);
      ExternalInterface.addCallback('createTexture', createTexture);
      ExternalInterface.addCallback('destroyTexture', destroyTexture);
      ExternalInterface.addCallback('drawCubeTiles', drawCubeTiles);
      ExternalInterface.addCallback('drawFlatTiles', drawFlatTiles);
      ExternalInterface.addCallback('takeSnapshot', takeSnapshot);

      var callbacksObjName:String = loaderInfo.parameters.callbacksObjName as String;
      imageLoadedCallback = callbacksObjName + '.imageLoaded';

      Security.allowDomain("*");

      if (stage) {
        init();
      } else {
        addEventListener(Event.ADDED_TO_STAGE, init);
      }

    }

    private function handleError(event:UncaughtErrorEvent):void {
      var message:String;
      if (event.error is Error) {
        message = Error(event.error).message;
      } else if (event.error is ErrorEvent) {
        message = ErrorEvent(event.error).text;
      } else {
        message = event.error.toString();
      }
      debug('ERROR: ' + message);
    };

    private function debug(str:String):void {
      ExternalInterface.call('console.log', str);
    }

    public function isReady():Boolean {
      return initialized;
    }

    private function init():void {
      removeEventListener(Event.ADDED_TO_STAGE, init);
      stage.scaleMode = StageScaleMode.NO_SCALE;
      stage.align = StageAlign.TOP_LEFT;
      stage.frameRate = 60;
      initialized = true;
    }

    private function convertFov(fov:Number, thisDimension:Number, otherDimension:Number):Number {
      return 2 * Math.atan(otherDimension * Math.tan(fov / 2) / thisDimension);
    }

    private function getLayer(id:Number):Sprite {
      if (id in layerMap) {
        return layerMap[id];
      }
      return null;
    }

    public function createLayer(id: Number):void {
      if (id in layerMap) {
        debug('createLayer: ' + id + ' already exists');
        return;
      }

      var layer:Sprite = new Sprite();

      layerMap[id] = layer;
      layer.transform.perspectiveProjection = new PerspectiveProjection();
      layer.blendMode = BlendMode.LAYER;
      addChild(layer);
    }

    public function destroyLayer(id:Number):void {
      if (!(id in layerMap)) {
        debug('destroyLayer: ' + id + ' does not exist');
        return;
      }
      var layer:Sprite = layerMap[id];

      while (layer.numChildren > 0) {
        layer.removeChildAt(0);
      }
      removeChild(layer);
      delete layerMap[id];
    }

    public function drawCubeTiles(layerId:Number, width:Number, height:Number, left:Number, top:Number, alpha:Number, yaw:Number, pitch:Number, roll:Number, fov:Number, tiles:Array):void {
      var layer:Sprite = getLayer(layerId);
      if (!layer) {
        debug('drawCubeTiles: layer ' + layerId + ' does not exist');
      }

      // Remove all current children.
      while (layer.numChildren > 0) {
        layer.removeChildAt(0);
      }

      // Set viewport.
      layer.x = left;
      layer.y = top;
      layer.scrollRect = new Rectangle(0, 0, width, height);

      // Set opacity.
      layer.alpha = alpha;

      // Set fov.
      // Don't really know why this needs to be done; magic number adjusted from
      // https://github.com/fieldOfView/CuTy/blob/master/com/fieldofview/cuty/CutyScene.as#L260
      var fieldOfView:Number = convertFov(fov, 1, 500/height);
      layer.transform.perspectiveProjection.fieldOfView = fieldOfView * 180/Math.PI;

      var projectionCenter:Point = new Point(width/2, height/2);
      layer.transform.perspectiveProjection.projectionCenter = projectionCenter;

      var focalLength:Number = layer.transform.perspectiveProjection.focalLength;

      var viewportCenter:Vector3D = new Vector3D(width/2, height/2, 0);
      var focalCenter:Vector3D = new Vector3D(width/2, height/2, -focalLength);

      for each (var t:Object in tiles) {
        var texture:Sprite = textureMap[t.textureId];
        if (!texture) {
          debug('drawCubeTiles: texture ' + t.textureId + ' does not exist');
        }

        var m:Matrix3D = new Matrix3D();

        // Set the perspective depth.
        m.appendTranslation(0, 0, -focalLength);

        // Center tile in viewport.
        var offsetX:Number = width/2 - t.width/2;
        var offsetY:Number = height/2 - t.height/2;
        m.appendTranslation(offsetX, offsetY, 0);

        // Set tile offset within cube face.
        var translX:Number = t.centerX * t.levelSize - t.padLeft;
        var translY:Number = -t.centerY * t.levelSize - t.padTop;
        var translZ:Number = t.levelSize / 2;
        m.appendTranslation(translX, translY, translZ);

        // Set cube face rotation.
        m.appendRotation(-t.rotY, Vector3D.Y_AXIS, focalCenter);
        m.appendRotation(t.rotX, Vector3D.X_AXIS, focalCenter);

        // Set camera rotation.
        var rotX:Number = pitch*180/Math.PI;
        var rotY:Number = -yaw*180/Math.PI;
        var rotZ:Number = -roll*180/Math.PI;
        m.appendRotation(rotY, Vector3D.Y_AXIS, focalCenter);
        m.appendRotation(rotX, Vector3D.X_AXIS, focalCenter);
        m.appendRotation(rotZ, Vector3D.Z_AXIS, focalCenter);

        texture.transform.matrix3D = m;

        layer.addChild(texture);
      }
    }

    public function drawFlatTiles(layerId:Number, width:Number, height:Number, left:Number, top:Number, alpha:Number, x:Number, y:Number, zoomX:Number, zoomY:Number, tiles:Array):void {
      var layer:Sprite = getLayer(layerId);
      if (!layer) {
        debug('drawFlatTiles: layer ' + layerId + ' does not exist');
      }

      // Remove all current children.
      while (layer.numChildren > 0) {
        layer.removeChildAt(0);
      }

      // Set viewport.
      layer.x = left;
      layer.y = top;
      layer.scrollRect = new Rectangle(0, 0, width, height);

      // Set opacity.
      layer.alpha = alpha;

      // Determine the zoom factor.
      zoomX = width / zoomX;
      zoomY = height / zoomY;

      for each (var t:Object in tiles) {
        var texture:Sprite = textureMap[t.textureId];
        if (!texture) {
          debug('drawFlatTiles: texture ' + t.textureId + ' does not exist');
        }

        var m:Matrix3D = new Matrix3D();

        // Scale tile into correct size.
        var scaleX:Number = zoomX / t.levelWidth;
        var scaleY:Number = zoomY / t.levelHeight;
        m.appendScale(scaleX, scaleY, 1);

        // Place top left corner of tile at the center of the viewport.
        var offsetX:Number = width/2;
        var offsetY:Number = height/2;
        m.appendTranslation(offsetX, offsetY, 0);

        // Move tile into its position within the image.
        var cornerX:Number = t.centerX - t.scaleX / 2 + 0.5;
        var cornerY:Number = 0.5 - t.centerY - t.scaleY / 2;
        var posX:Number = cornerX * zoomX;
        var posY:Number = cornerY * zoomY;
        m.appendTranslation(posX, posY, 0);

        // Compensate for padding around the tile.
        m.appendTranslation(-t.padLeft, -t.padTop, 0);

        // Apply view offsets.
        var translX:Number = -x * zoomX;
        var translY:Number = -y * zoomY;
        m.appendTranslation(translX, translY, 0);

        texture.transform.matrix3D = m;

        layer.addChild(texture);
      }
    }

    private var imageMap:Dictionary = new Dictionary();
    private var textureMap:Dictionary = new Dictionary();
    private var layerMap:Dictionary = new Dictionary();

    private var nextId:Number = 1;

    public function loadImage(url:String, width:Number, height:Number, x:Number, y:Number):Number {
      var id:Number = nextId++;

      var loader:Loader = new Loader();

      loader.contentLoaderInfo.addEventListener(Event.COMPLETE, loadSuccess);
      loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, loadError);

      // Check the server policy file for cross-domain requests.
      var loaderContext:LoaderContext = new LoaderContext();
      loaderContext.checkPolicyFile = true;

      var urlRequest:URLRequest = new URLRequest(url);
      loader.load(urlRequest, loaderContext);

      imageMap[id] = loader;
      return id;

      function loadSuccess(e:Event):void {
        if (!imageMap[id]) {
          // Probably canceled before load was complete; ignore.
          return;
        }

        var image:Bitmap = Bitmap(loader.content);

        // Get the image dimensions.
        var imageWidth:Number = image.bitmapData.width;
        var imageHeight:Number = image.bitmapData.height;

        // Convert relative offset and size to absolute values.
        x *= imageWidth;
        y *= imageHeight;
        width *= imageWidth;
        height *= imageHeight;

        // Crop the image if required.
        var bitmapData:BitmapData;
        if (x !== 0 || y !== 0 || width !== imageWidth || height !== imageHeight) {
          bitmapData = new BitmapData(width, height);
          bitmapData.copyPixels(image.bitmapData,
            new Rectangle(x, y, width, height), new Point(0,0));
        } else {
          bitmapData = image.bitmapData;
        }

        imageMap[id] = bitmapData;
        ExternalInterface.call(imageLoadedCallback, false, id);
      }

      function loadError(e:IOErrorEvent):void {
        if (!imageMap[id]) {
          // Probably canceled before load was complete; ignore.
          return;
        }
        delete imageMap[id];
        ExternalInterface.call(imageLoadedCallback, true, id);
      }
    }

    public function cancelImage(id:Number):void {
      if (!imageMap[id]) {
        debug('cancelImage: image ' + id + ' does not exist');
        return;
      }
      unloadImage(id);
    }

    public function unloadImage(id:Number):void {
      var loaderOrBitmapData:Object = imageMap[id];
      if (!loaderOrBitmapData) {
        debug('unloadImage: image ' + id + ' does not exist');
        return;
      }
      if (loaderOrBitmapData is Loader) {
        var loader:Loader = loaderOrBitmapData as Loader;
        // Calling close() after the load is complete seems to cause an error,
        // so first check that we are still loading.
        if (loader.contentLoaderInfo.bytesTotal != 0 && loader.contentLoaderInfo.bytesLoaded != loader.contentLoaderInfo.bytesTotal) {
          loader.close();
        }
      }
      delete imageMap[id];
    }

    public function createTexture(imageId:Number, width:Number, height:Number, padTop:Number, padBottom:Number, padLeft:Number, padRight:Number):Number {
      var image:BitmapData = imageMap[imageId];

      var i:Number;
      var point:Point = new Point();
      var rect:Rectangle = new Rectangle();

      // Create new bitmap for texture.
      var bitmap:BitmapData = new BitmapData(width + padLeft + padRight, height + padTop + padBottom, true, 0x00FFFFFF);

      // Resize source image if the texture has a different size.
      // TODO: it would be better to call draw() directly on the final bitmap
      // with both a matrix and a clippingRect parameter; this would both be
      // faster and allocate less memory. However, the clippingRect parameter
      // for the draw() method doesn't seem to work as documented.
      var scaled:BitmapData;
      if (width !== image.width || height !== image.height) {
        scaled = new BitmapData(width, height, true, 0x00FFFFFF);
        var mat:Matrix = new Matrix(width / image.width, 0, 0, height / image.height, 0, 0);
        scaled.draw(image, mat, null, null, null, true);
      } else {
        scaled = image;
      }

      // Draw image into texture.
      rect.x = 0;
      rect.y = 0;
      rect.width = width;
      rect.height = height;

      point.x = padLeft;
      point.y = padTop;
      bitmap.copyPixels(scaled, rect, point);

      // Draw top padding.
      for (i = 0; i <= padTop; i++) {
        rect.x = padLeft;
        rect.y = padTop;
        rect.width = width;
        rect.height = 1;

        point.x = padLeft;
        point.y = i;
        bitmap.copyPixels(bitmap, rect, point);
      }

      // Draw left padding.
      for (i = 0; i <= padLeft; i++) {
        rect.x = padLeft;
        rect.y = padTop;
        rect.width = 1;
        rect.height = height;

        point.x = i;
        point.y = padTop;
        bitmap.copyPixels(bitmap, rect, point);
      }

      // Draw bottom padding.
      for (i = 0; i <= padBottom; i++) {
        rect.x = padLeft;
        rect.y = padTop + height - 1;
        rect.width = width;
        rect.height = 1;

        point.x = padLeft;
        point.y = padTop + height + i;
        bitmap.copyPixels(bitmap, rect, point);
      }

      // Draw right padding.
      for (i = 0; i <= padRight; i++) {
        rect.x = padLeft + width - 1;
        rect.y = padTop;
        rect.width = 1;
        rect.height = height;

        point.x = padLeft + width + i;
        point.y = padTop;
        bitmap.copyPixels(bitmap, rect, point);
      }

      var texture:Sprite = new Sprite();
      texture.addChild(new Bitmap(bitmap));

      var textureId:Number = imageId;
      textureMap[textureId] = texture;

      return textureId;
    }

    public function destroyTexture(id:Number):void {
      var texture:Sprite = textureMap[id];
      if (!texture) {
        debug('destroyTexture: texture ' + id + ' does not exist');
        return;
      }
      if (texture.parent) {
        texture.parent.removeChild(texture);
      }
      delete textureMap[id];
    }
    
    public function takeSnapshot(quality:uint):String {
      // Make an empty snap of stage size
      var snap:BitmapData = new BitmapData (
        stage.width,
        stage.height,
        false
      );
      
      // Draw each layer onto it
      for each (var layer:Sprite in layerMap) {
        snap.draw(layer);
      }
      
      // Make Base64Encoder and JPEGEncoder for exporting
      var buffer:Base64Encoder = new Base64Encoder();
      var jpeg:JPEGEncoder = new JPEGEncoder(quality);
      
      // Base40 encode jpeg data
      buffer.encodeBytes(jpeg.encode(snap));
      
      // Return proper base64 DataURI
      return 'data:image/jpeg;charset=utf-8;base64,' + buffer.toString();
    }
  }
}
