'use client';

import { useEffect } from 'react';

/** Planos ficam na landing; mantém /planos compatível com export estático. */
export default function PlanosPage() {
  useEffect(() => {
    window.location.replace('/#planos');
  }, []);

  return null;
}
