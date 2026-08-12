// Règle tarifaire plateforme : dès que le client sélectionne plusieurs
// photos dans la même commande, chacune bénéficie d'une remise de 10%
// (même règle pour tous les photographes — voir la discussion produit
// qui a introduit cette règle). Le prix de base par photo reste fixé
// par chaque photographe.
export const MULTI_PHOTO_DISCOUNT_THRESHOLD = 2;
export const MULTI_PHOTO_DISCOUNT_RATE = 0.1;

export function isDiscountApplied(itemCount: number): boolean {
  return itemCount >= MULTI_PHOTO_DISCOUNT_THRESHOLD;
}

function discountedUnitPrice(priceFcfa: number, itemCount: number): number {
  return isDiscountApplied(itemCount) ? Math.round(priceFcfa * (1 - MULTI_PHOTO_DISCOUNT_RATE)) : priceFcfa;
}

// Recalculée à partir des prix réels de chaque photo — jamais depuis une
// valeur envoyée par le client, qui pourrait être falsifiée (même
// discipline que le reste des routes de paiement de ce projet).
export function computeOrderPricing(photos: { id: string; price_fcfa: number }[]): {
  total_fcfa: number;
  discountApplied: boolean;
  unitPrices: Record<string, number>;
} {
  const discountApplied = isDiscountApplied(photos.length);
  const unitPrices: Record<string, number> = {};
  let total_fcfa = 0;

  for (const photo of photos) {
    const price = discountedUnitPrice(photo.price_fcfa, photos.length);
    unitPrices[photo.id] = price;
    total_fcfa += price;
  }

  return { total_fcfa, discountApplied, unitPrices };
}
