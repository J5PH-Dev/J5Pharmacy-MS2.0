import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import logoJ5Pharmacy from '../assets/icon.png';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material'; // Importing icons
import { useAuth } from '../contexts/AuthContext'; // Import your AuthContext

const Login = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate(); // Initialize the navigate hook
  const { login } = useAuth(); // Assuming login function comes from AuthContext

  // Toggle Password Visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Handle Continue button click
  const handleContinueClick = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setError('');
    try {
      // Attempt login with employeeId and password
      await login(employeeId, password);
      navigate("/dashboard"); // Navigate to LoadingPage if login is successful
    } catch (err) {
      setError('Incorrect Employee ID or Password');
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  return (
    <div className="bg-[#FCFCFC] flex flex-col min-h-screen">
      <div className="flex flex-col justify-center items-center my-auto px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="relative mb-6">
          <img
            src={logoJ5Pharmacy}
            alt="Logo"
            className="w-[80px] h-[80px] object-contain"
          />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-gray-800">Sign In</h1>
        <p className="text-base text-gray-600 mt-1 mb-6">Access your account to manage the system</p>

        {/* Error Message Box */}
        {error && (
          <div className="w-full max-w-sm mb-4 px-4 py-2 bg-red-100 text-red-600 rounded-md border border-red-300">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="w-full max-w-sm">
          {/* Employee ID Input */}
          <TextField
            sx={{ marginBottom: 2 }}
            fullWidth
            id="employeeId"
            label="Employee ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            autoComplete="username"
            error={!!error} // Red border on error
            type="number"
            inputProps={{
              pattern: '[0-9]*',
              inputMode: 'numeric',
            }}
            variant="outlined"
            InputLabelProps={{
              style: { color: error ? '#f44336' : '' }, // Adjust label color on error
            }}
          />

          {/* Password Field with visibility toggle */}
          <TextField
            id="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            variant="outlined"
            className="mb-3" // Adds margin-bottom 3 to the input field
            autoComplete="current-password"
            error={!!error} // Red border on error
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={togglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Continue Button */}
          <button
            type="submit"
            className="w-full mt-4 py-3 bg-[#0F8420] text-white rounded-lg font-semibold hover:bg-green-700 transition-colors mb-3"
            onClick={handleContinueClick}
          >
            Continue
          </button>

          {/* Forgot Password link */}
          <button
            type="button"
            className="w-full text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
            onClick={handleForgotPassword}
          >
            Forgot Password?
          </button>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Login;
