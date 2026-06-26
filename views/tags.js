// ===============================
// Holiday Rental Categories
// ===============================

const holidayCategories = [
  { icon: "🏡", name: "Cabins" },
  { icon: "🏢", name: "Flats" },
  { icon: "🏠", name: "Houses" },
  { icon: "🏖️", name: "Beachfront" },
  { icon: "🌲", name: "Treehouses" },
  { icon: "🏕️", name: "Camping" },
  { icon: "🚐", name: "RVs" },
  { icon: "🏛️", name: "Historic Homes" },

  { icon: "🏕️", name: "Cottages" },
  { icon: "🏨", name: "Hotels" },
  { icon: "🏢", name: "Apartments" },
  { icon: "🏡", name: "Villas" },
  { icon: "🌅", name: "Lakefront" },
  { icon: "🏝️", name: "Island Stays" },
  { icon: "⛰️", name: "Mountain View" },
  { icon: "🌆", name: "City View" },

  { icon: "❄️", name: "Ski Resorts" },
  { icon: "🌋", name: "Countryside" },
  { icon: "🛖", name: "Tiny Homes" },
  { icon: "🏰", name: "Castles" },
  { icon: "🛶", name: "Houseboats" },
  { icon: "🏜️", name: "Desert Retreats" },
  { icon: "🌳", name: "Forest Stays" },
  { icon: "🌄", name: "Hill Stations" },

  { icon: "💎", name: "Luxury Stays" },
  { icon: "👨‍👩‍👧‍👦", name: "Family Homes" },
  { icon: "💑", name: "Couple Retreats" },
  { icon: "🐕", name: "Pet Friendly" },
  { icon: "🏕️", name: "Glamping" },
  { icon: "🏄", name: "Surf Houses" },
  { icon: "🎣", name: "Fishing Lodges" },
  { icon: "🌴", name: "Resorts" }
];


// ===============================
// Popular Amenities
// ===============================

const amenities = [
  { icon: "🍽️", name: "Kitchen" },
  { icon: "📶", name: "WiFi" },
  { icon: "🏊", name: "Pool" },
  { icon: "🅿️", name: "Free Parking" },
  { icon: "❄️", name: "Air Conditioning" },
  { icon: "🔥", name: "Fireplace" },
  { icon: "🛁", name: "Hot Tub" },
  { icon: "🐕", name: "Pet Friendly" },
  { icon: "🧺", name: "Laundry" },

  { icon: "📺", name: "Smart TV" },
  { icon: "☕", name: "Coffee Maker" },
  { icon: "🍖", name: "BBQ Grill" },
  { icon: "🏋️", name: "Gym" },
  { icon: "🛗", name: "Elevator" },
  { icon: "🧼", name: "Cleaning Service" },
  { icon: "🛎️", name: "24/7 Reception" },
  { icon: "🧳", name: "Luggage Storage" },

  { icon: "🚲", name: "Bike Rental" },
  { icon: "🚗", name: "Car Parking" },
  { icon: "🔌", name: "EV Charging" },
  { icon: "🌐", name: "High-Speed Internet" },
  { icon: "🛏️", name: "King Size Bed" },
  { icon: "👶", name: "Baby Crib" },
  { icon: "♿", name: "Wheelchair Accessible" },
  { icon: "🚭", name: "Smoke Free" },

  { icon: "🌅", name: "Balcony" },
  { icon: "🏖️", name: "Private Beach Access" },
  { icon: "🌄", name: "Mountain View" },
  { icon: "🌊", name: "Sea View" },
  { icon: "🏡", name: "Private Garden" },
  { icon: "🎮", name: "Game Room" },
  { icon: "🎱", name: "Pool Table" },
  { icon: "🎬", name: "Home Theatre" },

  { icon: "🍳", name: "Breakfast Included" },
  { icon: "🥂", name: "Dining Area" },
  { icon: "🛡️", name: "Security Cameras" },
  { icon: "🔐", name: "Self Check-in" },
  { icon: "💼", name: "Workspace" },
  { icon: "📚", name: "Study Room" },
  { icon: "🎉", name: "Event Friendly" },
  { icon: "🌙", name: "Quiet Neighborhood" }
];


// ===============================
// Unique Experiences
// ===============================

