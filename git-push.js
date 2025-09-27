const { execSync } = require('child_process');
const path = require('path');

const projectPath = "/home/linux/Fun Apps/Kathleen's App";

try {
    console.log('🚀 Starting git push process...');
    
    // Change to project directory
    process.chdir(projectPath);
    console.log(`📁 Changed to directory: ${projectPath}`);
    
    // Add all files
    console.log('📝 Adding files to git...');
    execSync('git add .', { stdio: 'inherit' });
    
    // Commit with message
    console.log('💾 Committing changes...');
    const commitMessage = `Beautiful RSVP Form - Single Screen Design

- Complete redesign of RSVP form to eliminate scrolling
- Modern gradient background with glass-morphism effect  
- Compact grid layout with side-by-side fields
- Beautiful attendance options (Yes! 🎉, No 😔, Maybe)
- Event info card with emojis (📅, 🕐, 📍, 👤)
- Enhanced debugging and error handling
- Fixed form submission with proper validation
- Mobile responsive design for all devices
- Professional single-screen user experience`;
    
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
    
    // Push to GitHub
    console.log('🚀 Pushing to GitHub...');
    execSync('git push origin main', { stdio: 'inherit' });
    
    console.log('✅ Successfully pushed to GitHub!');
    
} catch (error) {
    console.error('❌ Error during git push:', error.message);
    process.exit(1);
}
