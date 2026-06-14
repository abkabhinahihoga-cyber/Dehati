'use client'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { usePathname } from 'next/navigation'
import { IndianRupee, Users, CheckCircle2, Loader2, AlertCircle, Copy, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface SellerSettlement {
  _id: string
  name: string
  mobile: string
  grossEarnings: number
  totalPaid: number
  pendingEarnings: number
  taxAmount: number
  netPayable: number
}

export default function HubSettlementPage() {
  const pathname = usePathname()
  const isHindi = pathname.startsWith('/hi')
  const [sellers, setSellers] = useState<SellerSettlement[]>([])
  const [loading, setLoading] = useState(true)
  const [settling, setSettling] = useState<string | null>(null)
  const [lastCode, setLastCode] = useState<{ code: string; seller: string } | null>(null)

  const t = {
    title: isHindi ? 'विक्रेता भुगतान निपटान' : 'Seller Payment Settlement',
    subtitle: isHindi ? 'अपने हब के विक्रेताओं का भुगतान व्यवस्थित करें' : 'Settle payments for sellers in your hub',
    gross: isHindi ? 'कुल कमाई' : 'Gross Earnings',
    paid: isHindi ? 'अब तक भुगतान' : 'Already Paid',
    pending: isHindi ? 'बकाया राशि' : 'Pending Amount',
    tax: isHindi ? '4% सरकारी कर' : '4% Govt. Tax',
    net: isHindi ? 'शुद्ध भुगतान' : 'Net Payable',
    settle: isHindi ? 'भुगतान करें' : 'Settle Payment',
    settling: isHindi ? 'प्रोसेस हो रहा है...' : 'Processing...',
    noPending: isHindi ? 'कोई बकाया नहीं' : 'No Pending',
    noSellers: isHindi ? 'कोई विक्रेता नहीं जुड़ा है।' : 'No sellers are linked to this hub yet.',
    codeGenerated: isHindi ? 'भुगतान कोड तैयार है!' : 'Payment Code Ready!',
    sendToSeller: isHindi ? 'यह कोड विक्रेता को भेजें:' : 'Share this code with seller:',
    copyCode: isHindi ? 'कोड कॉपी करें' : 'Copy Code',
    copied: isHindi ? 'कॉपी हो गया!' : 'Copied!',
    notificationSent: isHindi ? 'विक्रेता को नोटिफिकेशन भेज दी गई है।' : 'Notification sent to seller in-app.',
    refresh: isHindi ? 'रिफ्रेश करें' : 'Refresh',
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/hub/settle-payment')
      if (data.success) setSellers(data.sellers)
    } catch {
      toast.error(isHindi ? 'डेटा लोड करने में विफल' : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSettle = async (seller: SellerSettlement) => {
    if (seller.netPayable <= 0) {
      return toast.error(isHindi ? 'बकाया राशि शून्य है।' : 'No pending amount to settle.')
    }
    if (!confirm(
      isHindi
        ? `${seller.name} को ₹${seller.netPayable} (4% कर काटकर) भुगतान करें?`
        : `Settle ₹${seller.netPayable} (after 4% tax) to ${seller.name}?`
    )) return

    setSettling(seller._id)
    try {
      const { data } = await axios.post('/api/hub/settle-payment', {
        sellerId: seller._id,
        amount: seller.pendingEarnings,
        netPayable: seller.netPayable,
        taxAmount: seller.taxAmount,
      })
      if (data.success) {
        setLastCode({ code: data.code, seller: seller.name })
        toast.success(isHindi ? 'भुगतान सफलतापूर्वक हो गया!' : 'Payment settled successfully!')
        fetchData()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to settle')
    } finally {
      setSettling(null)
    }
  }

  const copyCode = () => {
    if (lastCode) {
      navigator.clipboard.writeText(lastCode.code)
      toast.success(t.copied)
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center min-h-[300px]">
      <Loader2 className="animate-spin w-8 h-8 text-indigo-500" />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <IndianRupee className="w-7 h-7 text-indigo-600" /> {t.title}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{t.subtitle}</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-semibold transition-all"
        >
          <RefreshCw className="w-4 h-4" /> {t.refresh}
        </button>
      </div>

      {/* Settlement Code Banner */}
      {lastCode && (
        <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-green-800 text-lg">{t.codeGenerated}</p>
              <p className="text-green-700 text-sm mt-1">{t.sendToSeller} <strong>{lastCode.seller}</strong></p>
              <div className="flex items-center gap-3 mt-3">
                <div className="bg-white border-2 border-green-400 rounded-xl px-6 py-3 font-mono text-3xl font-black text-green-800 tracking-widest shadow-inner">
                  {lastCode.code}
                </div>
                <button
                  onClick={copyCode}
                  className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-sm"
                >
                  <Copy className="w-4 h-4" /> {t.copyCode}
                </button>
              </div>
              <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {t.notificationSent}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tax Info Banner */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" />
        <p className="text-sm text-orange-700 font-medium">
          {isHindi
            ? 'सभी भुगतानों पर 4% सरकारी कर (Government Tax) काटा जाता है।'
            : '4% Government Tax is deducted from all settlements before payment.'}
        </p>
      </div>

      {/* Sellers List */}
      {sellers.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p>{t.noSellers}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sellers.map(seller => (
            <div key={seller._id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Seller Info */}
                <div className="flex justify-between items-center w-full md:w-auto">
                  <div>
                    <div className="font-bold text-gray-800 text-lg">{seller.name}</div>
                    <div className="text-sm text-gray-500">{seller.mobile}</div>
                  </div>
                  <div className="md:hidden">
                    {seller.netPayable <= 0 && (
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-500 font-semibold rounded-lg text-xs">
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> {t.noPending}
                      </span>
                    )}
                  </div>
                </div>

                {/* Earnings Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 w-full md:flex-1">
                  <div className="bg-blue-50 p-2 md:p-3 rounded-xl text-center">
                    <div className="text-[10px] text-blue-600 font-bold uppercase">{t.gross}</div>
                    <div className="text-blue-800 font-black text-sm mt-0.5">₹{seller.grossEarnings}</div>
                  </div>
                  <div className="bg-gray-50 p-2 md:p-3 rounded-xl text-center">
                    <div className="text-[10px] text-gray-500 font-bold uppercase">{t.paid}</div>
                    <div className="text-gray-700 font-black text-sm mt-0.5">₹{seller.totalPaid}</div>
                  </div>
                  <div className="bg-orange-50 p-2 md:p-3 rounded-xl text-center">
                    <div className="text-[10px] text-orange-600 font-bold uppercase">{t.pending}</div>
                    <div className="text-orange-700 font-black text-sm mt-0.5">₹{seller.pendingEarnings}</div>
                  </div>
                  <div className="bg-red-50 p-2 md:p-3 rounded-xl text-center">
                    <div className="text-[10px] text-red-500 font-bold uppercase">{t.tax}</div>
                    <div className="text-red-600 font-black text-sm mt-0.5">-₹{seller.taxAmount}</div>
                  </div>
                  <div className="bg-green-50 p-2 md:p-3 rounded-xl text-center col-span-2 sm:col-span-1 md:col-span-1">
                    <div className="text-[10px] text-green-600 font-bold uppercase">{t.net}</div>
                    <div className="text-green-700 font-black text-base mt-0.5">₹{seller.netPayable}</div>
                  </div>
                </div>

                {/* Settle Button */}
                <div className="flex items-center w-full md:w-auto mt-2 md:mt-0">
                  {seller.netPayable > 0 ? (
                    <button
                      onClick={() => handleSettle(seller)}
                      disabled={settling === seller._id}
                      className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 md:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-60 whitespace-nowrap"
                    >
                      {settling === seller._id
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> {t.settling}</>
                        : <><IndianRupee className="w-4 h-4" /> {t.settle}</>
                      }
                    </button>
                  ) : (
                    <span className="hidden md:flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-500 font-semibold rounded-xl text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500" /> {t.noPending}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
