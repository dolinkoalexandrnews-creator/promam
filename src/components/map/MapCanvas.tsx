'use client'

import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo } from 'react'
import { FORMATS } from '@/lib/constants'
import type { NearbyPin } from '@/lib/types'

/** Крапля з емодзі формату замість стандартної синьої шпильки Leaflet. */
function pinIcon(pin: NearbyPin) {
  const f = FORMATS[pin.format]
  return L.divIcon({
    className: '',
    html: `<div class="promam-pin ${pin.is_mine ? 'promam-pin-mine' : ''}"
                style="background:${f.color}"><span>${f.emoji}</span></div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 40],
  })
}

const meIcon = L.divIcon({
  className: '',
  html: '<div class="promam-me"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

/** Плавно летить до нової точки, коли змінюється центр ззовні. */
function Recenter({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, zoom ?? map.getZoom(), { duration: 0.8 })
  }, [center[0], center[1], zoom]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

function ClickCatcher({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick?.(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function MapCanvas({
  center,
  me,
  pins,
  onPinClick,
  onMapClick,
  zoom = 14,
  picking = false,
}: {
  center: [number, number]
  me: [number, number] | null
  pins: NearbyPin[]
  onPinClick?: (pin: NearbyPin) => void
  onMapClick?: (lat: number, lng: number) => void
  zoom?: number
  picking?: boolean
}) {
  const markers = useMemo(
    () =>
      pins.map((pin) => (
        <Marker
          key={pin.id}
          position={[pin.lat, pin.lng]}
          icon={pinIcon(pin)}
          eventHandlers={{ click: () => onPinClick?.(pin) }}
        />
      )),
    [pins, onPinClick],
  )

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      zoomControl={false}
      attributionControl
      className={picking ? 'cursor-crosshair' : ''}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        maxZoom={20}
      />
      <Recenter center={center} />
      <ClickCatcher onClick={onMapClick} />
      {me && <Marker position={me} icon={meIcon} />}
      {markers}
    </MapContainer>
  )
}
