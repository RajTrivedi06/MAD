# app/routes/testing_routes.py

from fastapi import APIRouter, UploadFile, File, HTTPException, status, Form
from fastapi.responses import HTMLResponse, JSONResponse
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
import json
import os
from supabase import create_client, Client

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter()

def get_supabase_client() -> Client:
    """Get Supabase client instance"""
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
    
    if not supabase_url or not supabase_key:
        return None
    
    return create_client(supabase_url, supabase_key)

@router.get("/", response_class=HTMLResponse)
async def testing_dashboard():
    """
    Comprehensive testing dashboard for both DARS and CV parsers.
    """
    
    html_content = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MadHelp Parser Testing Dashboard</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Arial', sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            
            .container {
                max-width: 1400px;
                margin: 0 auto;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            
            .header {
                background: linear-gradient(45deg, #667eea, #764ba2);
                color: white;
                padding: 30px;
                text-align: center;
            }
            
            .header h1 {
                font-size: 2.5em;
                margin-bottom: 10px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            
            .header p {
                font-size: 1.2em;
                opacity: 0.9;
            }
            
            .main-content {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                padding: 30px;
            }
            
            .parser-section {
                background: white;
                border-radius: 15px;
                padding: 25px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                border: 2px solid #f0f0f0;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            
            .parser-section:hover {
                transform: translateY(-5px);
                box-shadow: 0 15px 40px rgba(0,0,0,0.15);
            }
            
            .parser-section h2 {
                color: #333;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 3px solid #667eea;
                font-size: 1.8em;
            }
            
            .upload-area {
                border: 3px dashed #667eea;
                border-radius: 10px;
                padding: 30px;
                text-align: center;
                margin-bottom: 20px;
                background: #f8f9ff;
                transition: all 0.3s ease;
                cursor: pointer;
            }
            
            .upload-area:hover {
                border-color: #764ba2;
                background: #f0f4ff;
            }
            
            .upload-area.dragover {
                border-color: #28a745;
                background: #f0fff4;
            }
            
            input[type="file"] {
                display: none;
            }
            
            .upload-button {
                background: linear-gradient(45deg, #667eea, #764ba2);
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 25px;
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
                transition: all 0.3s ease;
                margin: 10px;
            }
            
            .upload-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
            }
            
            .test-options {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .test-option {
                background: #f8f9fa;
                border: 2px solid #e9ecef;
                border-radius: 10px;
                padding: 15px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .test-option:hover {
                border-color: #667eea;
                background: #f0f4ff;
            }
            
            .test-option.selected {
                border-color: #667eea;
                background: #e3f2fd;
            }
            
            .user-id-input {
                width: 100%;
                padding: 12px;
                border: 2px solid #e9ecef;
                border-radius: 8px;
                margin-bottom: 15px;
                font-size: 16px;
            }
            
            .user-id-input:focus {
                outline: none;
                border-color: #667eea;
            }
            
            .results-section {
                grid-column: 1 / -1;
                margin-top: 20px;
            }
            
            .results-container {
                background: white;
                border-radius: 15px;
                padding: 25px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                border: 2px solid #f0f0f0;
            }
            
            .results-container h3 {
                color: #333;
                margin-bottom: 20px;
                font-size: 1.6em;
                border-bottom: 2px solid #667eea;
                padding-bottom: 10px;
            }
            
            .json-display {
                background: #1e1e1e;
                color: #d4d4d4;
                border-radius: 10px;
                padding: 20px;
                font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                font-size: 14px;
                line-height: 1.5;
                overflow-x: auto;
                white-space: pre;
                max-height: 600px;
                overflow-y: auto;
                border: 1px solid #333;
            }
            
            .loading {
                display: none;
                text-align: center;
                padding: 20px;
            }
            
            .loading.show {
                display: block;
            }
            
            .spinner {
                border: 4px solid #f3f3f3;
                border-top: 4px solid #667eea;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .status-indicator {
                display: inline-block;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                margin-right: 8px;
            }
            
            .status-success { background-color: #28a745; }
            .status-error { background-color: #dc3545; }
            .status-warning { background-color: #ffc107; }
            
            .metadata-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .metadata-card {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid #667eea;
            }
            
            .metadata-card h4 {
                color: #333;
                margin-bottom: 5px;
                font-size: 0.9em;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .metadata-card p {
                color: #666;
                font-size: 1.1em;
                font-weight: bold;
            }
            
            .tabs {
                display: flex;
                border-bottom: 2px solid #e9ecef;
                margin-bottom: 20px;
            }
            
            .tab {
                background: none;
                border: none;
                padding: 12px 24px;
                cursor: pointer;
                font-size: 16px;
                border-bottom: 3px solid transparent;
                transition: all 0.3s ease;
            }
            
            .tab:hover {
                background: #f8f9fa;
            }
            
            .tab.active {
                border-bottom-color: #667eea;
                color: #667eea;
                font-weight: bold;
            }
            
            .tab-content {
                display: none;
            }
            
            .tab-content.active {
                display: block;
            }
            
            @media (max-width: 768px) {
                .main-content {
                    grid-template-columns: 1fr;
                }
                
                .test-options {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🧪 MadHelp Parser Testing Dashboard</h1>
                <p>Test and validate DARS and CV parsing functionality</p>
            </div>
            
            <div class="main-content">
                <!-- DARS Parser Section -->
                <div class="parser-section">
                    <h2>📊 DARS Parser</h2>
                    
                    <div class="upload-area" onclick="document.getElementById('dars-file').click()">
                        <div style="font-size: 2em; margin-bottom: 10px;">📄</div>
                        <p><strong>Click to upload DARS PDF</strong></p>
                        <p style="color: #666; margin-top: 5px;">Or drag and drop your DARS file here</p>
                        <input type="file" id="dars-file" accept=".pdf" onchange="handleDarsUpload(event)">
                    </div>
                    
                    <div class="test-options">
                        <div class="test-option selected" onclick="selectDarsOption('full')" id="dars-full">
                            <strong>Full Parse</strong><br>
                            <small>Complete analysis with storage</small>
                        </div>
                        <div class="test-option" onclick="selectDarsOption('summary')" id="dars-summary">
                            <strong>Summary Only</strong><br>
                            <small>Quick overview</small>
                        </div>
                        <div class="test-option" onclick="selectDarsOption('validate')" id="dars-validate">
                            <strong>Validate</strong><br>
                            <small>Check format only</small>
                        </div>
                        <div class="test-option" onclick="selectDarsOption('text')" id="dars-text">
                            <strong>Text Mode</strong><br>
                            <small>Paste DARS text</small>
                        </div>
                    </div>
                    
                    <input type="text" class="user-id-input" id="dars-user-id" placeholder="User ID (optional for storage)">
                    
                    <div id="dars-text-area" style="display: none;">
                        <textarea id="dars-text-input" placeholder="Paste DARS text here..." style="width: 100%; height: 200px; padding: 15px; border: 2px solid #e9ecef; border-radius: 8px; font-family: monospace;"></textarea>
                    </div>
                </div>
                
                <!-- CV Parser Section -->
                <div class="parser-section">
                    <h2>📝 CV Parser</h2>
                    
                    <div class="upload-area" onclick="document.getElementById('cv-file').click()">
                        <div style="font-size: 2em; margin-bottom: 10px;">📋</div>
                        <p><strong>Click to upload CV/Resume PDF</strong></p>
                        <p style="color: #666; margin-top: 5px;">Or drag and drop your CV file here</p>
                        <input type="file" id="cv-file" accept=".pdf" onchange="handleCvUpload(event)">
                    </div>
                    
                    <div class="test-options">
                        <div class="test-option selected" onclick="selectCvOption('full')" id="cv-full">
                            <strong>Full Parse</strong><br>
                            <small>Complete processing with OpenAI</small>
                        </div>
                        <div class="test-option" onclick="selectCvOption('text-only')" id="cv-text-only">
                            <strong>Text Only</strong><br>
                            <small>Extract and clean text</small>
                        </div>
                        <div class="test-option" onclick="selectCvOption('validate')" id="cv-validate">
                            <strong>Validate</strong><br>
                            <small>Check if processable</small>
                        </div>
                        <div class="test-option" onclick="selectCvOption('structure-text')" id="cv-structure-text">
                            <strong>Structure Text</strong><br>
                            <small>OpenAI structuring only</small>
                        </div>
                    </div>
                    
                    <input type="text" class="user-id-input" id="cv-user-id" placeholder="User ID (optional for storage)">
                    
                    <div id="cv-text-area" style="display: none;">
                        <textarea id="cv-text-input" placeholder="Paste cleaned CV text here..." style="width: 100%; height: 200px; padding: 15px; border: 2px solid #e9ecef; border-radius: 8px; font-family: monospace;"></textarea>
                    </div>
                </div>
                
                <!-- Results Section -->
                <div class="results-section">
                    <div class="results-container">
                        <h3>🔍 Results & Analysis</h3>
                        
                        <div class="loading" id="loading">
                            <div class="spinner"></div>
                            <p>Processing your file... This may take a moment.</p>
                        </div>
                        
                        <div id="results-content" style="display: none;">
                            <div class="tabs">
                                <button class="tab active" onclick="switchTab('overview')">Overview</button>
                                <button class="tab" onclick="switchTab('raw-response')">Raw Response</button>
                                <button class="tab" onclick="switchTab('metadata')">Metadata</button>
                                <button class="tab" onclick="switchTab('validation')">Validation</button>
                            </div>
                            
                            <div id="tab-overview" class="tab-content active">
                                <div id="overview-content"></div>
                            </div>
                            
                            <div id="tab-raw-response" class="tab-content">
                                <div class="json-display" id="raw-json"></div>
                            </div>
                            
                            <div id="tab-metadata" class="tab-content">
                                <div id="metadata-content"></div>
                            </div>
                            
                            <div id="tab-validation" class="tab-content">
                                <div id="validation-content"></div>
                            </div>
                        </div>
                        
                        <div id="error-content" style="display: none;">
                            <div style="background: #fff5f5; border: 2px solid #feb2b2; border-radius: 8px; padding: 20px; margin-top: 20px;">
                                <h3 style="color: #c53030; margin-bottom: 10px;">❌ Processing Error</h3>
                                <p id="error-message" style="color: #742a2a;"></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
            let selectedDarsOption = 'full';
            let selectedCvOption = 'full';
            
            // DARS Option Selection
            function selectDarsOption(option) {
                document.querySelectorAll('.parser-section:first-of-type .test-option').forEach(el => {
                    el.classList.remove('selected');
                });
                document.getElementById('dars-' + option).classList.add('selected');
                selectedDarsOption = option;
                
                // Show/hide text area for text mode
                const textArea = document.getElementById('dars-text-area');
                if (option === 'text') {
                    textArea.style.display = 'block';
                } else {
                    textArea.style.display = 'none';
                }
            }
            
            // CV Option Selection
            function selectCvOption(option) {
                document.querySelectorAll('.parser-section:last-of-type .test-option').forEach(el => {
                    el.classList.remove('selected');
                });
                document.getElementById('cv-' + option).classList.add('selected');
                selectedCvOption = option;
                
                // Show/hide text area for structure-text mode
                const textArea = document.getElementById('cv-text-area');
                if (option === 'structure-text') {
                    textArea.style.display = 'block';
                } else {
                    textArea.style.display = 'none';
                }
            }
            
            // File Upload Handlers
            function handleDarsUpload(event) {
                const file = event.target.files[0];
                if (file) {
                    processDarsFile(file);
                }
            }
            
            function handleCvUpload(event) {
                const file = event.target.files[0];
                if (file) {
                    processCvFile(file);
                }
            }
            
            // DARS Processing
            async function processDarsFile(file) {
                showLoading();
                
                const formData = new FormData();
                formData.append('file', file);
                
                const userId = document.getElementById('dars-user-id').value;
                if (userId) {
                    formData.append('user_id', userId);
                }
                
                let endpoint = '/api/dars/parse';
                
                switch (selectedDarsOption) {
                    case 'summary':
                        endpoint = '/api/dars/parse/summary';
                        break;
                    case 'validate':
                        endpoint = '/api/dars/validate';
                        break;
                    case 'text':
                        await processDarsText();
                        return;
                }
                
                try {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        body: formData
                    });
                    
                    const result = await response.json();
                    displayResults(result, 'DARS', selectedDarsOption);
                } catch (error) {
                    displayError('Failed to process DARS file: ' + error.message);
                }
            }
            
            async function processDarsText() {
                const text = document.getElementById('dars-text-input').value;
                if (!text.trim()) {
                    displayError('Please enter DARS text content');
                    return;
                }
                
                try {
                    const response = await fetch('/api/dars/parse/text', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ text: text })
                    });
                    
                    const result = await response.json();
                    displayResults(result, 'DARS', 'text');
                } catch (error) {
                    displayError('Failed to process DARS text: ' + error.message);
                }
            }
            
            // CV Processing
            async function processCvFile(file) {
                showLoading();
                
                const formData = new FormData();
                formData.append('file', file);
                
                const userId = document.getElementById('cv-user-id').value;
                if (userId) {
                    formData.append('user_id', userId);
                }
                
                let endpoint = '/api/cv/parse';
                
                switch (selectedCvOption) {
                    case 'text-only':
                        endpoint = '/api/cv/parse/text-only';
                        break;
                    case 'validate':
                        endpoint = '/api/cv/validate';
                        break;
                    case 'structure-text':
                        await processCvText();
                        return;
                }
                
                try {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        body: formData
                    });
                    
                    const result = await response.json();
                    displayResults(result, 'CV', selectedCvOption);
                } catch (error) {
                    displayError('Failed to process CV file: ' + error.message);
                }
            }
            
            async function processCvText() {
                const text = document.getElementById('cv-text-input').value;
                if (!text.trim()) {
                    displayError('Please enter cleaned CV text content');
                    return;
                }
                
                try {
                    const response = await fetch('/api/cv/structure-text', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ text: text })
                    });
                    
                    const result = await response.json();
                    displayResults(result, 'CV', 'structure-text');
                } catch (error) {
                    displayError('Failed to structure CV text: ' + error.message);
                }
            }
            
            // Results Display
            function showLoading() {
                document.getElementById('loading').classList.add('show');
                document.getElementById('results-content').style.display = 'none';
                document.getElementById('error-content').style.display = 'none';
            }
            
            function displayResults(data, type, option) {
                document.getElementById('loading').classList.remove('show');
                document.getElementById('results-content').style.display = 'block';
                document.getElementById('error-content').style.display = 'none';
                
                // Raw JSON
                document.getElementById('raw-json').textContent = JSON.stringify(data, null, 2);
                
                // Overview
                displayOverview(data, type, option);
                
                // Metadata
                displayMetadata(data, type);
                
                // Validation
                displayValidation(data, type);
            }
            
            function displayOverview(data, type, option) {
                const overviewDiv = document.getElementById('overview-content');
                let html = '';
                
                if (type === 'DARS') {
                    const darsData = data.dars_data || data;
                    if (darsData.student_info) {
                        html += `
                            <div class="metadata-grid">
                                <div class="metadata-card">
                                    <h4>Student Name</h4>
                                    <p>${darsData.student_info.name || 'Not found'}</p>
                                </div>
                                <div class="metadata-card">
                                    <h4>Student ID</h4>
                                    <p>${darsData.student_info.student_id || 'Not found'}</p>
                                </div>
                                <div class="metadata-card">
                                    <h4>Program</h4>
                                    <p>${darsData.student_info.program_code || 'Not found'}</p>
                                </div>
                                <div class="metadata-card">
                                    <h4>GPA</h4>
                                    <p>${darsData.gpa_info?.gpa || 'Not found'}</p>
                                </div>
                            </div>
                        `;
                        
                        if (darsData.courses && darsData.courses.length > 0) {
                            html += `<h4>📚 Courses Found: ${darsData.courses.length}</h4>`;
                            html += '<div style="max-height: 200px; overflow-y: auto; background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px;">';
                            darsData.courses.slice(0, 10).forEach(course => {
                                html += `<div style="margin-bottom: 5px;"><strong>${course.subject}${course.number}</strong> - ${course.title} (${course.credits} cr, ${course.grade})</div>`;
                            });
                            if (darsData.courses.length > 10) {
                                html += `<div style="color: #666; font-style: italic;">... and ${darsData.courses.length - 10} more courses</div>`;
                            }
                            html += '</div>';
                        }
                    }
                } else if (type === 'CV') {
                    const cvData = data.structured_data || data;
                    if (cvData.personal_info) {
                        html += `
                            <div class="metadata-grid">
                                <div class="metadata-card">
                                    <h4>Name</h4>
                                    <p>${cvData.personal_info.name || 'Not found'}</p>
                                </div>
                                <div class="metadata-card">
                                    <h4>Professional Title</h4>
                                    <p>${cvData.personal_info.professional_title || 'Not specified'}</p>
                                </div>
                                <div class="metadata-card">
                                    <h4>Education Entries</h4>
                                    <p>${cvData.education?.length || 0}</p>
                                </div>
                                <div class="metadata-card">
                                    <h4>Experience Entries</h4>
                                    <p>${cvData.experience?.length || 0}</p>
                                </div>
                            </div>
                        `;
                        
                        if (cvData.skills && Object.keys(cvData.skills).length > 0) {
                            html += '<h4>🛠️ Skills Categories</h4>';
                            html += '<div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px;">';
                            Object.entries(cvData.skills).forEach(([category, skills]) => {
                                if (skills && skills.length > 0) {
                                    html += `<div style="margin-bottom: 10px;"><strong>${category.replace('_', ' ').toUpperCase()}:</strong> ${skills.join(', ')}</div>`;
                                }
                            });
                            html += '</div>';
                        }
                    }
                    
                    // Show text extraction results for text-only mode
                    if (option === 'text-only' && data.raw_text) {
                        html += `
                            <h4>📄 Text Extraction Results</h4>
                            <div class="metadata-grid">
                                <div class="metadata-card">
                                    <h4>Raw Text Length</h4>
                                    <p>${data.raw_text.length} characters</p>
                                </div>
                                <div class="metadata-card">
                                    <h4>Cleaned Text Length</h4>
                                    <p>${data.cleaned_text.length} characters</p>
                                </div>
                                <div class="metadata-card">
                                    <h4>Reduction</h4>
                                    <p>${data.text_stats?.reduction_percentage?.toFixed(1) || 0}%</p>
                                </div>
                                <div class="metadata-card">
                                    <h4>PII Removed</h4>
                                    <p>${data.pii_removed?.length || 0} types</p>
                                </div>
                            </div>
                        `;
                        
                        if (data.pii_removed && data.pii_removed.length > 0) {
                            html += `<div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-top: 10px; border-left: 4px solid #ffc107;">`;
                            html += `<strong>🔒 PII Removed:</strong> ${data.pii_removed.join(', ')}`;
                            html += `</div>`;
                        }
                    }
                }
                
                if (data.stored_in_profile) {
                    html += `<div style="background: #d4edda; padding: 15px; border-radius: 8px; margin-top: 15px; border-left: 4px solid #28a745;">`;
                    html += `<strong>✅ Successfully stored in user profile</strong>`;
                    html += `</div>`;
                }
                
                overviewDiv.innerHTML = html || '<p>No overview data available</p>';
            }
            
            function displayMetadata(data, type) {
                const metadataDiv = document.getElementById('metadata-content');
                let html = '<div class="metadata-grid">';
                
                const metadata = data.processing_metadata || data.file_metadata || data.file_info;
                if (metadata) {
                    Object.entries(metadata).forEach(([key, value]) => {
                        if (value !== null && value !== undefined) {
                            html += `
                                <div class="metadata-card">
                                    <h4>${key.replace('_', ' ').toUpperCase()}</h4>
                                    <p>${typeof value === 'object' ? JSON.stringify(value) : value}</p>
                                </div>
                            `;
                        }
                    });
                }
                
                html += '</div>';
                metadataDiv.innerHTML = html;
            }
            
            function displayValidation(data, type) {
                const validationDiv = document.getElementById('validation-content');
                let html = '';
                
                const warnings = data.warnings || data.validation_warnings || (data.parsing_metadata && data.parsing_metadata.warnings) || [];
                const errors = data.errors || [];
                
                if (data.success !== false && errors.length === 0) {
                    html += `<div style="background: #d4edda; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">`;
                    html += `<span class="status-indicator status-success"></span><strong>✅ Processing Successful</strong>`;
                    html += `</div>`;
                }
                
                if (warnings.length > 0) {
                    html += `<div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-top: 10px; border-left: 4px solid #ffc107;">`;
                    html += `<span class="status-indicator status-warning"></span><strong>⚠️ Warnings (${warnings.length})</strong><ul style="margin-top: 10px;">`;
                    warnings.forEach(warning => {
                        html += `<li>${warning}</li>`;
                    });
                    html += `</ul></div>`;
                }
                
                if (errors.length > 0) {
                    html += `<div style="background: #f8d7da; padding: 15px; border-radius: 8px; margin-top: 10px; border-left: 4px solid #dc3545;">`;
                    html += `<span class="status-indicator status-error"></span><strong>❌ Errors (${errors.length})</strong><ul style="margin-top: 10px;">`;
                    errors.forEach(error => {
                        html += `<li>${error}</li>`;
                    });
                    html += `</ul></div>`;
                }
                
                if (warnings.length === 0 && errors.length === 0) {
                    html += '<p>No validation issues found.</p>';
                }
                
                validationDiv.innerHTML = html;
            }
            
            function displayError(message) {
                document.getElementById('loading').classList.remove('show');
                document.getElementById('results-content').style.display = 'none';
                document.getElementById('error-content').style.display = 'block';
                document.getElementById('error-message').textContent = message;
            }
            
            // Tab Switching
            function switchTab(tabName) {
                document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                
                document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
                document.getElementById(`tab-${tabName}`).classList.add('active');
            }
            
            // Drag and Drop Support
            function setupDragAndDrop() {
                const uploadAreas = document.querySelectorAll('.upload-area');
                
                uploadAreas.forEach(area => {
                    area.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        area.classList.add('dragover');
                    });
                    
                    area.addEventListener('dragleave', (e) => {
                        e.preventDefault();
                        area.classList.remove('dragover');
                    });
                    
                    area.addEventListener('drop', (e) => {
                        e.preventDefault();
                        area.classList.remove('dragover');
                        
                        const files = e.dataTransfer.files;
                        if (files.length > 0) {
                            const file = files[0];
                            if (file.type === 'application/pdf') {
                                if (area.querySelector('#dars-file')) {
                                    processDarsFile(file);
                                } else {
                                    processCvFile(file);
                                }
                            } else {
                                alert('Please upload a PDF file only.');
                            }
                        }
                    });
                });
            }
            
            // Initialize
            document.addEventListener('DOMContentLoaded', function() {
                setupDragAndDrop();
                selectDarsOption('full'); // Set default
                selectCvOption('full'); // Set default
            });
        </script>
    </body>
    </html>
    """
    
    return html_content

@router.get("/status")
async def get_system_status() -> Dict[str, Any]:
    """
    Get comprehensive system status for monitoring.
    
    Returns:
        Dict containing system health and configuration status
    """
    
    status = {
        'timestamp': datetime.now().isoformat(),
        'services': {},
        'dependencies': {},
        'database': {}
    }
    
    # Check OpenAI API key
    openai_key = os.getenv('OPENAI_API_KEY')
    status['dependencies']['openai'] = {
        'configured': bool(openai_key),
        'key_length': len(openai_key) if openai_key else 0,
        'status': 'ready' if openai_key else 'missing_key'
    }
    
    # Check Supabase
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
    supabase_configured = bool(supabase_url and supabase_key)
    
    status['dependencies']['supabase'] = {
        'configured': supabase_configured,
        'url_set': bool(supabase_url),
        'key_set': bool(supabase_key),
        'status': 'ready' if supabase_configured else 'missing_config'
    }
    
    # Test database connection
    if supabase_configured:
        try:
            supabase = get_supabase_client()
            # Try to query profiles table
            result = supabase.table('profiles').select('id').limit(1).execute()
            status['database']['connection'] = 'success'
            status['database']['profiles_table'] = 'accessible'
        except Exception as e:
            status['database']['connection'] = 'failed'
            status['database']['error'] = str(e)
    else:
        status['database']['connection'] = 'not_configured'
    
    # Service status
    status['services']['dars_parser'] = {
        'status': 'active',
        'version': '2.0.0',
        'endpoints': ['/parse', '/parse/text', '/parse/summary', '/validate', '/health']
    }
    
    status['services']['cv_parser'] = {
        'status': 'active' if openai_key else 'inactive',
        'version': '1.0.0',
        'endpoints': ['/parse', '/parse/text-only', '/structure-text', '/validate', '/health'],
        'dependency_status': 'ready' if openai_key else 'missing_openai_key'
    }
    
    # Overall health
    all_ready = (
        openai_key and 
        supabase_configured and 
        status['database'].get('connection') == 'success'
    )
    
    status['overall_health'] = 'healthy' if all_ready else 'degraded'
    status['ready_for_production'] = all_ready
    
    return status

@router.get("/profiles")
async def list_test_profiles() -> Dict[str, Any]:
    """
    List profiles with processing status for testing purposes.
    
    Returns:
        Dict containing profiles and their processing status
    """
    
    try:
        supabase = get_supabase_client()
        if not supabase:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Supabase not configured"
            )
        
        result = supabase.table('profiles').select('id, full_name, processing_status, created_at, updated_at').execute()
        
        profiles = []
        for profile in result.data:
            processing_status = profile.get('processing_status', {})
            profiles.append({
                'id': profile['id'],
                'full_name': profile.get('full_name'),
                'dars_status': processing_status.get('dars', 'not_uploaded'),
                'cv_status': processing_status.get('cv', 'not_uploaded'),
                'dars_processed_at': processing_status.get('dars_processed_at'),
                'cv_processed_at': processing_status.get('cv_processed_at'),
                'created_at': profile.get('created_at'),
                'updated_at': profile.get('updated_at')
            })
        
        return {
            'success': True,
            'profiles': profiles,
            'total_count': len(profiles),
            'summary': {
                'dars_uploaded': len([p for p in profiles if p['dars_status'] == 'completed']),
                'cv_uploaded': len([p for p in profiles if p['cv_status'] == 'completed']),
                'both_complete': len([p for p in profiles if p['dars_status'] == 'completed' and p['cv_status'] == 'completed'])
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to list profiles: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve profiles: {str(e)}"
        )

@router.delete("/profiles/{user_id}")
async def delete_test_profile(user_id: str) -> Dict[str, Any]:
    """
    Delete a test profile completely (for testing purposes only).
    
    Args:
        user_id: User ID to delete
        
    Returns:
        Dict containing deletion status
    """
    
    try:
        supabase = get_supabase_client()
        if not supabase:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Supabase not configured"
            )
        
        # Delete the profile
        result = supabase.table('profiles').delete().eq('id', user_id).execute()
        
        return {
            'success': True,
            'message': f'Profile {user_id} deleted successfully',
            'deleted_at': datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to delete profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete profile: {str(e)}"
        )

@router.post("/debug/profile-update")
async def debug_profile_update(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Debug endpoint to test profile updates directly
    """
    user_id = data.get('user_id')
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")
    
    try:
        supabase = get_supabase_client()
        if not supabase:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Supabase not configured"
            )
        
        # Test update with minimal data
        test_data = {
            'id': user_id,
            'dars_data': {'test': True, 'timestamp': datetime.now().isoformat()},
            'processing_status': {'dars': 'test_completed'},
            'updated_at': datetime.now().isoformat()
        }
        
        result = supabase.table('profiles').upsert(test_data).execute()
        
        return {
            'success': True,
            'result': result.data,
            'count': len(result.data) if result.data else 0
        }
    except Exception as e:
        logger.error(f"Debug update failed: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        }