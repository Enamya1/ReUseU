import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { conditions, products, universities, users } from '@/lib/dummyData';
import { ArrowLeft, CalendarDays, DollarSign, MapPin, Package, Tag, User, Heart, Eye, MousePointerClick } from 'lucide-react';
import { cn } from '@/lib/utils';

const defaultIconPrototype = L.Icon.Default.prototype as unknown as { _getIconUrl?: string };
delete defaultIconPrototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const productLocationIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

type ProductDetailStateProduct = {
  id: string;
  title: string;
  status: 'active' | 'sold' | 'reserved';
  images: string[];
  categoryName: string;
  universityName: string;
  conditionName: string;
  description: string;
  views: number;
  clicks: number;
  favorites: number;
  price: string;
  createdAt: string;
  updatedAt: string;
  sellerName: string;
  sellerId: string;
  dormitoryName: string;
  pickupAvailable: boolean;
  deliveryAvailable: boolean;
  location: string;
  conditionId?: string;
};

type ProductDetailState = {
  product?: ProductDetailStateProduct;
};

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const stateProduct = (location.state as ProductDetailState | null)?.product;
  const product = products.find((item) => item.id === id) ?? stateProduct;
  const seller = users.find((item) => item.id === product?.sellerId);
  const universityLocation = universities.find((item) => item.name === product?.universityName);
  const conditionLevel = conditions.find((item) => item.id === product?.conditionId)?.level;
  const mapCenter: [number, number] = universityLocation
    ? [universityLocation.lat, universityLocation.lng]
    : [39.8283, -98.5795];

  if (!product) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <p className="text-xl text-muted-foreground mb-4">Product not found</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{product.title}</h1>
            <p className="text-muted-foreground">Product details and listing information</p>
          </div>
          <span
            className={cn(
              "px-3 py-1 rounded-full text-sm font-medium capitalize",
              product.status === 'active' && "bg-primary/10 text-primary",
              product.status === 'sold' && "bg-success/10 text-success",
              product.status === 'reserved' && "bg-warning/10 text-warning"
            )}
          >
            {product.status}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.images.map((image, index) => (
                  <div key={`${product.id}-${index}`} className="h-56 rounded-lg border border-border bg-secondary/30 overflow-hidden">
                    <img src={image} alt={`${product.title} ${index + 1}`} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-foreground hover:bg-secondary/70 transition-colors"
                      onClick={() => navigate('/')}
                    >
                      {product.categoryName}
                    </button>
                    <button
                      type="button"
                      className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-foreground hover:bg-secondary/70 transition-colors"
                      onClick={() => navigate('/')}
                    >
                      {product.universityName}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Condition Level</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-foreground hover:bg-secondary/70 transition-colors"
                      onClick={() => navigate('/')}
                    >
                      {product.conditionName}
                    </button>
                    {conditionLevel !== undefined && (
                      <button
                        type="button"
                        className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-foreground hover:bg-secondary/70 transition-colors"
                        onClick={() => navigate('/')}
                      >
                        Level {conditionLevel}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-3">Description</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  <span>{product.views} views</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MousePointerClick className="w-4 h-4" />
                  <span>{product.clicks} clicks</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Heart className="w-4 h-4" />
                  <span>{product.favorites} favorites</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <div className="flex items-center gap-2 text-2xl font-bold text-foreground">
                <DollarSign className="w-5 h-5 text-primary" />
                <span>{product.price}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="w-4 h-4" />
                <span>{product.views} views</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Heart className="w-4 h-4" />
                <span>{product.favorites} favorites</span>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Tag className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="text-sm text-foreground">{product.categoryName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Condition</p>
                  <p className="text-sm text-foreground">{product.conditionName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm text-foreground">{product.createdAt}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Updated</p>
                  <p className="text-sm text-foreground">{product.updatedAt}</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Seller</p>
                  <p className="text-sm text-foreground">{product.sellerName}</p>
                  <p className="text-xs text-muted-foreground">{product.universityName}</p>
                  <p className="text-xs text-muted-foreground">{product.dormitoryName}</p>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => navigate(`/users/${product.sellerId}`)}>
                View Seller Profile
              </Button>
              {seller && (
                <div className="text-xs text-muted-foreground">
                  {seller.email}
                </div>
              )}
            </div>

            <div className="bg-card rounded-xl border border-border p-6 space-y-3">
              <p className="text-sm font-medium text-foreground">Availability</p>
              <div className="text-sm text-muted-foreground">
                {product.pickupAvailable ? 'Pickup available' : 'Pickup unavailable'}
              </div>
              <div className="text-sm text-muted-foreground">
                {product.deliveryAvailable ? 'Delivery available' : 'Delivery unavailable'}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Location Map</span>
              </div>
              <div className="h-56 rounded-lg overflow-hidden border border-border">
                <MapContainer
                  center={mapCenter}
                  zoom={universityLocation ? 12 : 3}
                  style={{ height: '100%', width: '100%' }}
                  className="z-0"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  />
                  {universityLocation && (
                    <Marker position={[universityLocation.lat, universityLocation.lng]} icon={productLocationIcon} />
                  )}
                </MapContainer>
              </div>
              <div className="text-xs text-muted-foreground">
                {product.location}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
