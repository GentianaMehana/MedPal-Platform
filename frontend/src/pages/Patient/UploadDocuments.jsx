import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

const IconUpload = (p) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
  </svg>
);
const IconFile = (p) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <path d="M14 2v6h6"/>
  </svg>
);
const IconEdit = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconTrash = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
  </svg>
);
const IconEye = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconCheck = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>
  </svg>
);
const IconAlert = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
  </svg>
);
const IconSpinner = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: 'mp-spin 0.9s linear infinite' }}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.25" strokeWidth="2.5"/>
    <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

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
      const filePath = fileName;

      console.log("Uploading to path:", filePath);

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("Upload error details:", uploadError);

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

      setMessage({ text: "Document uploaded successfully.", type: "success" });
      setTitle("");
      setFile(null);
      fetchDocuments(patientId);

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
      const urlParts = fileUrl.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('documents') + 1).join('/');

      console.log("Deleting file at path:", filePath);

      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
      }

      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      setMessage({ text: "Document deleted.", type: "success" });
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
      setMessage({ text: "Title updated.", type: "success" });
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

  const alertClass =
    message.type === 'success' ? 'medical-alert-success' :
    message.type === 'warning' ? 'medical-alert-warning' : 'medical-alert-danger';

  return (
    <div className="container-fluid px-4 py-4" style={{ maxWidth: 860 }}>
      {/* Page header */}
      <div className="mb-4">
        <p className="mp-overline mb-1">Patient</p>
        <h1 className="mp-h2 mb-1">Medical documents</h1>
        <p className="mp-body" style={{ marginBottom: 0 }}>
          Upload and organize your medical files.
        </p>
      </div>

      {message.text && (
        <div className={`medical-alert ${alertClass} mb-4`}>
          <span className="medical-alert__icon">
            {message.type === 'success' ? <IconCheck /> : <IconAlert />}
          </span>
          <div>{message.text}</div>
        </div>
      )}

      {/* Upload */}
      <div className="medical-card mb-4" style={{ padding: 24 }}>
        <p className="mp-overline mb-3">Upload new document</p>
        <form onSubmit={handleUpload}>
          <div className="mb-3">
            <label className="medical-label">Document title <span className="required">*</span></label>
            <input
              type="text"
              className="medical-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Blood test results"
              required
            />
          </div>

          <div className="mb-3">
            <label className="medical-label">File <span className="required">*</span></label>
            <input
              type="file"
              className="medical-input"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => setFile(e.target.files[0])}
              required
            />
            <span className="medical-hint">
              PDF, JPG, PNG, or DOC. Maximum 10MB.
            </span>
          </div>

          <button
            type="submit"
            className="medical-btn-primary w-100"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <IconSpinner size={16} color="#fff" />
                Uploading…
              </>
            ) : (
              <>
                <IconUpload />
                Upload document
              </>
            )}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="medical-card" style={{ padding: 24 }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <p className="mp-overline" style={{ marginBottom: 0 }}>Your documents</p>
          <span className="mp-badge mp-badge--neutral">{documents.length}</span>
        </div>

        {documents.length === 0 ? (
          <p className="mp-caption text-center py-4 mb-0">
            No documents uploaded yet.
          </p>
        ) : (
          <ul className="list-unstyled mb-0">
            {documents.map((doc, i) => (
              <li
                key={doc.id}
                style={{
                  padding: '14px 0',
                  borderTop: i === 0 ? 'none' : '1px solid var(--mp-border)',
                }}
              >
                {editingDoc?.id === doc.id ? (
                  <div className="d-flex gap-2">
                    <input
                      type="text"
                      className="medical-input flex-grow-1"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                    <button
                      type="button"
                      className="medical-btn-primary"
                      onClick={handleEditSubmit}
                      style={{ padding: '9px 14px', fontSize: 13 }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="medical-btn-outline"
                      onClick={() => setEditingDoc(null)}
                      style={{ padding: '9px 14px', fontSize: 13 }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
                    <div className="d-flex align-items-center gap-3" style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 9,
                          background: 'var(--mp-primary-light)',
                          color: 'var(--mp-primary)',
                          border: '1px solid var(--mp-primary-border)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <IconFile />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: 'var(--mp-text)',
                            letterSpacing: '-0.005em',
                            marginBottom: 2,
                          }}
                        >
                          {doc.title}
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--mp-text-muted)' }}>
                          {new Date(doc.created_at).toLocaleDateString()} · {formatFileSize(doc.file_size)}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="medical-btn-outline"
                        style={{ padding: '6px 10px', fontSize: 12.5 }}
                      >
                        <IconEye />
                        View
                      </a>
                      <button
                        type="button"
                        className="medical-btn-outline"
                        onClick={() => handleEdit(doc)}
                        style={{ padding: '6px 10px', fontSize: 12.5 }}
                      >
                        <IconEdit />
                      </button>
                      <button
                        type="button"
                        className="medical-btn-outline"
                        onClick={() => handleDelete(doc.id, doc.file_url)}
                        style={{ padding: '6px 10px', fontSize: 12.5, color: 'var(--mp-danger)' }}
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}