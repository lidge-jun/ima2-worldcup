import { notFound } from 'next/navigation';
import QAClient from './QAClient';

// Dev-only diagnostic harness. Hidden in shipped/production builds so end users
// never reach it; available under `npm run dev`. NODE_ENV is build-constant, so
// the production bundle statically resolves this route to a 404.
export default function QAPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <QAClient />;
}
