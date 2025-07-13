import React, { useEffect, useState } from "react";

export default function UploadedFiles() {
  const [files, setFiles] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/events/ocr-participants/list")
      .then(res => res.json())
      .then(data => setFiles(data.files || []));
  }, []);

  return (
    <div>
      <h2>All Uploaded Files</h2>
      <table>
        <thead>
          <tr>
            <th>Preview</th>
            <th>Name</th>
            <th>Type</th>
            <th>Uploaded</th>
            <th>Download</th>
          </tr>
        </thead>
        <tbody>
          {files.map(file => (
            <tr key={file._id}>
              <td>
                {file.mimetype.startsWith("image/") ? (
                  <img src={`/api/events/ocr-participants/download?id=${file._id}`} alt={file.filename} width={80} />
                ) : file.mimetype === "application/pdf" ? (
                  <embed src={`/api/events/ocr-participants/download?id=${file._id}`} type="application/pdf" width="80" height="80" />
                ) : (
                  <span>—</span>
                )}
              </td>
              <td>{file.filename}</td>
              <td>{file.mimetype}</td>
              <td>{new Date(file.uploadedAt).toLocaleString()}</td>
              <td>
                <a href={`/api/events/ocr-participants/download?id=${file._id}`} download={file.filename} target="_blank" rel="noopener noreferrer">
                  Download
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 