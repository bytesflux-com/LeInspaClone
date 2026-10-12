import { useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import PaymentDrawer from '../../components/clients/payments/PaymentDrawer'
import ErrorState from '../../components/ui/ErrorState'
import { usePaymentPreview } from '../../hooks/useClientPayments'
import { useMarketContext } from '../../hooks/useMarketContext'
import { clientService } from '../../services/clientService'

// Payment Details (ADM-056 entry point). Every "View payment" link — client
// payments, provider subscription payments, bookings — lands here. Loads the
// live payment (payments or subscription_payments) through adminGetPaymentPreview,
// which resolves and scope-checks the owner server-side.
export default function PaymentDetails() {
  const { paymentId } = useParams()
  const location = useLocation()
  const { selectedMarket } = useMarketContext()
  const [nonce, setNonce] = useState(0)
  const { preview, error, loading } = usePaymentPreview(paymentId, undefined, selectedMarket?.id, nonce)
  const returnTo = location.state?.returnTo || null
  const linkState = useMemo(() => ({ returnTo: location.pathname }), [location.pathname])
  const owner = preview?.owner

  const saveNote = async (_id, text) => {
    await clientService.addPaymentNote({ clientId: owner?.id, paymentId, text })
    setNonce((n) => n + 1)
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-3 px-4 py-5 sm:px-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-[#6b6785]">
        {returnTo && (
          <>
            <Link to={returnTo} className="inline-flex items-center gap-1 font-semibold text-[#3b1fd6] hover:underline">
              <ArrowLeft className="size-3.5" /> Back
            </Link>
            <span>/</span>
          </>
        )}
        {owner?.id && (
          <>
            <Link to={owner.role === 'provider' ? `/providers/${owner.id}/subscription` : `/clients/${owner.id}/payments`} className="hover:underline">
              {owner.name || owner.id}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="font-semibold text-[#1b1140]">Payment {paymentId}</span>
      </nav>

      {error && !loading && <ErrorState title="Unable to load this payment" description={error} onRetry={() => setNonce((n) => n + 1)} />}
      {(loading || preview) && (
        <PaymentDrawer
          payment={preview || { id: paymentId, type: 'booking', status: 'pending' }}
          preview={preview}
          loading={loading}
          error={null}
          client={{ timeZone: preview?.timeZone, currency: preview?.currency }}
          onSaveNote={owner?.role === 'client' ? saveNote : undefined}
          links={{
            booking: preview?.bookingId ? `/bookings/${preview.bookingId}` : null,
            membership: owner?.role === 'provider' ? `/providers/${owner.id}/subscription` : owner?.id ? `/clients/${owner.id}/membership` : null,
            state: linkState,
          }}
        />
      )}
    </div>
  )
}
