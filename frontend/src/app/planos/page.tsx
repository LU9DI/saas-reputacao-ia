import { redirect } from 'next/navigation';

/** Planos ficam na landing; evita 404 em /planos. */
export default function PlanosPage() {
  redirect('/#planos');
}
