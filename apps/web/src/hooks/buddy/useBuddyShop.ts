import { useCallback, useEffect, useState } from 'react';
import { buddyApi } from '../../services/api';
import type {
  ShopCatalogResponse,
  ShopDailyResponse,
  ShopInventoryResponse,
  BuddySpeciesResponse,
} from './shopTypes';

export function useBuddyShop() {
  const [catalog, setCatalog] = useState<ShopCatalogResponse | null>(null);
  const [daily, setDaily] = useState<ShopDailyResponse | null>(null);
  const [inventory, setInventory] = useState<ShopInventoryResponse | null>(null);
  const [species, setSpecies] = useState<BuddySpeciesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [cat, day, inv, sp] = await Promise.all([
        buddyApi.shopCatalog(),
        buddyApi.shopDaily(),
        buddyApi.shopInventory(),
        buddyApi.listSpecies(),
      ]);
      setCatalog(cat.data);
      setDaily(day.data);
      setInventory(inv.data);
      setSpecies(sp.data);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message)
          : 'Failed to load shop';
      setError(msg || 'Failed to load shop');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const purchase = async (itemId: string) => {
    const { data } = await buddyApi.shopPurchase(itemId);
    await refresh();
    return data;
  };

  return {
    catalog,
    daily,
    inventory,
    species,
    loading,
    error,
    refresh,
    purchase,
  };
}