const experiences = [
  { icon: "⛰️", name: "Mountain Hiking" },
  { icon: "🚴", name: "Biking Trails" },
  { icon: "🛶", name: "Kayaking Adventures" },
  { icon: "🐾", name: "Pet-friendly Parks" },

  { icon: "🏄", name: "Surfing" },
  { icon: "🏊", name: "Swimming" },
  { icon: "🤿", name: "Scuba Diving" },
  { icon: "🚤", name: "Boating" },
  { icon: "🎣", name: "Fishing Trips" },
  { icon: "🏕️", name: "Camping" },
  { icon: "🔥", name: "Campfire Nights" },
  { icon: "🌄", name: "Sunrise Trek" },

  { icon: "🌅", name: "Sunset View" },
  { icon: "🏞️", name: "Nature Walks" },
  { icon: "🌳", name: "Forest Exploration" },
  { icon: "🚙", name: "Off-road Safari" },
  { icon: "🦌", name: "Wildlife Safari" },
  { icon: "🐘", name: "Nature Reserve Tours" },
  { icon: "📸", name: "Photography Tours" },
  { icon: "🎨", name: "Art Workshops" },

  { icon: "🍷", name: "Wine Tasting" },
  { icon: "☕", name: "Coffee Plantation Tour" },
  { icon: "🍽️", name: "Local Food Tour" },
  { icon: "👨‍🍳", name: "Cooking Classes" },
  { icon: "🎭", name: "Cultural Shows" },
  { icon: "🎶", name: "Live Music" },
  { icon: "🛍️", name: "Local Shopping" },
  { icon: "🏛️", name: "Historical Tours" },

  { icon: "🧘", name: "Yoga Retreat" },
  { icon: "💆", name: "Spa & Wellness" },
  { icon: "🌌", name: "Stargazing" },
  { icon: "🎈", name: "Hot Air Balloon" },
  { icon: "🚁", name: "Helicopter Ride" },
  { icon: "🪂", name: "Paragliding" },
  { icon: "🏇", name: "Horse Riding" },
  { icon: "❄️", name: "Snow Adventures" }
];


// ===============================
// Local Attractions
// ===============================

const attractions = [
  { icon: "🏔️", name: "National Parks" },
  { icon: "🏞️", name: "Scenic Lookouts" },
  { icon: "🌊", name: "Waterfalls" },
  { icon: "🏖️", name: "Beaches" },
  { icon: "🌅", name: "Sunset Points" },
  { icon: "🌄", name: "Hill Stations" },
  { icon: "🌋", name: "Volcanoes" },
  { icon: "🌲", name: "Forests" },

  { icon: "🦌", name: "Wildlife Sanctuaries" },
  { icon: "🐘", name: "National Reserves" },
  { icon: "🦜", name: "Bird Watching" },
  { icon: "🐬", name: "Marine Parks" },

  { icon: "🏰", name: "Historic Forts" },
  { icon: "🏛️", name: "Museums" },
  { icon: "⛪", name: "Churches" },
  { icon: "🛕", name: "Temples" },
  { icon: "🕌", name: "Mosques" },
  { icon: "🕍", name: "Synagogues" },
  { icon: "🎨", name: "Art Galleries" },
  { icon: "🎭", name: "Cultural Centers" },

  { icon: "🎡", name: "Theme Parks" },
  { icon: "🎢", name: "Amusement Parks" },
  { icon: "🐠", name: "Aquariums" },
  { icon: "🦁", name: "Zoos" },

  { icon: "🛍️", name: "Shopping Streets" },
  { icon: "🏬", name: "Shopping Malls" },
  { icon: "🌃", name: "City Landmarks" },
  { icon: "🌉", name: "Famous Bridges" },

  { icon: "🗼", name: "Observation Towers" },
  { icon: "🚠", name: "Cable Cars" },
  { icon: "🚢", name: "Harbors & Ports" },
  { icon: "🏟️", name: "Sports Stadiums" },

  { icon: "🌺", name: "Botanical Gardens" },
  { icon: "🌴", name: "Nature Parks" },
  { icon: "🏜️", name: "Desert Attractions" },
  { icon: "❄️", name: "Snow Parks" }
];

// Export (if using Node.js)

module.exports = {
  holidayCategories,
  amenities,
  experiences,
  attractions
};