// src/pages/Navigation/Navigation.tsx

import { FC, useEffect, useRef, useState } from 'react';
import Topbar from '../../components/Topbar';

import './Navigation.css';
import '../Home/Home.css';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

import Back from '../../components/Back';
import BackToTop from '../../components/BackToTop';
import AskButton from '../../components/AskButton';


interface Place {
  name: string;
  coords: [number, number];
}

const universityPlaces: Place[] = [
  { name: 'Main Gate', coords: [33.90737643214426, 72.91639221290407] },
  { name: 'Parking', coords: [33.908038, 72.916061] },
  { name: 'Bank Area', coords: [33.906808, 72.916936] },
  { name: 'University Dam', coords: [33.907141, 72.918151] },
  { name: 'sculpture and arts studio', coords: [33.90657145761981, 72.91749188521455] },
  { name: 'university bus parking', coords: [33.90639830790399, 72.91683945202087] },
  { name: 'Girls Hostel', coords: [33.905459, 72.917474] },
  { name: 'Admin Block', coords: [33.908577, 72.917872] },
  { name: 'Academic Block A1', coords: [33.908889, 72.918487] },
  { name: 'Academic Block A2', coords: [33.909058, 72.919047] },
  { name: 'Academic Block B1', coords: [33.909272, 72.919551] },
  { name: 'Academic Block B2', coords: [33.909550, 72.920275] },
  { name: 'Academic Block C1', coords: [33.910064, 72.921095] },
  { name: 'Academic Block C2', coords: [33.910086, 72.922114] },
  { name: 'Faculty Lodges', coords: [33.909905, 72.923110] },
  { name: 'Lodges Parking', coords: [33.910304, 72.923123] },
  { name: 'Library', coords: [33.90933434580427, 72.92241148875704] },
  { name: 'STC', coords: [33.909328836679045, 72.92191647402029] },
  { name: 'Tennis Court', coords: [33.908739305910004, 72.92200786346295] },
  { name: 'Basketball Court', coords: [33.90847997206732, 72.92173293705115] },
  { name: 'Open Gym', coords: [33.90873819289339, 72.92261404269466] },
  { name: 'Cricket Ground', coords: [33.908528348735594, 72.92056794271635] },
  { name: 'Football Ground', coords: [33.90806715066325, 72.91944325410276] },
  { name: 'Boys Hostel Block A', coords: [33.90665453627325, 72.91973512547985] },
  { name: 'Boys Hostel Block B', coords: [33.906524819198346, 72.92034276371984] },
  { name: 'Boys Hostel Block C', coords: [33.90709266085003, 72.92058837076995] },
  { name: 'Railway Hostels', coords: [33.90760796506167, 72.9234229759848] }
];

