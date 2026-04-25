import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { Camera } from 'lucide-react';

const Login = () => {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="bg-white p-12 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
        <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Camera className="text-indigo-600 w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold mb-2">MindfulBites</h1>
        <p className="text-gray-500 mb-10">Track your nutrition and mental well-being through your meals.</p>
        <button
          onClick={handleLogin}
          className="w-full bg-white border border-gray-300 py-3 px-4 rounded-lg flex items-center justify-center space-x-3 hover:bg-gray-50 transition shadow-sm"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          <span className="font-semibold text-gray-700">Continue with Google</span>
        </button>
      </div>
    </div>
  );
};

export default Login;
