import { redirect } from 'next/navigation';
import { SeoPageHeader } from '../components/SeoPageHeader';

/** Planos ficam na landing; evita 404 em /planos. */
export default function PlanosPage() {
  redirect('/#planos');
}
