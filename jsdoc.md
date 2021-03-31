This is the reference for [Marzipano](http://www.marzipano.net/). For a Getting Started guide see [http://www.marzipano.net/docs.html](http://www.marzipano.net/docs.html).

The reference is not yet complete (and also not very pretty). If you have any questions please contact us.

## HTML requirements

The following viewport code should be used to correctly render in CSS 3D Transforms mode:

```html
<meta name="viewport" content="target-densitydpi=device-dpi, width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, minimal-ui" />
<style>@-ms-viewport { width: device-width; }</style>
```

A tour exported by the [Marzipano Tool](http://www.marzipano.net/tool) can be used as a boilerplate for many projects.


### Interface elements

It is usually desirable to prevent the default browser behavior on interface elements, such as disabling element selection.

```css
.interface {
  -moz-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-user-drag: none;
  -webkit-touch-callout: none;
  -ms-content-zooming: none;
}
```


## Known issues

### CSS 3D Transforms on Chrome

Chrome (as of version 41) has a bug which causes some tiles to not be displayed in CSS 3D Transforms on some camera directions when other HTML elements exist above the viewer. This can be fixed by setting the opacity of those elements to a value close to 1.

```css
.interface {
  opacity: 0.99;
}
```

### Seams on iOS7 after virtual keyboard

When using CSS 3D Transforms rendering on iOS7, seams become visible between the tiles when the virtual keyboard is shown (for instance, after selecting an &lt;input&gt; element).


### Touch events in emulation mode

When using Chrome's emulation mode for touch, Hammer.js only listens to the touch events. If emulation mode is then disabled it will no longer be possible to control the viewer using the mouse, since the mouse events are not being listened to.

Be sure to refresh the page after enabling or disabling emulation mode.