"use client";

import { useEffect } from "react";
import L from "leaflet";
import { AttributionControl, MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { INDIA_BOUNDS } from "@/lib/location";

const indiaBounds = L.latLngBounds([INDIA_BOUNDS.south, INDIA_BOUNDS.west], [INDIA_BOUNDS.north, INDIA_BOUNDS.east]);
const markerIcon = L.divIcon({
  className: "venue-map-marker",
  html: '<span aria-hidden="true"></span>',
  iconSize: [30, 38],
  iconAnchor: [15, 38],
});

function MapController({ position, onMove }: { position: [number, number]; onMove: (latitude: number, longitude: number) => void }) {
  const map = useMap();
  useEffect(() => { map.flyTo(position, Math.max(map.getZoom(), 15)); }, [map, position]);
  useMapEvents({ click(event) { if (indiaBounds.contains(event.latlng)) onMove(event.latlng.lat, event.latlng.lng); } });
  return <Marker position={position} icon={markerIcon} draggable eventHandlers={{ dragend(event) { const point = event.target.getLatLng(); onMove(point.lat, point.lng); } }} />;
}

export default function VenueLocationMap({ latitude, longitude, onMove }: { latitude: number; longitude: number; onMove: (latitude: number, longitude: number) => void }) {
  const tileUrl = process.env.NEXT_PUBLIC_OSM_TILE_URL ?? "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  return <MapContainer attributionControl={false} className="venue-map" center={[latitude, longitude]} zoom={15} minZoom={4} maxBounds={indiaBounds} maxBoundsViscosity={1} scrollWheelZoom>
    <AttributionControl prefix={false}/>
    <TileLayer url={tileUrl} attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'/>
    <MapController position={[latitude, longitude]} onMove={onMove}/>
  </MapContainer>;
}
