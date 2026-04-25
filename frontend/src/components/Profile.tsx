import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import type { UserProfile } from '../types/UserProfile';
import { User, Scale, Ruler, Calendar, Activity, LogOut, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const navigate = useNavigate();

  // Form states
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [goal, setGoal] = useState<'maintain' | 'lose' | 'gain' | 'custom'>('maintain');
  const [customTarget, setCustomTarget] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as UserProfile;
          setProfile(data);
          setWeight(data.weight.toString());
          setHeight(data.height.toString());
          setAge(data.age.toString());
          setGender(data.gender);
          
          // Determine goal based on bmr and dailyCalorieTarget if available
          if (data.dailyCalorieTarget) {
            const diff = data.dailyCalorieTarget - data.bmr;
            if (Math.abs(diff) < 10) setGoal('maintain');
            else if (Math.abs(diff + 500) < 10) setGoal('lose');
            else if (Math.abs(diff - 500) < 10) setGoal('gain');
            else {
              setGoal('custom');
              setCustomTarget(data.dailyCalorieTarget.toString());
            }
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const calculateBMR = (w: number, h: number, a: number, g: string) => {
    if (g === 'male') return 10 * w + 6.25 * h - 5 * a + 5;
    if (g === 'female') return 10 * w + 6.25 * h - 5 * a - 161;
    return (10 * w + 6.25 * h - 5 * a + 5 + (10 * w + 6.25 * h - 5 * a - 161)) / 2;
  };

  const handleUpdate = async (formData: FormData) => {
    if (!auth.currentUser || !profile) return;

    setSaving(true);
    const weightVal = formData.get('weight') as string;
    const heightVal = formData.get('height') as string;
    const ageVal = formData.get('age') as string;
    const genderVal = formData.get('gender') as 'male' | 'female' | 'other';
    const goalVal = formData.get('goal') as 'maintain' | 'lose' | 'gain' | 'custom';

    const w = parseFloat(weightVal);
    const h = parseFloat(heightVal);
    const a = parseInt(ageVal);
    const bmr = calculateBMR(w, h, a, genderVal);
    
    let dailyCalorieTarget = bmr;
    if (goalVal === 'lose') dailyCalorieTarget = bmr - 500;
    else if (goalVal === 'gain') dailyCalorieTarget = bmr + 500;
    else if (goalVal === 'custom') dailyCalorieTarget = parseFloat(customTarget) || bmr;

    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        weight: w,
        height: h,
        age: a,
        gender: genderVal,
        bmr,
        dailyCalorieTarget
      });
      setProfile({ ...profile, weight: w, height: h, age: a, gender: genderVal, bmr, dailyCalorieTarget });
      setEditMode(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-indigo-600 h-32 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-md">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-full h-full p-4 text-gray-400" />
              )}
            </div>
          </div>
        </div>

        <div className="pt-16 pb-8 px-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{profile?.displayName || 'User'}</h1>
              <p className="text-gray-500">{auth.currentUser?.email}</p>
            </div>
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition font-medium"
              >
                Edit Profile
              </button>
            )}
          </div>

          {!editMode ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-xl flex items-center space-x-4">
                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                  <Scale size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Weight</p>
                  <p className="font-semibold text-lg">{profile?.weight} kg</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl flex items-center space-x-4">
                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                  <Ruler size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Height</p>
                  <p className="font-semibold text-lg">{profile?.height} cm</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl flex items-center space-x-4">
                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                  <Calendar size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Age</p>
                  <p className="font-semibold text-lg">{profile?.age} years</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl flex items-center space-x-4">
                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                  <Activity size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Daily Target</p>
                  <p className="font-semibold text-lg text-indigo-600">{Math.round(profile?.dailyCalorieTarget || profile?.bmr || 0)} kcal/day</p>
                </div>
              </div>
            </div>
          ) : (
            <form action={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input
                    name="weight"
                    type="number"
                    step="0.1"
                    required
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                  <input
                    name="height"
                    type="number"
                    required
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    name="age"
                    type="number"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    name="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other')}
                    className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Goal</label>
                  <select
                    name="goal"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as 'maintain' | 'lose' | 'gain' | 'custom')}
                    className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
                  >
                    <option value="maintain">Maintain Weight</option>
                    <option value="lose">Weight Loss (-500 kcal)</option>
                    <option value="gain">Bulking (+500 kcal)</option>
                    <option value="custom">Custom Target</option>
                  </select>
                </div>
                {goal === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom Target</label>
                    <input
                      type="number"
                      required
                      value={customTarget}
                      onChange={(e) => setCustomTarget(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                )}
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center space-x-2"
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 bg-red-600 text-white hover:bg-red-700 px-8 py-3 rounded-xl transition font-bold shadow-md shadow-red-100"
        >
          <LogOut size={20} />
          <span>Logout of Mindful Bites</span>
        </button>
      </div>
    </div>
  );
};

export default Profile;
