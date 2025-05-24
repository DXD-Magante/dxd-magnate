import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://bpwolooauknqwgcefpra.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwd29sb29hdWtucXdnY2VmcHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxOTQ2MTQsImV4cCI6MjA2Mjc3MDYxNH0.UpUUZsOUyqmIrD97_2H5tf9xWr0TdLvFEw_ZtZ7fDm8";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function PublicUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [publicUrl, setPublicUrl] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file.");
      return;
    }

    // Client-side file type validation
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG, and PDF files are allowed.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      // Generate unique filename
      const fileName = `public_uploads/${Date.now()}_${file.name}`;

      // Upload to Supabase
      const { error: uploadError } = await supabase.storage
        .from("dxdmagnatedocs") // Your bucket name
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("dxdmagnatedocs")
        .getPublicUrl(fileName);

      setPublicUrl(publicUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h2>Public File Upload</h2>
      <input 
        type="file" 
        onChange={(e) => setFile(e.target.files[0])} 
        disabled={uploading}
      />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {publicUrl && (
        <div>
          <p>Upload successful! File URL:</p>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer">
            {publicUrl}
          </a>
        </div>
      )}
    </div>
  );
}