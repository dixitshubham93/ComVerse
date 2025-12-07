import { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Calendar, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../contexts/AuthContext';
import { ImageUpload } from './ImageUpload';
import { signup as signupApi, login as loginApi, ApiResponse } from '../api/authApi';

interface AuthCardProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export function AuthCard({ isOpen, onClose, initialMode = 'signin' }: AuthCardProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [signupStep, setSignupStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Sign In fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up Step 1 fields
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>('');

  // Sign Up Step 2 fields
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { login, signup, loginWithGoogle } = useAuth();

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (!isOpen) {
      setMode(initialMode);
      setSignupStep(1);
      setEmail('');
      setPassword('');
      setUsername('');
      setAge('');
      setAvatarFile(null);
      setAvatarPreview('');
      setBannerFile(null);
      setBannerPreview('');
      setSignupEmail('');
      setSignupPassword('');
      setConfirmPassword('');
      setError('');
      setFieldErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
    } else {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response: ApiResponse<any> = await loginApi({ email, password });
      if (response.success && response.data) {
        await login(email, password);
        onClose();
      } else {
        setError(response.message || 'Invalid email or password');
      }
    } catch (err: any) {
      if (err.message) {
        setError(err.message);
      } else if (err.errors) {
        setFieldErrors(err.errors);
        setError(err.message || 'Some fields are invalid.');
      } else {
        setError('Invalid email or password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpStep1 = () => {
    if (!username || !age || !avatarFile) {
      setError('Please fill in all fields and upload an avatar');
      return;
    }
    setError('');
    setSignupStep(2);
  };

  const handleSignUpStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!signupEmail || !signupPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match');
      setFieldErrors({ password: 'Passwords do not match' });
      return;
    }

    if (signupPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setFieldErrors({ password: 'Password must be at least 8 characters long' });
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Upload avatar to Cloudinary via backend API
      // Example: const avatarUrl = await uploadViaBackend(avatarFile);
      // For now, use preview URL (backend will handle actual Cloudinary upload)
      let avatarUrl = avatarPreview;
      
      if (avatarFile && !avatarPreview) {
        // Create temporary preview URL
        avatarUrl = URL.createObjectURL(avatarFile);
      }
      
      let bannerUrl = bannerPreview;
      
      if (bannerFile && !bannerPreview) {
        // Create temporary preview URL
        bannerUrl = URL.createObjectURL(bannerFile);
      }
      
      // Call the new auth API
      const response: ApiResponse<any> = await signupApi({
        username,
        email: signupEmail,
        password: signupPassword,
        avatarUrl: avatarUrl || '',
        bannerUrl: bannerUrl || '',
        age: parseInt(age),
      });

      if (response.success && response.data) {
        await signup(username, signupEmail, signupPassword, parseInt(age), avatarUrl || '', bannerUrl || '');
        onClose();
      } else {
        setError(response.message || 'Failed to create account. Please try again.');
        if (response.errors) {
          setFieldErrors(response.errors);
        }
      }
    } catch (err: any) {
      if (err.message) {
        setError(err.message);
      } else if (err.errors) {
        setFieldErrors(err.errors);
        setError(err.message || 'Some fields are invalid.');
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      onClose();
    } catch (err) {
      setError('Google authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-md p-0 border-0 overflow-hidden"
        style={{
          background: 'rgba(4, 55, 47, 0.25)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(40, 245, 204, 0.3)',
          boxShadow: '0 0 30px rgba(40, 245, 204, 0.2), 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 60px rgba(40, 245, 204, 0.1)',
        }}
        onEscapeKeyDown={onClose}
      >
        <div className="relative p-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#747c88] hover:text-[#28f5cc] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2 glow-text">
              {mode === 'signin' ? 'Sign In' : signupStep === 1 ? 'Create Account' : 'Complete Sign Up'}
            </h2>
            <p className="text-[#747c88] text-sm">
              {mode === 'signin' 
                ? 'Welcome back to ComVerse' 
                : signupStep === 1 
                  ? 'Start your cosmic journey' 
                  : 'Final step to join the universe'}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Sign In Form */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-[#747c88] mb-2 block">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#747c88]" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                    }}
                    className={`pl-10 bg-[#2a3444]/50 border-[#747c88]/30 text-white placeholder:text-[#747c88]/50 focus:border-[#28f5cc] focus:ring-[#28f5cc]/20 ${
                      fieldErrors.email ? 'border-red-500/50' : ''
                    }`}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password" className="text-[#747c88] mb-2 block">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#747c88]" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                    }}
                    className={`pl-10 pr-10 bg-[#2a3444]/50 border-[#747c88]/30 text-white placeholder:text-[#747c88]/50 focus:border-[#28f5cc] focus:ring-[#28f5cc]/20 ${
                      fieldErrors.password ? 'border-red-500/50' : ''
                    }`}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#747c88] hover:text-[#28f5cc]"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  className="text-[#28f5cc] hover:text-[#04ad7b] transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#04ad7b] to-[#28f5cc] text-black font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ boxShadow: '0 0 20px rgba(40, 245, 204, 0.4)' }}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#747c88]/30"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-transparent text-[#747c88]">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full py-3 rounded-full border-2 border-[#747c88]/30 text-white hover:border-[#28f5cc] transition-all disabled:opacity-50"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </div>
              </button>

              <div className="text-center text-sm text-[#747c88]">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setSignupStep(1);
                    setError('');
                  }}
                  className="text-[#28f5cc] hover:text-[#04ad7b] font-semibold"
                >
                  Sign up
                </button>
              </div>
            </form>
          )}

          {/* Sign Up Step 1 */}
          {mode === 'signup' && signupStep === 1 && (
            <div className="space-y-6">
              <div>
                <Label className="text-[#747c88] mb-3 block text-center">
                  Upload Your Avatar
                </Label>
                <ImageUpload
                  onImageSelect={(file) => {
                    setAvatarFile(file);
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setAvatarPreview(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    } else {
                      setAvatarPreview('');
                    }
                  }}
                  currentImageUrl={avatarPreview}
                />
              </div>

              <div>
                <Label className="text-[#747c88] mb-3 block text-center">
                  Upload Your Banner (Optional)
                </Label>
                <ImageUpload
                  onImageSelect={(file) => {
                    setBannerFile(file);
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setBannerPreview(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    } else {
                      setBannerPreview('');
                    }
                  }}
                  currentImageUrl={bannerPreview}
                />
              </div>

              <div>
                <Label htmlFor="username" className="text-[#747c88] mb-2 block">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#747c88]" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: '' });
                    }}
                    className={`pl-10 bg-[#2a3444]/50 border-[#747c88]/30 text-white placeholder:text-[#747c88]/50 focus:border-[#28f5cc] focus:ring-[#28f5cc]/20 ${
                      fieldErrors.username ? 'border-red-500/50' : ''
                    }`}
                    placeholder="Choose a username"
                    required
                  />
                </div>
                {fieldErrors.username && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.username}</p>
                )}
              </div>

              <div>
                <Label htmlFor="age" className="text-[#747c88] mb-2 block">
                  Age
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#747c88]" />
                  <Input
                    id="age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="pl-10 bg-[#2a3444]/50 border-[#747c88]/30 text-white placeholder:text-[#747c88]/50 focus:border-[#28f5cc] focus:ring-[#28f5cc]/20"
                    placeholder="Enter your age"
                    min="13"
                    max="120"
                    required
                  />
                </div>
              </div>

              <button
                onClick={handleSignUpStep1}
                disabled={isLoading || !username || !age || !avatarFile}
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#04ad7b] to-[#28f5cc] text-black font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ boxShadow: '0 0 20px rgba(40, 245, 204, 0.4)' }}
              >
                Continue
              </button>

              <div className="text-center text-sm text-[#747c88]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError('');
                  }}
                  className="text-[#28f5cc] hover:text-[#04ad7b] font-semibold"
                >
                  Sign in
                </button>
              </div>
            </div>
          )}

          {/* Sign Up Step 2 */}
          {mode === 'signup' && signupStep === 2 && (
            <form onSubmit={handleSignUpStep2} className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setSignupStep(1);
                  setError('');
                }}
                className="text-[#28f5cc] hover:text-[#04ad7b] text-sm mb-2 flex items-center gap-1"
              >
                ← Back
              </button>

              <div>
                <Label htmlFor="signup-email" className="text-[#747c88] mb-2 block">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#747c88]" />
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => {
                      setSignupEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                    }}
                    className={`pl-10 bg-[#2a3444]/50 border-[#747c88]/30 text-white placeholder:text-[#747c88]/50 focus:border-[#28f5cc] focus:ring-[#28f5cc]/20 ${
                      fieldErrors.email ? 'border-red-500/50' : ''
                    }`}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="signup-password" className="text-[#747c88] mb-2 block">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#747c88]" />
                  <Input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    value={signupPassword}
                    onChange={(e) => {
                      setSignupPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                    }}
                    className={`pl-10 pr-10 bg-[#2a3444]/50 border-[#747c88]/30 text-white placeholder:text-[#747c88]/50 focus:border-[#28f5cc] focus:ring-[#28f5cc]/20 ${
                      fieldErrors.password ? 'border-red-500/50' : ''
                    }`}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#747c88] hover:text-[#28f5cc]"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.password}</p>
                )}
              </div>

              <div>
                <Label htmlFor="confirm-password" className="text-[#747c88] mb-2 block">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#747c88]" />
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                    }}
                    className={`pl-10 pr-10 bg-[#2a3444]/50 border-[#747c88]/30 text-white placeholder:text-[#747c88]/50 focus:border-[#28f5cc] focus:ring-[#28f5cc]/20 ${
                      fieldErrors.password ? 'border-red-500/50' : ''
                    }`}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#747c88] hover:text-[#28f5cc]"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#04ad7b] to-[#28f5cc] text-black font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ boxShadow: '0 0 20px rgba(40, 245, 204, 0.4)' }}
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#747c88]/30"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-transparent text-[#747c88]">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full py-3 rounded-full border-2 border-[#747c88]/30 text-white hover:border-[#28f5cc] transition-all disabled:opacity-50"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </div>
              </button>

              <div className="text-center text-sm text-[#747c88]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setSignupStep(1);
                    setError('');
                  }}
                  className="text-[#28f5cc] hover:text-[#04ad7b] font-semibold"
                >
                  Sign in
                </button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

