import { db } from "@white-shop/db";

type DeliveryLocationRecord = {
  id?: string;
  city: string;
  price: number;
  country?: string;
};

class AdminDeliveryService {
  /**
   * Get delivery settings
   */
  async getDeliverySettings() {
    const setting = await db.settings.findUnique({
      where: { key: 'delivery-locations' },
    });

    if (!setting) {
      return {
        locations: [],
      };
    }

    const value = setting.value as { locations?: DeliveryLocationRecord[] };
    return {
      locations: (value.locations || []).map((location) => ({
        id: location.id,
        city: location.city,
        price: location.price,
      })),
    };
  }

  /**
   * Get delivery price for a specific city
   * Returns the configured price if city has shipping, otherwise returns 0
   */
  async getDeliveryPrice(city: string, country: string = 'Armenia') {
    const setting = await db.settings.findUnique({
      where: { key: 'delivery-locations' },
    });

    if (!setting) {
      return 0;
    }

    const value = setting.value as { locations?: DeliveryLocationRecord[] };
    const locations = value.locations || [];

    // Backward compatibility: match city + country for legacy records that still include country.
    const location = locations.find(
      (loc) => 
        loc.city.toLowerCase().trim() === city.toLowerCase().trim() &&
        !!loc.country &&
        loc.country.toLowerCase().trim() === country.toLowerCase().trim()
    );

    if (location) {
      return location.price;
    }

    const cityMatch = locations.find(
      (loc) => loc.city.toLowerCase().trim() === city.toLowerCase().trim()
    );

    if (cityMatch) {
      return cityMatch.price;
    }

    return 0;
  }

  /**
   * Update delivery settings
   */
  async updateDeliverySettings(data: { locations: Array<{ id?: string; city: string; price: number }> }) {
    if (!Array.isArray(data.locations)) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation Error",
        detail: "Locations must be an array",
      };
    }

    // Validate each location
    for (const location of data.locations) {
      if (!location.city) {
        throw {
          status: 400,
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          detail: "Each location must have city",
        };
      }
      if (typeof location.price !== 'number' || location.price < 0) {
        throw {
          status: 400,
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          detail: "Price must be a non-negative number",
        };
      }
    }

    // Generate IDs for new locations
    const locationsWithIds = data.locations.map((location, index) => ({
      city: location.city.trim(),
      price: location.price,
      id: location.id || `location-${Date.now()}-${index}`,
    }));


    return {
      locations: locationsWithIds,
    };
  }
}

export const adminDeliveryService = new AdminDeliveryService();



