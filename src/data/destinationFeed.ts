import type { DayHighlight, DestinationCardProps } from '@/components/cards/DestinationCard';

export type DestinationFeedItem = DestinationCardProps & { id: string };

const DESTINATIONS = [
  {
    name: 'Santorini, Greece',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
  },
  {
    name: 'Banff, Canada',
    imageUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
  },
  {
    name: 'Interlaken, Switzerland',
    imageUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80',
  },
  {
    name: 'Kyoto, Japan',
    imageUrl: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800&q=80',
  },
  {
    name: 'Marrakech, Morocco',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  },
  {
    name: 'Bali, Indonesia',
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
  },
  {
    name: 'Lake Tahoe, USA',
    imageUrl: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&q=80',
  },
  {
    name: 'Reykjavik, Iceland',
    imageUrl: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80',
  },
  {
    name: 'Sahara Desert, Morocco',
    imageUrl: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&q=80',
  },
  {
    name: 'Amalfi Coast, Italy',
    imageUrl: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&q=80',
  },
  {
    name: 'Serengeti, Tanzania',
    imageUrl: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=800&q=80',
  },
  {
    name: 'Wadi Rum, Jordan',
    imageUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80',
  },
  {
    name: 'Black Forest, Germany',
    imageUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80',
  },
  {
    name: 'Queenstown, New Zealand',
    imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
  },
];

const TRIP_TYPES = ['Flight + Stay', 'Villa', 'Experience', 'Resort', 'Adventure'];
const PRICES = ['$499', '$749', '$999', '$1,240', '$1,580', '$1,920'];
const DURATIONS = ['3 days', '4 days', '5 days', '7 days'];

const HIGHLIGHT_POOL: DayHighlight[] = [
  { icon: '\u{1F6EC}', label: 'Arrival & check-in' },
  { icon: '\u{1F37D}\u{FE0F}', label: 'Local food tour' },
  { icon: '\u{1F3DE}\u{FE0F}', label: 'Guided hike' },
  { icon: '\u{1F6F6}', label: 'Boat excursion' },
  { icon: '\u{1F3DB}\u{FE0F}', label: 'Historic sites' },
  { icon: '\u{1F9D8}', label: 'Spa & relax day' },
  { icon: '\u{1F389}', label: 'Sunset celebration' },
  { icon: '\u{1F6CD}\u{FE0F}', label: 'Local market visit' },
];

export function buildDestinationFeed(count: number): DestinationFeedItem[] {
  return Array.from({ length: count }, (_, index) => {
    const destination = DESTINATIONS[index % DESTINATIONS.length];
    const highlights = Array.from({ length: 4 }, (_, dayIndex) => {
      const pick = HIGHLIGHT_POOL[(index + dayIndex) % HIGHLIGHT_POOL.length];
      return { icon: pick.icon, label: `Day ${dayIndex + 1}: ${pick.label}` };
    });

    return {
      id: `${destination.name}-${index}`,
      destination: destination.name,
      imageUrl: destination.imageUrl,
      tripType: TRIP_TYPES[index % TRIP_TYPES.length],
      price: PRICES[index % PRICES.length],
      duration: DURATIONS[index % DURATIONS.length],
      rating: Math.round((4.2 + (index % 7) * 0.1) * 10) / 10,
      highlights,
    };
  });
}
