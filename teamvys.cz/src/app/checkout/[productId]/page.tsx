import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Stáhněte aplikaci TeamVYS',
};

export default function CheckoutPage() {
  redirect('/aplikace');
}