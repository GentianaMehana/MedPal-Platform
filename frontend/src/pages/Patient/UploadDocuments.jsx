import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";

export default function UploadDocuments() {
  const [documents, setDocuments] = useState([]);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [editingDoc, setEditingDoc] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [patientId, setPatientId] = useState(null);

  useEffect(() => {
    getPatientId();
  }, []);

  const getPatientId = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (patientError) throw patientError;
      
      if (patient) {
        setPatientId(patient.id);
        fetchDocuments(patient.id);
      } else {
        console.log("Patient not found for user_id:", user.id);
      }
    } catch (err) {
      console.error("Error getting patient id:", err);
    }
  };

  const fetchDocuments = async (pId) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('patient_id', pId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error("Error fetching documents:", err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title || !file) {
      setMessage({ text: "Title and file are required", type: "warning" });
      return;
    }

    if (!patientId) {
      setMessage({ text: "Patient not found", type: "danger" });
      return;
    }

    setUploading(true);
    setMessage({ text: "", type: "" });

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${patientId}/${Date.now()}.${fileExt}`;
      const filePath = fileName;  // Pa 'patient-documents/' para

      console.log("Uploading to path:", filePath);

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("Upload error details:", uploadError);
        
        // Kontrollo nëse bucket-i ekziston
        if (uploadError.message.includes("Bucket not found")) {
          throw new Error("Storage bucket 'documents' not found. Please create it in Supabase dashboard.");
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      console.log("File uploaded, public URL:", publicUrl);

      const { error: dbError } = await supabase
        .from('documents')
        .insert([{
          title,
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          patient_id: patientId,
        }]);

      if (dbError) throw dbError;

      setMessage({ text: "✅ Document uploaded successfully!", type: "success" });
      setTitle("");
      setFile(null);
      fetchDocuments(patientId);
      
      // Reset file input
      e.target.reset();
    } catch (err) {
      console.error("Upload error:", err);
      setMessage({ text: err.message, type: "danger" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, fileUrl) => {
    if (!window.confirm("Delete this document?")) return;

    try {
      // Extract file path from URL
      const urlParts = fileUrl.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('documents') + 1).join('/');
      
      console.log("Deleting file at path:", filePath);

      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
        // Vazhdo edhe nëse storage dështon - të paktën fshij nga database
      }

      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      setMessage({ text: "✅ Document deleted", type: "success" });
      if (patientId) fetchDocuments(patientId);
    } catch (err) {
      console.error("Delete error:", err);
      setMessage({ text: err.message, type: "danger" });
    }
  };

  const handleEdit = (doc) => {
    setEditingDoc(doc);
    setEditTitle(doc.title);
  };

  const handleEditSubmit = async () => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ title: editTitle })
        .eq('id', editingDoc.id);

      if (error) throw error;

      setEditingDoc(null);
      setMessage({ text: "✅ Title updated", type: "success" });
      if (patientId) fetchDocuments(patientId);
    } catch (err) {
      setMessage({ text: err.message, type: "danger" });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="container-fluid px-4" style={{ maxWidth: "800px" }}>
      <h2 className="medical-label text-center mb-4">📎 Medical Documents</h2>

      {message.text && (
        <div className={`alert alert-${message.type} alert-dismissible fade show`}>
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage({ text: "", type: "" })}></button>
        </div>
      )}

      <div className="medical-card mb-4">
        <h5 className="medical-label mb-3">Upload New Document</h5>
        <form onSubmit={handleUpload}>
          <div className="mb-3">
            <label className="medical-label">Document Title</label>
            <input
              type="text"
              className="medical-input w-100"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Blood Test Results"
              required
            />
          </div>
          <div className="mb-3">
            <label className="medical-label">Choose File</label>
            <input
              type="file"
              className="medical-input w-100"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => setFile(e.target.files[0])}
              required
            />
            <small className="text-muted">
              Supported formats: PDF, JPG, PNG, DOC (Max 10MB)
            </small>
          </div>
          <button
            type="submit"
            className="medical-btn-primary w-100 py-2"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Uploading...
              </>
            ) : (
              '📤 Upload Document'
            )}
          </button>
        </form>
      </div>

      <h5 className="medical-label mb-3">Your Documents</h5>
      {documents.length === 0 ? (
        <div className="medical-card text-center py-4">
          <p className="text-muted mb-0">No documents uploaded yet</p>
        </div>
      ) : (
        <div className="list-group">
          {documents.map((doc) => (
            <div key={doc.id} className="list-group-item medical-card mb-2">
              {editingDoc?.id === doc.id ? (
                <div className="d-flex gap-2">
                  <input
                    type="text"
                    className="medical-input flex-grow-1"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <button
                    className="medical-btn-primary btn-sm"
                    onClick={handleEditSubmit}
                  >
                    Save
                  </button>
                  <button
                    className="medical-btn-outline btn-sm"
                    onClick={() => setEditingDoc(null)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-3">
                    <div className="fs-2">📄</div>
                    <div>
                      <h6 className="mb-1">{doc.title}</h6>
                      <small className="text-muted">
                        {new Date(doc.created_at).toLocaleDateString()} • {formatFileSize(doc.file_size)}
                      </small>
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-success"
                    >
                      View
                    </a>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleEdit(doc)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(doc.id, doc.file_url)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}