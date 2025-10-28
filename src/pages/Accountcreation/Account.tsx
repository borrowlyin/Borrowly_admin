
import React, { useState } from 'react';
import { Upload, Eye, EyeOff, Building2, User, Shield, Lock } from 'lucide-react';

const CreationForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    designation: '',
    profilePhoto: null,
    bankLogo: null,
    bankName: '',
    branchName: '',
    ifscCode: '',
    bankAddress: '',
    idProofType: '',
    dateAdded: new Date().toISOString().split('T')[0],
    allowedLoanTypes: [],
    password: '',
    newPassword: ''
  });

  const loanTypes = ['Personal Loan', 'Home Loan', 'Auto Loan', 'Business Loan', 'Education Loan', 'Gold Loan'];
  const idProofTypes = ['Aadhaar Card', 'PAN Card', 'Driving License', 'Passport', 'Voter ID'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, [fieldName]: file }));
    }
  };

  const handleLoanTypeToggle = (loanType) => {
    setFormData(prev => ({
      ...prev,
      allowedLoanTypes: prev.allowedLoanTypes.includes(loanType)
        ? prev.allowedLoanTypes.filter(t => t !== loanType)
        : [...prev.allowedLoanTypes, loanType]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.newPassword) {
      alert('Passwords do not match!');
      return;
    }

    if (formData.allowedLoanTypes.length === 0) {
      alert('Please select at least one loan type!');
      return;
    }

    console.log('Form submitted:', formData);
    alert('Bank account created successfully!');
    
    // Reset form
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      designation: '',
      profilePhoto: null,
      bankLogo: null,
      bankName: '',
      branchName: '',
      ifscCode: '',
      bankAddress: '',
      idProofType: '',
      dateAdded: new Date().toISOString().split('T')[0],
      allowedLoanTypes: [],
      password: '',
      newPassword: ''
    });
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        designation: '',
        profilePhoto: null,
        bankLogo: null,
        bankName: '',
        branchName: '',
        ifscCode: '',
        bankAddress: '',
        idProofType: '',
        dateAdded: new Date().toISOString().split('T')[0],
        allowedLoanTypes: [],
        password: '',
        newPassword: ''
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Building2 className="w-8 h-8" />
          Create Bank Account
        </h1>
     
      </div>

      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-blue-600">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Basic Personal Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Designation </label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'profilePhoto')}
                  className="hidden"
                  id="profilePhoto"
                />
                <label
                  htmlFor="profilePhoto"
                  className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition"
                >
                  <Upload className="w-5 h-5 mr-2 text-gray-500" />
                  <span className="text-gray-600">
                    {formData.profilePhoto ? formData.profilePhoto.name : 'Upload Photo'}
                  </span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bank Logo</label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'bankLogo')}
                  className="hidden"
                  id="bankLogo"
                />
                <label
                  htmlFor="bankLogo"
                  className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition"
                >
                  <Upload className="w-5 h-5 mr-2 text-gray-500" />
                  <span className="text-gray-600">
                    {formData.bankLogo ? formData.bankLogo.name : 'Upload Logo'}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-indigo-600">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-800">Bank Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name </label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Branch Name </label>
              <input
                type="text"
                name="branchName"
                value={formData.branchName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">IFSC/Bank Code </label>
              <input
                type="text"
                name="ifscCode"
                value={formData.ifscCode}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bank Address </label>
              <input
                type="text"
                name="bankAddress"
                value={formData.bankAddress}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-green-600">
            <Shield className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-800">Verification & Security</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ID Proof Type </label>
              <select
                name="idProofType"
                value={formData.idProofType}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select ID Proof</option>
                {idProofTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Added</label>
              <input
                type="date"
                name="dateAdded"
                value={formData.dateAdded}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">Allowed Loan Types </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {loanTypes.map(loanType => (
                  <label key={loanType} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allowedLoanTypes.includes(loanType)}
                      onChange={() => handleLoanTypeToggle(loanType)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{loanType}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-purple-600">
            <Lock className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-800">Password Setup</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
          {formData.password && formData.newPassword && formData.password !== formData.newPassword && (
            <p className="text-red-500 text-sm mt-2">Passwords do not match</p>
          )}
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition shadow-lg"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreationForm;


