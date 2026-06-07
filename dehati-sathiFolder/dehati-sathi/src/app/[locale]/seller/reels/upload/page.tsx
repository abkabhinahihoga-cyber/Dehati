'use client'
import React, { useState } from 'react'
import { Upload, X, Video as VideoIcon, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import axios from 'axios'

export default function UploadReelPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>("");
    const [description, setDescription] = useState("");
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            if (selected.size > 50 * 1024 * 1024) { // 50MB Limit
                toast.error("File too large (Max 50MB)");
                return;
            }
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
        }
    };

    const handleUpload = async () => {
        if (!file || !description) return toast.error("Please add a video and description");

        try {
            setUploading(true);
            setProgress(0);

            // 1. Prepare Upload Parameters
            const timestamp = Math.round((new Date()).getTime() / 1000);
            const paramsToSign = {
                timestamp: timestamp,
                folder: "dehati_reels",
                eager: "w_300,h_300,c_pad,ac_none", // Create thumbnail instantly
            };

            // 2. Get Signature AND Keys from Server
            const signRes = await axios.post("/api/auth/cloudinary-sign", { paramsToSign });
            const { signature, apiKey, cloudName } = signRes.data; // <--- Keys come from API now

            if (!apiKey || !cloudName) throw new Error("Server failed to provide Cloudinary keys");

            // 3. Upload Directly to Cloudinary
            const formData = new FormData();
            formData.append("file", file);
            formData.append("api_key", apiKey); // Use key from API
            formData.append("timestamp", timestamp.toString());
            formData.append("signature", signature);
            formData.append("folder", "dehati_reels");
            formData.append("eager", "w_300,h_300,c_pad,ac_none");

            const uploadRes = await axios.post(
                `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
                formData,
                {
                    onUploadProgress: (p) => {
                        if (p.total) setProgress(Math.round((p.loaded * 100) / p.total));
                    }
                }
            );

            const { secure_url, eager } = uploadRes.data;
            const thumbnailUrl = eager?.[0]?.secure_url || secure_url.replace(/\.[^/.]+$/, ".jpg");

            // 4. Save Metadata to Your Database
            await axios.post("/api/seller/reels/upload", {
                videoUrl: secure_url,
                thumbnailUrl: thumbnailUrl,
                description: description,
            });

            toast.success("Reel Uploaded Successfully! 🎉");
            router.push("/reels"); 

        } catch (error: any) {
            console.error(error);
            toast.error("Upload Failed: " + (error.response?.data?.message || error.message));
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Upload Reel</h1>

            <div className="mb-6">
                {!preview ? (
                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:bg-gray-50 transition">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-10 h-10 text-gray-400 mb-3" />
                            <p className="text-sm text-gray-500 font-medium">Click to upload video</p>
                            <p className="text-xs text-gray-400 mt-1">MP4, WebM (Max 50MB)</p>
                        </div>
                        <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
                    </label>
                ) : (
                    <div className="relative w-full h-64 bg-black rounded-2xl overflow-hidden">
                        <video src={preview} className="w-full h-full object-contain" controls />
                        <button 
                            onClick={() => { setFile(null); setPreview(""); }}
                            className="absolute top-2 right-2 p-1 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-red-500/80 transition"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell everyone about this product..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none transition h-32 resize-none"
                />
            </div>

            <button
                onClick={handleUpload}
                disabled={uploading || !file}
                className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${
                    uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 active:scale-95'
                }`}
            >
                {uploading ? (
                    <>
                        <Loader2 className="animate-spin" />
                        Uploading {progress}%
                    </>
                ) : (
                    <>
                        <VideoIcon size={20} />
                        Post Reel
                    </>
                )}
            </button>
        </div>
    )
}