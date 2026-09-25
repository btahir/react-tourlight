// Live, voluntary support links. Keep payments outside the package runtime.
export const support = {
  once: 'https://buy.stripe.com/fZu14m0FO3v050PfqP3ks00',
  portal: 'https://billing.stripe.com/p/login/fZu14m0FO3v050PfqP3ks00',
  monthly: [
    { name: 'Supporter', amount: 5, url: 'https://buy.stripe.com/9B68wOewEaXsgJxdiH3ks01' },
    { name: 'Backer', amount: 15, url: 'https://buy.stripe.com/7sYbJ088g3v0gJx4Mb3ks02' },
    { name: 'Sponsor', amount: 50, url: 'https://buy.stripe.com/28EeVc88g5D80Kz2E33ks03' },
    { name: 'Company', amount: 100, url: 'https://buy.stripe.com/00w14m6088PkbpdceD3ks04' },
  ],
} as const
