import { useEffect, useState } from "react";
import api from "../utils/api";
import { handleLogout } from '../utils/api';

const UserDashboard = () => {
  const [folders, setFolders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        // Check if we have a token first
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("Not authenticated. Please log in again.");
          setLoading(false);
          return;
        }
        
        // Use the api instance with proper auth headers
        const response = await api.get("/api/folder");
        
        // Filter out disabled folders and folders without images
        const activeFolders = response.data.filter(
          (folder) =>
            !folder.isDisabled && folder.images && folder.images.length > 0
        );
        setFolders(activeFolders);
      } catch (err) {
        console.error("Error fetching folders:", err);
        
        // Check if it's an authentication error
        if (err.response?.status === 401) {
          setError("Authentication failed. Please log in again.");
          // Clear tokens and redirect to login
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("userRole");
          localStorage.removeItem("userId");
          // Optional: redirect to login
          // window.location.href = '/login';
        } else {
          setError(err.response?.data?.msg || "Error loading folders");
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchFolders();
  }, []);
  

  if (loading) return <div>Loading folders...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;
  
  return (
    <div className="dashboard-container">
      <h2>User Dashboard</h2>
      <button onClick={handleLogout} className="logout-button">Logout</button>
      {folders.length === 0 ? (
        <div className="no-content-message">No folders available</div>
      ) : (
        <div className="folders-grid">
          {folders.map((folder) => (
            <div key={folder._id} className="folder-card">
              <h3>{folder.name}</h3>
              <div className="images-container">
                {folder.images.map((img, idx) => (
                  <div key={idx} className="image-item">
                    <p className="image-name">{img.name}</p>
                    <img
                      src={`http://localhost:5000${img.path}`}
                      alt={img.name}
                      className="thumbnail"
                      width="100"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserDashboard;