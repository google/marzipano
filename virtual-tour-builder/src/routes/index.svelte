<script lang="ts">
	import { onMount } from 'svelte';

	onMount(async () => {
		const { default: Marzipano } = await import('../../../src/index.js');
		// Create viewer.
		var viewer = new Marzipano.Viewer(document.getElementById('pano'));

		// Create source.
		var source = Marzipano.ImageUrlSource.fromString(
			'//www.marzipano.net/media/equirect/angra.jpg'
		);

		// Create geometry.
		var geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);

		// Create view.
		var limiter = Marzipano.RectilinearView.limit.traditional(1024, (100 * Math.PI) / 180);
		var view = new Marzipano.RectilinearView({ yaw: Math.PI }, limiter);

		// Create scene.
		var scene = viewer.createScene({
			source: source,
			geometry: geometry,
			view: view,
			pinFirstLevel: true
		});

		// Display scene.
		scene.switchTo();
	});
</script>

<div id="pano" />

<style>
	#pano {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
</style>
