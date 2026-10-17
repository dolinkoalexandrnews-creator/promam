'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapComponentProps {
  userLocation: [number, number] | null
}

const KYIV_CENTER: [number, number] = [50.4501, 30.5234]

// Sample moms with coordinates (Kyiv locations)
const SAMPLE_MOMS = [
  { id: 1, name: 'Марія', emoji: '👩‍🦰', coords: [50.4515, 30.5240] as [number, number], bio: 'Люблю кави' },
  { id: 2, name: 'Наталія', emoji: '👩‍🦱', coords: [50.4490, 30.5200] as [number, number], bio: 'Мама Матвійчика' },
  { id: 3, name: 'Ольга', emoji: '👩', coords: [50.4530, 30.5300] as [number, number], bio: 'Активна мама' },
  { id: 4, name: 'Вікторія', emoji: '👩‍🔬', coords: [50.4470, 30.5150] as [number, number], bio: 'Шукаю сусідок' },
]

export default function MapComponent({ userLocation }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Ініціалізувати карту
    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current).setView(userLocation || KYIV_CENTER, 15)

      // Додати OpenStreetMap тайли
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapRef.current)

      // Мій маркер
      if (userLocation) {
        L.circleMarker(userLocation, {
          radius: 8,
          fillColor: '#ec4899',
          color: '#be123c',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        })
          .bindPopup('<strong>Ти тут 📍</strong>')
          .addTo(mapRef.current)
      }

      // Додати мам на карту
      SAMPLE_MOMS.forEach(mom => {
        const customIcon = L.divIcon({
          html: `<div class="flex items-center justify-center w-10 h-10 bg-white rounded-full border-2 border-rose-500 shadow-lg text-2xl cursor-pointer hover:scale-110 transition">${mom.emoji}</div>`,
          iconSize: [40, 40],
          className: '',
        })

        L.marker(mom.coords, { icon: customIcon })
          .bindPopup(
            `<div class="text-center font-bold text-sm">
              <div>${mom.emoji}</div>
              <div>${mom.name}</div>
              <div class="text-xs text-gray-600">${mom.bio}</div>
              <button class="mt-2 bg-rose-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-rose-600">
                💬 Чат
              </button>
            </div>`
          )
          .addTo(mapRef.current)
      })
    }
  }, [userLocation])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* Info Panel */}
      <div className="absolute top-4 left-4 bg-white rounded-2xl p-4 shadow-xl max-w-xs border-2 border-rose-200 z-50">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">📍</span>
          <h3 className="font-bold text-text">Мами поруч</h3>
        </div>
        <p className="text-xs text-muted mb-3">Клікни на мам щоб почати чат 💬</p>
        <div className="space-y-1">
          {SAMPLE_MOMS.map(mom => (
            <div key={mom.id} className="flex items-center gap-2 text-xs bg-rose-50 p-2 rounded">
              <span>{mom.emoji}</span>
              <span className="font-medium">{mom.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Zoom Controls Info */}
      <div className="absolute bottom-24 right-4 bg-white rounded-xl p-3 shadow-xl border-2 border-rose-200 text-xs text-muted z-50">
        <p>🔍 Zoom: +/- або колесо</p>
      </div>
    </div>
  )
}