const Navigation: FC = () => {
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routingControlRef = useRef<any>(null);
  const initialZoomDoneRef = useRef<boolean>(false);
  const latestCoordsRef = useRef<L.LatLng | null>(null);
  const trackingIdRef = useRef<number | null>(null);

  const [isTracking, setIsTracking] = useState(false);
  const [distance, setDistance] = useState<string>('0.00 km');

  useEffect(() => {
    document.body.classList.add('navigation-page');
    return () => document.body.classList.remove('navigation-page');
  }, []);

  useEffect(() => {
    if (!mapRef.current) {
      const map = L.map('map', {
        zoomControl: false,
        preferCanvas: true,
        renderer: L.canvas()
      }).setView([33.90737643214426, 72.91639221290407], 17);

      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 500);

      const esri = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          attribution: 'Tiles © Esri'
        }
      );

      const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      });

      const google = L.tileLayer(
        'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        {
          maxZoom: 21,
          attribution: '&copy; Google Satellite'
        }
      );

      esri.addTo(map);

      setTimeout(() => {
        L.control
          .layers(
            {
              'Satellite(sharper)': esri,
              OpenStreetMap: osm,
              'Google Satellite': google
            },
            {}
          )
          .addTo(map);
      }, 1000);

      universityPlaces.forEach(place => {
        L.marker(place.coords).addTo(map).bindPopup(place.name);
      });
    }
  }, []);

  const startNavigation = () => {
    const map = mapRef.current;
    if (!map) return;

    // If already tracking -> stop tracking and reset view
    if (isTracking) {
      if (trackingIdRef.current !== null) {
        navigator.geolocation.clearWatch(trackingIdRef.current);
        trackingIdRef.current = null;
      }

      if (routingControlRef.current) {
        routingControlRef.current.remove();
        routingControlRef.current = null;
      }

      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }

      initialZoomDoneRef.current = false;

      map.flyTo([33.90737643214426, 72.91639221290407], 17, {
        animate: true,
        duration: 1.5
      });

      setIsTracking(false);
      return;
    }

    // Start tracking
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        updateUserLocation(lat, lng, true);

        const watchId = navigator.geolocation.watchPosition(
          pos => {
            const { latitude, longitude } = pos.coords;
            updateUserLocation(latitude, longitude, false);
          },
          err => {
            console.error('Live location error:', err);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 15000
          }
        );

        trackingIdRef.current = watchId;
        setIsTracking(true);
      },
      _ => {
        console.error('Location access denied.');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      }
    );
  };

  const updateUserLocation = (lat: number, lng: number, shouldZoom: boolean) => {
    const map = mapRef.current;
    if (!map) return;

    const currentLatLng = L.latLng(lat, lng);
    latestCoordsRef.current = currentLatLng;

    // Create / update user marker
    if (!userMarkerRef.current) {
      const icon = L.divIcon({
        html: '<div class="user-icon"></div>',
        className: '',
        iconSize: [30, 30]
      });
      userMarkerRef.current = L.marker(currentLatLng, { icon })
        .addTo(map)
        .bindPopup('You are here');
    } else {
      userMarkerRef.current.setLatLng(currentLatLng);
    }

    // First zoom into the user smoothly
    if (shouldZoom && !initialZoomDoneRef.current) {
      map.flyTo(currentLatLng, 19, { animate: true, duration: 1.5 });
      initialZoomDoneRef.current = true;
    }

    // Distance to main gate
    const dist = getDistanceFromLatLonInKm(
      lat,
      lng,
      33.90737643214426,
      72.91639221290407
    );
    setDistance(`${dist.toFixed(2)} km`);

    // Draw / remove route based on distance (> 1km)
    if (dist > 1) {
      drawRouteToGate(lat, lng);
    } else if (routingControlRef.current) {
      routingControlRef.current.remove();
      routingControlRef.current = null;
    }
  };

  const drawRouteToGate = (lat: number, lng: number) => {
    const map = mapRef.current;
    if (!map) return;

    if (routingControlRef.current) {
      routingControlRef.current.setWaypoints([
        L.latLng(lat, lng),
        L.latLng(33.90737643214426, 72.91639221290407)
      ]);
      return;
    }

    // @ts-ignore
    routingControlRef.current = L.Routing.control({
      waypoints: [
        L.latLng(lat, lng),
        L.latLng(33.90737643214426, 72.91639221290407)
      ],
      createMarker: () => null,
      draggableWaypoints: false,
      addWaypoints: false,
      routeWhileDragging: false,
      fitSelectedRoutes: false,
      show: false,
      lineOptions: {
        styles: [{ color: '#007bff', opacity: 0.8, weight: 10 }]
      },
      containerClassName: 'hidden-routing-container'
    }).addTo(map);
  };

  function getDistanceFromLatLonInKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  return (
    <>
      <Topbar />
      <Back />
      <BackToTop />
      <AskButton />

      <div className="container-navigation">
        <header>
          <h1>Campus Navigation</h1>
        </header>

        <div style={{ position: 'relative' }}>
          <div id="map" className="map-container"></div>

          <div className="map-button-group">
            <button
              className="map-button"
              onClick={() => {
                const map = mapRef.current;
                const coords = latestCoordsRef.current;

                if (!map) return;

                if (coords) {
                  userMarkerRef.current?.setLatLng(coords);
                  map.setView(coords, 19);
                } else {
                  navigator.geolocation.getCurrentPosition(
                    position => {
                      const lat = position.coords.latitude;
                      const lng = position.coords.longitude;
                      const currentLatLng = L.latLng(lat, lng);
                      latestCoordsRef.current = currentLatLng;

                      if (!userMarkerRef.current) {
                        const icon = L.divIcon({
                          html: '<div class="user-icon"></div>',
                          className: '',
                          iconSize: [30, 30]
                        });
                        userMarkerRef.current = L.marker(currentLatLng, {
                          icon
                        })
                          .addTo(map)
                          .bindPopup('You are here');
                      } else {
                        userMarkerRef.current.setLatLng(currentLatLng);
                      }

                      map.setView(currentLatLng, 19);
                    },
                    err => console.error('Geolocation error:', err),
                    { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
                  );
                }
              }}
            >
              Re-centre
            </button>

            <button className="map-button" onClick={startNavigation}>
              {isTracking ? 'Stop Locating' : 'Start Locating'}
            </button>
          </div>
        </div>

        <div className="distance-info">Total Distance: {distance}</div>
      </div>
    </>
  );
};

export default Navigation;
