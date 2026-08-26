/**
 * SalesPage — Sales Data Management
 * =====================================
 * Table view of sales records, with CSV upload functionality.
 */

import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { salesAPI } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import toast, { Toaster } from 'react-hot-toast';
import {
  HiOutlineDocumentArrowUp,
  HiOutlineFunnel,
  HiOutlineArrowDownTray,
} from 'react-icons/hi2';

export default function SalesPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRecords = async (pageNum = 1) => {
    setLoading(true);
    try {
      const response = await salesAPI.list(pageNum);
      setRecords(response.data.data);
      setTotalPages(response.data.total_pages);
      setPage(response.data.page);
    } catch (error) {
      toast.error('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    const toastId = toast.loading('Processing CSV upload...');

    try {
      const response = await salesAPI.upload(file);
      toast.success(`Successfully imported ${response.data.records_inserted} records!`, {
        id: toastId,
      });
      fetchRecords(1); // Refresh data
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Upload failed', {
        id: toastId,
      });
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false,
  });

  return (
    <div className="page-container fade-in">
      <Toaster position="top-right" toastOptions={{
        style: {
          background: 'var(--bg-secondary)',
          color: '#fff',
          border: '1px solid var(--border-color)',
        }
      }} />

      <header className="page-header">
        <h1>Sales Records</h1>
        <p>Manage and import your historical sales data for analysis.</p>
      </header>

      {/* Upload Section */}
      <div 
        {...getRootProps()} 
        className={`dropzone ${isDragActive ? 'dropzone--active' : ''} mb-24`}
        style={{ pointerEvents: uploading ? 'none' : 'auto', opacity: uploading ? 0.6 : 1 }}
      >
        <input {...getInputProps()} />
        <div className="dropzone__icon">
          <HiOutlineDocumentArrowUp />
        </div>
        <div className="dropzone__text">
          {isDragActive
            ? 'Drop the file here...'
            : 'Drag & drop a sales CSV or Excel file here, or click to select'}
        </div>
        <div className="dropzone__hint">
          Upload any CSV or Excel file. Our system will automatically map and analyze your data.
        </div>
      </div>

      {/* Data Table */}
      <div className="data-table-container">
        <div className="data-table-header">
          <div className="data-table-header__title">Recent Transactions</div>
          <div className="data-table-header__actions">
            <button className="btn btn--secondary btn--sm">
              <HiOutlineFunnel /> Filter
            </button>
            <button className="btn btn--secondary btn--sm">
              <HiOutlineArrowDownTray /> Export
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0' }}><LoadingSpinner /></div>
        ) : !records || records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon"><HiOutlineDocumentArrowUp /></div>
            <div className="empty-state__title">No sales data found</div>
            <div className="empty-state__desc">Upload a CSV or Excel file above to populate the database and train the agent.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Discount</th>
                  <th>Units</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>#{record.id}</td>
                    <td>{new Date(record.date).toLocaleDateString()}</td>
                    <td>{record.product_id}</td>
                    <td>
                      <span className="badge badge--viewer">{record.category}</span>
                    </td>
                    <td>₹{record.price.toFixed(2)}</td>
                    <td>{(record.discount_applied * 100).toFixed(0)}%</td>
                    <td>{record.units_sold}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      ₹{(record.price * (1 - record.discount_applied) * record.units_sold).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="data-table__pagination">
            <div>
              Showing page {page} of {totalPages}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                className="btn btn--secondary btn--sm"
                disabled={page === 1}
                onClick={() => fetchRecords(page - 1)}
              >
                Previous
              </button>
              <button 
                className="btn btn--secondary btn--sm"
                disabled={page === totalPages}
                onClick={() => fetchRecords(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
