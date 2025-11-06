import BillingDetail from '@/components/billing/BillingDetail'

export default function BillingDetailPage({
  params,
}: {
  params: { id: string }
}) {
  return <BillingDetail billingId={params.id} />
}

