import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { APIProvider, Map, useMap, useMapsLibrary, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { ChevronLeft, Navigation as NavIcon, Clock, MapPin, Layers } from 'lucide-react';
import { motion } from 'motion/react';

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

function RouteDisplay({ destination }: { destination: google.maps.LatLngLiteral }) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  useEffect(() => {
    if (!routesLib || !map || !destination) return;

    // Get user's current location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const origin = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        routesLib.Route.computeRoutes({
          origin,
          destination,
          travelMode: 'DRIVING',
          fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
        }).then(({ routes }) => {
          if (routes?.[0]) {
            const newPolylines = routes[0].createPolylines();
            newPolylines.forEach(p => p.setMap(map));
            if (routes[0].viewport) map.fitBounds(routes[0].viewport);
            
            setRouteInfo({
              distance: (routes[0].distanceMeters / 1000).toFixed(1) + ' km',
              duration: Math.ceil(routes[0].durationMillis / 60000) + ' mins'
            });
          }
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
        // Fallback or alert
      }
    );
  }, [routesLib, map, destination]);

  return routeInfo ? (
    <div className="absolute top-20 left-4 right-4 z-10">
      <div className="bg-white rounded-2xl p-4 shadow-xl border border-blue-50/50 flex justify-between items-center max-w-sm mx-auto">
        <div className="flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Duration</div>
            <div className="text-sm font-black text-gray-900 font-sans">{routeInfo.duration}</div>
          </div>
        </div>
        <div className="w-px h-8 bg-gray-100"></div>
        <div className="flex items-center gap-4">
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
            <NavIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Distance</div>
            <div className="text-sm font-black text-gray-900 font-sans">{routeInfo.distance}</div>
          </div>
        </div>
      </div>
    </div>
  ) : null;
}

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const lat = parseFloat(queryParams.get('lat') || '12.9716');
  const lng = parseFloat(queryParams.get('lng') || '77.5946');
  const label = queryParams.get('label') || 'Target Slot';
  const floor = queryParams.get('floor') || '1';

  if (!hasValidKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl text-center max-w-md">
          <MapPin className="w-16 h-16 text-rose-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-gray-900 mb-4">Maps API Key Required</h2>
          <p className="text-gray-500 mb-8 leading-relaxed font-medium">To enable real-time navigation, please add your Google Maps Platform API key in the project settings.</p>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all w-full"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative overflow-hidden bg-gray-100">
      <div className="absolute top-6 left-6 z-20 flex items-center gap-4">
        <button 
          onClick={() => navigate('/')}
          className="p-4 bg-white rounded-2xl shadow-lg border border-gray-100 hover:bg-gray-50 transition-all text-gray-900"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="bg-white px-6 py-4 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-sm">
            {label}
          </div>
          <div>
            <h1 className="text-sm font-black text-gray-900 tracking-tight">Navigating to Slot</h1>
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <Layers className="w-3 h-3" />
              Floor {floor} • Parking Zone A
            </div>
          </div>
        </div>
      </div>

      <div className="h-full w-full">
        <APIProvider apiKey={API_KEY} version="weekly">
          <Map
            defaultCenter={{ lat, lng }}
            defaultZoom={15}
            mapId="SMART_PARK_MAP_ID"
            disableDefaultUI={true}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            <RouteDisplay destination={{ lat, lng }} />
            <AdvancedMarker position={{ lat, lng }}>
              <Pin background="#007BFF" glyphColor="#fff" borderColor="#0056b3" />
            </AdvancedMarker>
          </Map>
        </APIProvider>
      </div>

      {/* Footer Nav UI */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-4">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gray-900 text-white p-6 rounded-[2.5rem] shadow-2xl border border-white/10"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
              <NavIcon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold">Next Turn: 200m</h4>
              <p className="text-xs text-gray-400">Head south towards M.G. Road</p>
            </div>
          </div>
          <button 
            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`)}
            className="w-full bg-blue-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all font-sans"
          >
            Open in Google Maps
          </button>
        </motion.div>
      </div>
    </div>
  );
}
