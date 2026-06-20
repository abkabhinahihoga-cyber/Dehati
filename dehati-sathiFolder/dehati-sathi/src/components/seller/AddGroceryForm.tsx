'use client'
import { Loader2, Upload, X, IndianRupee, CheckCircle, PackageSearch } from 'lucide-react'
import React, { ChangeEvent, FormEvent, useState, useEffect } from 'react'
import Image from 'next/image'
import axios from 'axios'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'

interface MandiBhav {
  retailPrice: number
  retailMinPrice: number
  retailMaxPrice: number
  wholesalePrice: number
  wholesaleMinPrice: number
  wholesaleMaxPrice: number
}

interface ProductOption {
  _id: string
  name: string
  nameHindi: string
  category: string
  unit: string
  image: string
  description: string
  mandiBhav: MandiBhav
}

function AddGroceryForm() {
  const router = useRouter()
  const pathname = usePathname()
  const isHindi = pathname.startsWith('/hi')

  const [options, setOptions] = useState<ProductOption[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null)
  const [loading, setLoading] = useState(false)
  const [description, setDescription] = useState('')
  const [stock, setStock] = useState('')
  const [retailPrice, setRetailPrice] = useState('')
  const [wholesalePrice, setWholesalePrice] = useState('')
  const [qualityScale, setQualityScale] = useState(5)
  const [previews, setPreviews] = useState<string[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [videoDuration, setVideoDuration] = useState<number>(0)
  
  // Video Upload Progress State
  const [uploadProgress, setUploadProgress] = useState(0)
  const [timeLeft, setTimeLeft] = useState<string | null>(null)
  const uploadStartTime = React.useRef<number>(0)

  const t = {
    selectProduct: isHindi ? 'बेचने के लिए उत्पाद चुनें' : 'Select Product to Sell',
    selectHint: isHindi ? 'अपने हब मैनेजर द्वारा सक्षम उत्पादों में से चुनें।' : 'Choose from the products currently enabled by your Hub Manager.',
    noProducts: isHindi ? 'आपके हब ने अभी तक कोई उत्पाद सक्षम नहीं किया है।' : 'Your hub has not enabled any products yet.',
    contactHub: isHindi ? 'कृपया अपने हब मैनेजर से संपर्क करें।' : 'Please contact your hub manager.',
    qualityScale: isHindi ? 'गुणवत्ता पैमाना (1-10)' : 'Quality Scale (1-10)',
    description: isHindi ? 'विवरण (ताजगी, कटाई की तारीख आदि)' : 'Description (freshness, harvest date...)',
    stock: isHindi ? 'स्टॉक मात्रा' : 'Stock Qty',
    pricingDetails: isHindi ? 'मूल्य निर्धारण विवरण' : 'Pricing Details',
    mandiRetail: isHindi ? 'मंडी खुदरा मूल्य:' : 'Mandi Retail Price:',
    mandiWholesale: isHindi ? 'मंडी थोक मूल्य:' : 'Mandi Wholesale Price:',
    setRetailPrice: isHindi ? 'आपका खुदरा विक्रय मूल्य (Retail Price):' : 'Your Retail Selling Price:',
    setWholesalePrice: isHindi ? 'आपका थोक विक्रय मूल्य (Wholesale Price):' : 'Your Wholesale Selling Price:',
    photos: isHindi ? 'उत्पाद की वास्तविक तस्वीरें' : 'Real Photos of Your Produce',
    add: isHindi ? 'जोड़ें' : 'Add',
    publish: isHindi ? 'बिक्री के लिए उत्पाद सूचीबद्ध करें' : 'List Product for Sale',
    publishing: isHindi ? 'प्रकाशित किया जा रहा है...' : 'Publishing...',
    addPhotoError: isHindi ? 'कृपया बेचने के लिए कम से कम 1 वास्तविक फोटो जोड़ें।' : 'Please add at least 1 real photo to sell.',
    selected: isHindi ? 'चयनित' : 'Selected',
    category: isHindi ? 'श्रेणी' : 'Category',
    unit: isHindi ? 'इकाई' : 'Unit',
    retailRange: isHindi ? 'खुदरा सीमा' : 'Retail Range',
    wholesaleRange: isHindi ? 'थोक सीमा' : 'Wholesale Range',
    videoTitle: isHindi ? 'उत्पाद का लाइव वीडियो (15 सेकंड, वैकल्पिक)' : 'Live Product Video (15 sec, Optional)',
    videoHint: isHindi ? 'अपने उत्पाद का एक छोटा वीडियो अपलोड करें - इससे बिक्री बढ़ती है!' : 'Upload a short video of your product - boosts sales!',
    videoDurationError: isHindi ? 'वीडियो 15 सेकंड से कम होना चाहिए।' : 'Video must be 15 seconds or less.',
    removeVideo: isHindi ? 'वीडियो हटाएं' : 'Remove Video',
    addVideo: isHindi ? 'वीडियो जोड़ें' : 'Add Video',
  }

  useEffect(() => {
    fetchOptions()
  }, [])

  const fetchOptions = async () => {
    try {
      const { data } = await axios.get('/api/seller/product-options')
      if (data.success) setOptions(data.products)
    } catch {
      toast.error(isHindi ? 'उत्पाद सूची लोड करने में विफल' : 'Failed to load product catalog')
    } finally {
      setLoadingOptions(false)
    }
  }

  const handleSelectProduct = (product: ProductOption) => {
    setSelectedProduct(product)
    setDescription(product.description || '')
    setRetailPrice(product.mandiBhav?.retailPrice?.toString() || '')
    setWholesalePrice(product.mandiBhav?.wholesalePrice?.toString() || '')
    setQualityScale(5)
    setStock('')
    setPreviews([])
    setImageFiles([])
  }

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setImageFiles(prev => [...prev, ...files])
    setPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
  }

  const handleVideoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    // Check video duration
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.src = url
    video.onloadedmetadata = () => {
      if (video.duration > 15) {
        toast.error(t.videoDurationError || 'Video must be 15 seconds or less.')
        URL.revokeObjectURL(url)
        return
      }
      setVideoFile(file)
      setVideoPreview(url)
      setVideoDuration(Math.round(video.duration))
    }
  }

  const removeVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview)
    setVideoFile(null)
    setVideoPreview(null)
    setVideoDuration(0)
  }

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previews[index])
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return
    if (imageFiles.length === 0) return toast.error(t.addPhotoError)

    setLoading(true)
    
    try {
      let finalVideoUrl = "";

      // --- CLOUDINARY DIRECT UPLOAD FOR VIDEO ---
      if (videoFile) {
        setUploadProgress(0)
        setTimeLeft("Calculating...")
        uploadStartTime.current = Date.now()

        // 1. Get Signature
        const timestamp = Math.round((new Date()).getTime() / 1000);
        const paramsToSign = {
            timestamp: timestamp,
            folder: "dehati_reels",
            eager: "w_300,h_300,c_pad,ac_none", 
        };

        const signRes = await axios.post("/api/auth/cloudinary-sign", { paramsToSign });
        const { signature, apiKey, cloudName } = signRes.data;

        if (!apiKey || !cloudName) throw new Error("Server configuration error for Cloudinary");

        // 2. Upload Video directly to Cloudinary
        const clFormData = new FormData();
        clFormData.append("file", videoFile);
        clFormData.append("api_key", apiKey);
        clFormData.append("timestamp", timestamp.toString());
        clFormData.append("signature", signature);
        clFormData.append("folder", "dehati_reels");
        clFormData.append("eager", "w_300,h_300,c_pad,ac_none");

        const uploadRes = await axios.post(
            `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, 
            clFormData, 
            {
                onUploadProgress: (progressEvent) => {
                    const total = progressEvent.total || 0;
                    const current = progressEvent.loaded;
                    const percent = Math.round((current * 100) / total);
                    setUploadProgress(percent);

                    if (percent > 0 && percent < 100) {
                        const timeElapsed = (Date.now() - uploadStartTime.current) / 1000;
                        const uploadSpeed = current / timeElapsed; 
                        const remainingBytes = total - current;
                        if (uploadSpeed > 0) {
                            const secondsLeft = Math.round(remainingBytes / uploadSpeed);
                            setTimeLeft(secondsLeft < 60 ? `${secondsLeft}s remaining` : `${Math.ceil(secondsLeft / 60)}m remaining`);
                        }
                    } else if (percent === 100) {
                        setTimeLeft("Processing video...");
                    }
                }
            }
        );

        finalVideoUrl = uploadRes.data.secure_url;
      }

      // --- FORM DATA TO BACKEND ---
      const formData = new FormData()
      formData.append('name', selectedProduct.name)
      formData.append('category', selectedProduct.category)
      formData.append('unit', selectedProduct.unit)
      formData.append('masterProductId', selectedProduct._id)
      formData.append('description', description)
      formData.append('stock', stock)
      formData.append('price', retailPrice)
      formData.append('retailPrice', retailPrice)
      formData.append('wholesalePrice', wholesalePrice)
      formData.append('qualityScale', qualityScale.toString())
      formData.append('productType', 'grocery')
      if (finalVideoUrl) formData.append('videoUrl', finalVideoUrl)
      
      imageFiles.forEach(file => formData.append('images', file))

      await axios.post('/api/seller/add-product', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      toast.success(isHindi ? 'उत्पाद सफलतापूर्वक जोड़ा गया!' : 'Grocery Item Added Successfully!')
      router.push('/seller/dashboard')
    } catch (error: any) {
      console.error("Upload failed", error);
      if (error.code === 'ECONNABORTED') toast.error("Upload timed out. Check internet.");
      else toast.error('Failed: ' + (error.response?.data?.error || error.message || 'Server Error'));
    } finally {
      setLoading(false)
      setUploadProgress(0)
      setTimeLeft(null)
    }
  }

  const getQualityText = (val: number) => {
    if (isHindi) {
      if (val <= 2) return 'खराब (1-2)'
      if (val <= 4) return 'ठीक (3-4)'
      if (val <= 6) return 'औसत (5-6)'
      if (val <= 8) return 'अच्छा (7-8)'
      return 'बहुत अच्छा (9-10)'
    }
    if (val <= 2) return 'Bad (1-2)'
    if (val <= 4) return 'Ok (3-4)'
    if (val <= 6) return 'Average (5-6)'
    if (val <= 8) return 'Good (7-8)'
    return 'Very Good (9-10)'
  }

  const getQualityColor = (val: number) => {
    if (val <= 2) return 'text-red-500'
    if (val <= 4) return 'text-orange-500'
    if (val <= 6) return 'text-yellow-600'
    if (val <= 8) return 'text-emerald-500'
    return 'text-green-600'
  }

  if (loadingOptions) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-green-500" /></div>
  }

  // ======== PRODUCT SELECTION SCREEN ========
  if (!selectedProduct) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 rounded-2xl p-5 border border-green-200">
          <h3 className="text-green-800 font-bold text-lg mb-2 flex items-center gap-2">
            <PackageSearch className="w-5 h-5" /> {t.selectProduct}
          </h3>
          <p className="text-green-700 text-sm">{t.selectHint}</p>
        </div>

        {options.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p>{t.noProducts}</p>
            <p className="text-sm">{t.contactHub}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {options.map(p => (
              <button
                key={p._id}
                onClick={() => handleSelectProduct(p)}
                className="bg-white rounded-2xl border hover:border-green-400 hover:shadow-md transition-all p-3 text-left group"
              >
                <div className="w-full h-24 bg-gray-50 rounded-xl overflow-hidden mb-3 relative">
                  {p.image ? (
                    <Image src={p.image} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform" />
                  ) : <div className="flex items-center justify-center h-full text-2xl">🌿</div>}
                </div>
                <div className="font-bold text-gray-800 text-sm truncate">
                  {isHindi && p.nameHindi ? p.nameHindi : p.name}
                </div>
                {p.nameHindi && (
                  <div className="text-gray-500 text-xs truncate">
                    {isHindi ? p.name : p.nameHindi}
                  </div>
                )}
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{p.category}</span>
                  <span className="text-xs font-bold text-green-600">
                    R: ₹{p.mandiBhav?.retailPrice || 0}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ======== FORM SCREEN (after product selected) ========
  return (
    <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
      {/* LEFT COLUMN */}
      <div className="space-y-6">
        {/* Selected Product Card */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex gap-4 items-center relative">
          <button
            type="button"
            onClick={() => setSelectedProduct(null)}
            className="absolute top-2 right-2 text-green-700 hover:bg-green-200 p-1 rounded-full transition"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-white flex-shrink-0 relative">
            {selectedProduct.image ? (
              <Image src={selectedProduct.image} alt={selectedProduct.name} fill className="object-cover" />
            ) : <div className="flex items-center justify-center h-full text-xl">🌿</div>}
          </div>
          <div>
            <div className="font-bold text-green-900">
              {isHindi && selectedProduct.nameHindi ? selectedProduct.nameHindi : selectedProduct.name}
              {selectedProduct.nameHindi && (
                <span className="text-green-700 text-sm font-normal ml-1">
                  ({isHindi ? selectedProduct.name : selectedProduct.nameHindi})
                </span>
              )}
            </div>
            <div className="text-sm text-green-700">
              {t.category}: <strong>{selectedProduct.category}</strong> • {t.unit}: <strong>{selectedProduct.unit}</strong>
            </div>
          </div>
        </div>

        {/* Quality Scale */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2">{t.qualityScale}</label>
          <div className="bg-gray-50 p-4 rounded-xl border">
            <input
              type="range"
              min="1" max="10"
              value={qualityScale}
              onChange={e => setQualityScale(parseInt(e.target.value))}
              className="w-full accent-green-600 mb-2"
            />
            <div className="flex justify-between text-xs text-gray-400 font-bold px-1">
              <span>1</span><span>5</span><span>10</span>
            </div>
            <div className={`text-center font-bold text-sm mt-3 ${getQualityColor(qualityScale)}`}>
              {t.selected}: {getQualityText(qualityScale)}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            {isHindi ? 'विवरण' : 'Description'}
          </label>
          <textarea
            rows={3}
            placeholder={t.description}
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white transition resize-none"
          />
        </div>

        {/* Stock */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            {t.stock} ({isHindi ? `प्रति ${selectedProduct.unit}` : `in ${selectedProduct.unit}s`})
          </label>
          <input
            type="number"
            required
            placeholder="e.g. 100"
            value={stock}
            onChange={e => setStock(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="space-y-6">
        {/* Pricing */}
        <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100">
          <h3 className="text-emerald-800 font-bold mb-4 flex items-center gap-2">
            <IndianRupee className="w-4 h-4" /> {t.pricingDetails}
          </h3>

          {/* Mandi Reference Prices */}
          <div className="mb-4 bg-white p-3 rounded-xl border border-emerald-100 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600 font-bold">{t.mandiRetail}</div>
              <div className="font-bold text-blue-600 text-lg">
                ₹{selectedProduct.mandiBhav?.retailPrice || 0}
                <span className="text-sm font-normal"> / {selectedProduct.unit}</span>
              </div>
            </div>
            <div className="flex justify-between items-center border-t border-emerald-50 pt-2">
              <div className="text-sm text-gray-600 font-bold">{t.mandiWholesale}</div>
              <div className="font-bold text-purple-600 text-lg">
                ₹{selectedProduct.mandiBhav?.wholesalePrice || 0}
                <span className="text-sm font-normal"> / {selectedProduct.unit}</span>
              </div>
            </div>
          </div>

          {/* Retail Price Input */}
          <div className="text-xs text-emerald-700 mb-1">{t.setRetailPrice}</div>
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
            <input
              type="number"
              required
              placeholder={isHindi ? 'खुदरा मूल्य' : 'Retail Price'}
              value={retailPrice}
              onChange={e => setRetailPrice(e.target.value)}
              className="w-full border-2 border-emerald-200 rounded-xl pl-8 pr-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none font-bold text-lg"
            />
          </div>

          {/* Wholesale Price Input */}
          <div className="text-xs text-emerald-700 mb-1">{t.setWholesalePrice}</div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
            <input
              type="number"
              required
              placeholder={isHindi ? 'थोक मूल्य' : 'Wholesale Price'}
              value={wholesalePrice}
              onChange={e => setWholesalePrice(e.target.value)}
              className="w-full border-2 border-emerald-200 rounded-xl pl-8 pr-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none font-bold text-lg"
            />
          </div>

          {/* Price Range Hint */}
          {(selectedProduct.mandiBhav?.retailMinPrice > 0 || selectedProduct.mandiBhav?.retailMaxPrice > 0) && (
            <div className="mt-4 text-[10px] text-emerald-600 bg-emerald-100/50 p-2 rounded-lg flex flex-col gap-1">
              <div className="flex justify-between">
                <span>{t.retailRange}: ₹{selectedProduct.mandiBhav.retailMinPrice} - ₹{selectedProduct.mandiBhav.retailMaxPrice}</span>
                <span>{t.wholesaleRange}: ₹{selectedProduct.mandiBhav.wholesaleMinPrice} - ₹{selectedProduct.mandiBhav.wholesaleMaxPrice}</span>
              </div>
            </div>
          )}
        </div>

        {/* Photos */}
        <div>
          <label className="block text-gray-700 font-semibold mb-3">{t.photos}</label>
          <div className="flex flex-wrap gap-3">
            <label className="cursor-pointer flex flex-col items-center justify-center w-24 h-24 bg-gray-50 border-2 border-dashed border-green-300 rounded-xl hover:bg-green-50 transition-all text-green-600">
              <Upload className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{t.add}</span>
              <input type="file" multiple accept="image/*" hidden onChange={handleImageChange} />
            </label>
            {previews.map((src, i) => (
              <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                <Image src={src} fill alt="preview" className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Optional Video Upload */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-orange-600 text-lg">🎥</span>
            <label className="block text-gray-700 font-semibold text-sm">{t.videoTitle}</label>
          </div>
          <p className="text-xs text-orange-700 mb-3">{t.videoHint}</p>
          {videoPreview ? (
            <div className="relative">
              <video src={videoPreview} controls className="w-full rounded-lg border border-orange-200" style={{maxHeight: '160px'}} />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">{videoDuration}s</span>
                <button
                  type="button"
                  onClick={removeVideo}
                  className="flex items-center gap-1 text-red-500 text-xs font-semibold hover:underline"
                >
                  <X className="w-3 h-3" /> {t.removeVideo}
                </button>
              </div>
            </div>
          ) : (
            <label className="cursor-pointer flex items-center gap-2 justify-center w-full h-14 bg-white border-2 border-dashed border-orange-300 rounded-xl hover:bg-orange-50 transition-all text-orange-600">
              <Upload className="w-5 h-5" />
              <span className="text-sm font-medium">{t.addVideo}</span>
              <input type="file" accept="video/*" hidden onChange={handleVideoChange} />
            </label>
          )}
        </div>

        {/* Submit Button */}
        {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="py-2 space-y-2 bg-orange-50 p-4 rounded-xl mt-4">
                <div className="flex justify-between text-xs font-bold text-orange-800">
                    <span>{t.publishing} (Video)</span>
                    <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-white rounded-full h-2.5 overflow-hidden border border-orange-200">
                    <div className="bg-orange-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-xs text-orange-700 font-medium pt-1">
                    <span>⏳ {timeLeft || "Estimating..."}</span>
                </div>
            </div>
        )}

        <button
          disabled={loading || imageFiles.length === 0}
          className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="animate-spin" /> : <CheckCircle className="w-5 h-5" />}
          {loading ? t.publishing : t.publish}
        </button>
        {imageFiles.length === 0 && (
          <p className="text-xs text-red-500 text-center mt-2">{t.addPhotoError}</p>
        )}
      </div>
    </form>
  )
}

export default AddGroceryForm