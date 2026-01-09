import React, { useState } from "react";
import { Upload, Building2, User } from "lucide-react";

import { API_BASE_URL } from "@/lib/api";

const CreationForm = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    designation: "",
    profilePhoto: null,
    idProofFile: null,
    bankName: "",
    branchName: "",
    ifscCode: "",
    bankAddress: "",
    city: "",
    pincode: "",
    state: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData((prev) => ({ ...prev, [fieldName]: file }));
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel? All unsaved changes will be lost.")) {
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        designation: "",
        profilePhoto: null,
        idProofFile: null,
        bankName: "",
        branchName: "",
        ifscCode: "",
        bankAddress: "",
        city: "",
        pincode: "",
        state: "",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Get signed URLs
      const signedUrlRes = await fetch(`${API_BASE_URL}/api/GetBankSignedUrls`);
      const signedUrlData = await signedUrlRes.json();
      if (!signedUrlRes.ok) {
        alert("Failed to generate upload URLs");
        setLoading(false);
        return;
      }

      const { signedUrls, generatedBankId } = signedUrlData;

      // Step 2: Upload files
      const filesToUpload = [
        { field: "profilePhoto", type: "profilephoto" },
        { field: "idProofFile", type: "idproof" },
      ];

      const uploadedFiles = {};

      for (const { field } of filesToUpload) {
        const file = formData[field];
        const signedUrlObj =
          signedUrls[field === "profilePhoto" ? "profilePhoto" : "idProof"];
        if (file && signedUrlObj?.uploadUrl) {
          await fetch(signedUrlObj.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": "application/octet-stream" },
            body: file,
          });
          uploadedFiles[field] = signedUrlObj.publicUrl;
        }
      }

      // Step 3: Create bank account
      const response = await fetch(`${API_BASE_URL}/api/CreateBank`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname: formData.fullName,
          email: formData.email,
          phonenumber: formData.phone,
          designation: formData.designation,
          bankname: formData.bankName,
          branchname: formData.branchName,
          ifsccode: formData.ifscCode,
          bankaddress: formData.bankAddress,
          city: formData.city,
          pincode: formData.pincode,
          state: formData.state,
          profilephoto: uploadedFiles.profilePhoto || "",
          idprooffile: uploadedFiles.idProofFile || "",
          generatedBankId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Failed to create bank details");
        setLoading(false);
        return;
      }

      alert("✅ Bank account created successfully! Password will be sent via email.");
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        designation: "",
        profilePhoto: null,
        idProofFile: null,
        bankName: "",
        branchName: "",
        ifscCode: "",
        bankAddress: "",
        city: "",
        pincode: "",
        state: "",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Error creating bank account");
    } finally {
      setLoading(false);
    }
  };

  // File upload component
  const FileUploadInput = ({ label, fieldName, file }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(e, fieldName)}
          className="hidden"
          id={fieldName}
        />
        <label
          htmlFor={fieldName}
          className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition"
        >
          <Upload className="w-5 h-5 mr-2 text-gray-500" />
          <span className="text-gray-600">{file ? file.name : `Upload ${label}`}</span>
        </label>
        {file && (
          <img
            src={URL.createObjectURL(file)}
            alt="Preview"
            className="mt-2 w-24 h-24 object-cover rounded-md"
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          Create Bank Account
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="p-8">
        {/* Basic Personal Information */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-blue-600">
            <h2 className="text-xl font-semibold text-gray-800">Basic Personal Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <FileUploadInput
              label="Profile Photo"
              fieldName="profilePhoto"
              file={formData.profilePhoto}
            />
          </div>
        </div>

        {/* Bank Details */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-indigo-600">
            <h2 className="text-xl font-semibold text-gray-800">Bank Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Branch Name</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">IFSC/Bank Code</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Bank Address</label>
              <input
                type="text"
                name="bankAddress"
                value={formData.bankAddress}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <FileUploadInput
              label="ID Proof"
              fieldName="idProofFile"
              file={formData.idProofFile}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreationForm;
