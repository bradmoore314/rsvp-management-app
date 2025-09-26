#!/usr/bin/env node

/**
 * UI Fix Script
 * 
 * This script fixes the host dashboard UI to include the Google Drive hosting checkbox
 */

const fs = require('fs');
const path = require('path');

function fixHostDashboardUI() {
    const filePath = path.join(__dirname, 'public', 'js', 'host-dashboard.js');
    
    try {
        console.log('🔧 Fixing host dashboard UI...');
        
        // Read the file
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Find the modal HTML section and add the Google Drive checkbox
        const searchPattern = /(<div class="form-group">\s*<label for="baseUrl">Base URL \(for QR codes\)<\/label>\s*<input type="url" id="baseUrl" value="\$\{window\.location\.origin\}" required>\s*<\/div>\s*)(<\/div>\s*<div class="modal-footer">)/;
        
        const replacement = `$1
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="useGoogleDrive" checked>
                                Use Google Drive hosting (recommended for external access)
                            </label>
                            <p style="font-size: 0.875rem; color: #718096; margin-top: 4px;">
                                When enabled, RSVP forms are hosted on Google Drive and accessible from anywhere
                            </p>
                        </div>
                    $2`;
        
        if (content.match(searchPattern)) {
            content = content.replace(searchPattern, replacement);
            
            // Write the file back
            fs.writeFileSync(filePath, content, 'utf8');
            
            console.log('✅ Host dashboard UI fixed successfully!');
            console.log('   - Added Google Drive hosting checkbox');
            console.log('   - Checkbox is checked by default');
            console.log('   - Added explanatory text');
        } else {
            console.log('⚠️  Could not find the exact pattern to replace. The UI might already be fixed or the structure has changed.');
        }
        
    } catch (error) {
        console.error('❌ Failed to fix host dashboard UI:', error.message);
        process.exit(1);
    }
}

// Run the fix
if (require.main === module) {
    fixHostDashboardUI();
}

module.exports = fixHostDashboardUI;
