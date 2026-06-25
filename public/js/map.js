if (
  !listing.geometry ||
  !listing.geometry.coordinates ||
  listing.geometry.coordinates.length < 2
) {
  const mapEl = document.getElementById('map');
  if (mapEl) mapEl.innerHTML = '<p style="padding:1rem;color:#888;">Map not available for this listing.</p>';
} else {
  mapboxgl.accessToken = MAPTOKEN_A;

  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: listing.geometry.coordinates,
    zoom: 9
  });

  const marker1 = new mapboxgl.Marker({ color: 'red' })
    .setLngLat(listing.geometry.coordinates)
    .setPopup(new mapboxgl.Popup({ offset: 25 })
      .setHTML(`<h6>${listing.title}</h6><p>Exact Location provided after booking</p>`))
    .addTo(map);
}
