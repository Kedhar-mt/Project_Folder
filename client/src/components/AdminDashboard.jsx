import { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import "../styles/AdminDashboard.css";
import api from "../utils/api";
import { handleLogout } from '../utils/api';
import { useNavigate } from "react-router-dom";


const AdminDashboard = () => {
  const navigate = useNavigate();
  const [folders, setFolders] = useState([]);
  const [folderName, setFolderName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState({});
  const [uploading, setUploading] = useState({});
  const [error, setError] = useState(null);
  const [editingImage, setEditingImage] = useState(null);
  const [newImageName, setNewImageName] = useState("");
  const [editingFolder, setEditingFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [excelFile, setExcelFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStatus, setUploadStatus] = useState(null);
  const [folderUpload, setFolderUpload] = useState(null);

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const response = await api.get("/api/folder");
      setFolders(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching folders:", err);
      setError(err.response?.data?.message || "An error occurred");
    }
  };

  const createFolder = async () => {
    try {
      const response = await api.post("/api/folder/create", {
        name: folderName,
      });
      setFolders([...folders, response.data.folder]);
      setFolderName("");
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
    }
  };

  const handleFileSelect = (folderId, files) => {
    setSelectedFiles({
      ...selectedFiles,
      [folderId]: Array.from(files),
    });
  };

  const handleFolderSelect = (e) => {
    const directory = e.target.files;
    setFolderUpload(directory);
  };

  const handleFolderUpload = async (folderId) => {
    if (!folderUpload || folderUpload.length === 0) {
      setError("Please select a folder to upload");
      return;
    }

    setUploading({ ...uploading, [folderId]: true });
    setError(null);

    try {
      const formData = new FormData();
      Array.from(folderUpload).forEach((file) => {
        formData.append("images", file);
      });

      await api.post(`/api/folder/upload/${folderId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setFolderUpload(null);
      await fetchFolders();
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
    } finally {
      setUploading({ ...uploading, [folderId]: false });
    }
  };

  const handleFileUpload = async (folderId) => {
    if (!selectedFiles[folderId] || selectedFiles[folderId].length === 0) {
      setError("Please select files to upload");
      return;
    }

    setUploading({ ...uploading, [folderId]: true });
    setUploadProgress({ ...uploadProgress, [folderId]: 0 });
    setError(null);

    try {
      const formData = new FormData();
      selectedFiles[folderId].forEach((file) => {
        formData.append("images", file);
      });

      await api.post(`/api/folder/upload/${folderId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSelectedFiles({
        ...selectedFiles,
        [folderId]: [],
      });

      await fetchFolders();
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
    } finally {
      setUploading({ ...uploading, [folderId]: false });
    }
  };

  const handleEditImageName = (folderId, imageId, currentName) => {
    setEditingImage({ folderId, imageId });
    setNewImageName(currentName);
  };

  const handleEditFolderName = (folderId, currentName) => {
    setEditingFolder(folderId);
    setNewFolderName(currentName);
  };

  const handleDeleteImage = async (folderId, imagePath) => {
    try {
      const response = await api.delete(`/api/folder/${folderId}/image`, {
        data: { imagePath },
      });

      if (response.data.folderDeleted) {
        setFolders(folders.filter((folder) => folder._id !== folderId));
      } else {
        await fetchFolders();
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
    }
  };

  const saveImageName = async (folderId, imageId) => {
    try {
      await api.put(`/api/folder/${folderId}/image/${imageId}`, {
        newName: newImageName,
      });

      setEditingImage(null);
      setNewImageName("");
      await fetchFolders();
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
    }
  };

  const saveFolderName = async (folderId) => {
    try {
      await api.put(`/api/folder/${folderId}`, {
        newName: newFolderName,
      });
      setEditingFolder(null);
      setNewFolderName("");
      await fetchFolders();
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
    }
  };

  const handleDeleteFolder = async (folderId) => {
    try {
      await api.delete(`/api/folder/${folderId}`);
      setFolders(folders.filter((folder) => folder._id !== folderId));
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
    }
  };

  const toggleFolder = async (id) => {
    try {
      const response = await api.put(`/api/folder/disable/${id}`);
      if (response.data) {
        await fetchFolders();
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
    }
  };

  const validateUserData = (user, index) => {
    const errors = [];

    // Username validation
    if (
      !user.username ||
      user.username.length < 3 ||
      user.username.length > 50
    ) {
      errors.push(
        `Row ${index + 1}: Username must be between 3 and 50 characters`
      );
    }

    // Email validation
    if (!user.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      errors.push(`Row ${index + 1}: Invalid email format`);
    }

    // Password validation
    if (!user.password || user.password.length < 8) {
      errors.push(
        `Row ${index + 1}: Password must be at least 8 characters long`
      );
    }

    // Phone validation
    if (!user.phone) {
      errors.push(`Row ${index + 1}: Phone number is required`);
    }

    return errors;
  };

  const handleExcelFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel"
      ) {
        setExcelFile(file);
        setUploadStatus(null);
        setUploadProgress(0);
      } else {
        setUploadStatus({
          type: "error",
          message: "Please upload only Excel files (.xlsx or .xls)",
        });
      }
    }
  };

  const handleExcelUpload = async () => {
    if (!excelFile) {
      setUploadStatus({
        type: "error",
        message: "Please select an Excel file first",
      });
      return;
    }

    try {
      setUploadProgress(10);
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: "binary" });
          setUploadProgress(30);

          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet, { raw: false }); // Changed to raw: false
          setUploadProgress(50);

          console.log("Parsed Excel Data:", jsonData); // Debug log

          // Process and validate data
          const validationErrors = [];
          const users = jsonData.map((row, index) => {
            // Ensure proper type conversion and handling of phone numbers
            const user = {
              username: String(row.username || "").trim(),
              email: String(row.email || "")
                .trim()
                .toLowerCase(),
              password: String(row.password || "").trim(),
              phone: String(row.phone || "").trim(), // Convert to string and trim
              role: "user",
            };

            console.log(`Processing row ${index + 1}:`, user); // Debug log

            const errors = validateUserData(user, index);
            validationErrors.push(...errors);

            return user;
          });

          if (validationErrors.length > 0) {
            setUploadStatus({
              type: "error",
              message: "Validation errors:",
              details: validationErrors,
            });
            setUploadProgress(0);
            return;
          }

          setUploadProgress(70);

          const response = await api.post("/api/folder/users/upload", users);
          setUploadProgress(100);

          setUploadStatus({
            type: "success",
            message: `Successfully registered ${users.length} users`,
          });
          setExcelFile(null);

          // Reset file input
          const fileInput = document.getElementById("excel-upload");
          if (fileInput) fileInput.value = "";
        } catch (error) {
          console.error("Error processing Excel:", error);
          setUploadStatus({
            type: "error",
            message:
              error.response?.data?.message ||
              "Error processing Excel file. Please check the format.",
          });
          setUploadProgress(0);
        }
      };

      reader.readAsBinaryString(excelFile);
    } catch (error) {
      console.error("Error uploading Excel:", error);
      setUploadStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          "Error uploading file. Please try again.",
      });
      setUploadProgress(0);
    }
  };
  const handleViewUsers = () => {
    navigate('/admin/users');
  };
  

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>
      <button onClick={handleLogout}>
        Logout
      </button>
      <button 
          onClick={handleViewUsers}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          View Users
        </button>

      {error && <div>{error}</div>}
      {/* Create Folder Section */}
      <div>
        <input
          type="text"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          placeholder="Folder Name"
          className="border rounded px-3 py-2 mr-2"
        />
        <button 
          onClick={createFolder}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Folder
        </button>
      </div>
      <div>
        <div>
          <h3>Bulk User Registration</h3>

          <div>
            <div>
              <label>Upload Excel File (.xlsx, .xls)</label>
              <p>Excel columns should be: username, phone, email, password</p>
              <input
                id="excel-upload"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleExcelFileChange}
              />
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div>
                <div style={{ width: `${uploadProgress}%` }}></div>
              </div>
            )}

            {uploadStatus && (
              <div>
                <p>{uploadStatus.message}</p>
                {uploadStatus.details && (
                  <ul>
                    {uploadStatus.details.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <button
              onClick={handleExcelUpload}
              disabled={
                !excelFile || (uploadProgress > 0 && uploadProgress < 100)
              }
            >
              {uploadProgress > 0 && uploadProgress < 100
                ? "Uploading..."
                : "Upload Excel"}
            </button>
          </div>
        </div>
      </div>
      {/* Folders List */}
      <div className="space-y-6">
        {folders.map((folder) => (
          <div key={folder._id} className="bg-white p-6 rounded-lg shadow-md">
            {editingFolder === folder._id ? (
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="border rounded px-3 py-2"
                />
                <button 
                  onClick={() => saveFolderName(folder._id)}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  {folder.name}
                  {folder.isDisabled && (
                    <span className="text-sm text-red-500 font-normal">
                      (Disabled - Only visible to admin)
                    </span>
                  )}
                </h3>
                <div className="space-x-2">
                  <button 
                    onClick={() => handleEditFolderName(folder._id, folder.name)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteFolder(folder._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                  <button 
                    onClick={() => toggleFolder(folder._id)}
                    className={`${folder.isDisabled ? 'bg-green-500' : 'bg-yellow-500'} text-white px-3 py-1 rounded hover:opacity-90`}
                  >
                    {folder.isDisabled ? "Enable" : "Disable"}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Folder Upload Section */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Upload Folder</h4>
                <div className="flex gap-2">
                  <input
                    type="file"
                    webkitdirectory=""
                    directory=""
                    multiple
                    onChange={handleFolderSelect}
                    disabled={uploading[folder._id]}
                    className="border rounded px-3 py-2"
                  />
                  <button
                    onClick={() => handleFolderUpload(folder._id)}
                    disabled={uploading[folder._id] || !folderUpload}
                    className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
                  >
                    {uploading[folder._id] ? "Uploading Folder..." : "Upload Folder"}
                  </button>
                </div>
              </div>

              {/* File Upload Section */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Upload Images</h4>
                <div className="flex gap-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileSelect(folder._id, e.target.files)}
                    disabled={uploading[folder._id]}
                    className="border rounded px-3 py-2"
                  />
                  <button
                    onClick={() => handleFileUpload(folder._id)}
                    disabled={uploading[folder._id] || !selectedFiles[folder._id]?.length}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    {uploading[folder._id] ? "Uploading..." : "Upload Images"}
                  </button>
                </div>
                
                {selectedFiles[folder._id]?.length > 0 && (
                  <div className="text-sm text-gray-600 mt-2">
                    Selected files: {selectedFiles[folder._id].length}
                  </div>
                )}

                {uploadProgress[folder._id] > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all"
                      style={{ width: `${uploadProgress[folder._id]}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Images Grid */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Images</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {folder.images?.map((image) => (
                    <div key={image._id} className="border rounded-lg p-2">
                      <img
                        src={`http://localhost:5000${image.path}`}
                        alt={image.name}
                        className="w-full h-32 object-cover rounded"
                      />
                      {editingImage?.imageId === image._id ? (
                        <div className="mt-2 space-y-2">
                          <input
                            type="text"
                            value={newImageName}
                            onChange={(e) => setNewImageName(e.target.value)}
                            placeholder="New name"
                            className="w-full border rounded px-2 py-1"
                          />
                          <div className="flex gap-2">
                            <button 
                              onClick={() => saveImageName(folder._id, image._id)}
                              className="bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600"
                            >
                              Save
                            </button>
                            <button 
                              onClick={() => setEditingImage(null)}
                              className="bg-gray-500 text-white px-2 py-1 rounded text-sm hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <p className="text-sm truncate">{image.name}</p>
                          <div className="flex gap-2 mt-1">
                            <button 
                              onClick={() => handleEditImageName(folder._id, image._id, image.name)}
                              className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteImage(folder._id, image.path)}
                              className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;