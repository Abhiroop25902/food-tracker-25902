import { useState } from 'react';
import { storage, auth } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, X, Loader2 } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = 'https://meal-api-527102117645.us-central1.run.app';

const Upload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!file || !auth.currentUser) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `food-pics/${auth.currentUser.uid}/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const publicUrl = await getDownloadURL(storageRef);

      await axios.post(`${BACKEND_URL}/api/meals`, {
        imageUrl: publicUrl,
        userId: auth.currentUser.uid,
        description,
        timestamp: new Date().toISOString(),
      });

      navigate('/');
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Analyze Your Meal</h2>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        {!preview ? (
          <label className="border-2 border-dashed border-gray-300 rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all group">
            <UploadIcon className="w-12 h-12 text-gray-400 group-hover:text-indigo-500 mb-4" />
            <span className="text-gray-600 font-medium">Click to upload or drag and drop</span>
            <span className="text-gray-400 text-sm mt-1">PNG, JPG or JPEG</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>
        ) : (
          <div className="space-y-6">
            <div className="relative">
              <img src={preview} alt="Preview" className="w-full h-80 object-cover rounded-xl" />
              <button 
                onClick={() => { setFile(null); setPreview(null); }}
                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
              >
                <X size={20} />
              </button>
            </div>
<div>
  <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
    Add context (optional)
  </label>
  <textarea
    id="description"
    rows={3}
    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-none"
    placeholder="e.g., 'Two rotis (one hidden), large bowl of dal, and salad'"
    value={description}
    onChange={(e) => setDescription(e.target.value)}
  />
</div>
</div>
)}

<button
onClick={handleUpload}
disabled={!file || uploading}
          className={`w-full mt-6 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition ${
            !file || uploading 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <span>Start Analysis</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Upload;
