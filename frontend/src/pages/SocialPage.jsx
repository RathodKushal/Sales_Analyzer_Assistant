/**
 * SocialPage — AI Content Generation
 * ======================================
 * Interfaces with Gemini API to generate marketing copy and images.
 */

import { useState } from 'react';
import { socialAPI } from '../api/client';
import toast, { Toaster } from 'react-hot-toast';
import {
  HiOutlineSparkles,
  HiOutlineClipboardDocument,
  HiOutlineHashtag,
} from 'react-icons/hi2';

export default function SocialPage() {
  const [generating, setGenerating] = useState(false);
  const [platform, setPlatform] = useState('linkedin');
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('professional');
  
  const [result, setResult] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic) return;

    setGenerating(true);
    const toastId = toast.loading('Asking Gemini to generate content...');

    try {
      const response = await socialAPI.generateContent({
        platform,
        topic,
        tone,
      });
      
      setResult(response.data);
      toast.success(
        response.data.mock_mode 
          ? 'Generated successfully (Mock Fallback)' 
          : 'Generated successfully via Gemini API!', 
        { id: toastId }
      );
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate content', {
        id: toastId,
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!result?.content) return;
    navigator.clipboard.writeText(result.content);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="page-container fade-in">
      <Toaster position="top-right" toastOptions={{
        style: { background: 'var(--bg-secondary)', color: '#fff', border: '1px solid var(--border-color)' }
      }} />

      <header className="page-header">
        <h1>Social Media AI</h1>
        <p>Generate platform-optimized marketing content using Google Gemini.</p>
      </header>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {/* Form Section */}
        <div className="glass-card" style={{ flex: '1 1 400px' }}>
          <h2 className="mb-24" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <HiOutlineSparkles style={{ color: 'var(--accent-violet)' }} />
            Content Generator
          </h2>

          <form onSubmit={handleGenerate}>
            <div className="form-group">
              <label className="form-label">Platform</label>
              <select 
                className="form-select"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              >
                <option value="linkedin">LinkedIn</option>
                <option value="twitter">Twitter / X</option>
                <option value="instagram">Instagram (Caption)</option>
                <option value="email">Email Newsletter</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tone of Voice</label>
              <select 
                className="form-select"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                <option value="professional">Professional & Data-Driven</option>
                <option value="casual">Casual & Approachable</option>
                <option value="promotional">Promotional & Urgent</option>
                <option value="educational">Educational & Thought-Leadership</option>
              </select>
            </div>

            <div className="form-group mb-24">
              <label className="form-label">Topic / Key Highlights</label>
              <textarea 
                className="form-textarea"
                placeholder="E.g., We just achieved a 15% increase in conversion rates using dynamic discount optimization..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit"
              className="btn btn--primary" 
              disabled={generating || !topic}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {generating ? (
                <span className="spinner spinner--sm" />
              ) : (
                <>
                  <HiOutlineSparkles /> Generate Content
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output Section */}
        <div style={{ flex: '1 1 400px' }}>
          {result ? (
            <div className="glass-card slide-up" style={{ position: 'relative' }}>
              <div className="flex-between mb-16">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Generated Draft</h3>
                {result.mock_mode && (
                  <span className="badge badge--mock">Mock Data</span>
                )}
              </div>
              
              <div className="content-preview">
                <div className="content-preview__text">{result.content}</div>
                
                {result.hashtags && result.hashtags.length > 0 && (
                  <div className="content-preview__hashtags mt-16">
                    {result.hashtags.map((tag, idx) => (
                      <span key={idx} className="hashtag-chip">
                        <HiOutlineHashtag style={{ display: 'inline', marginRight: 2 }} />
                        {tag.replace('#', '')}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-20 flex-between">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Platform: <span style={{ textTransform: 'capitalize' }}>{platform}</span>
                </span>
                <button className="btn btn--secondary btn--sm" onClick={copyToClipboard}>
                  <HiOutlineClipboardDocument /> Copy
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div className="empty-state__icon"><HiOutlineSparkles /></div>
              <div className="empty-state__title">Awaiting Instructions</div>
              <div className="empty-state__desc">Fill out the form on the left to generate AI content for your social media channels.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
